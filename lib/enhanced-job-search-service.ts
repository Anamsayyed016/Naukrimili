/**
 * Enhanced Job Search Service - Implements the Country Priority Algorithm
 * Two-phase fetch: Local jobs first + Country fallback
 */

import { enhancedJobService, JobFilters, JobSummary } from './enhanced-job-service';
import { LocationService } from './location-service';
import { 
  JobSearchParams, 
  UserLocationData, 
  JobSearchResponse, 
  DEFAULT_COUNTRY_CONFIG,
  CountryPriorityConfig 
} from '@/types/job-search-params';
import { PaginationParams } from './database-service';

export class EnhancedJobSearchService {
  private static instance: EnhancedJobSearchService;
  private countryConfig: CountryPriorityConfig;

  constructor(config?: CountryPriorityConfig) {
    this.countryConfig = config || DEFAULT_COUNTRY_CONFIG;
  }

  static getInstance(): EnhancedJobSearchService {
    if (!this.instance) {
      this.instance = new EnhancedJobSearchService();
    }
    return this.instance;
  }

  /**
   * Main search method implementing the country priority algorithm
   */
  async searchJobsWithPriority(
    params: JobSearchParams,
    userLocation?: UserLocationData,
    request?: Request
  ): Promise<JobSearchResponse> {
    try {
      // Step 1: Determine user location if not provided
      if (!userLocation && request) {
        userLocation = await LocationService.getLocationFromIP(request);
      }

      // Step 2: Determine search strategy
      const strategy = this.determineSearchStrategy(params, userLocation);
      
      // Step 3: Execute two-phase search
      const searchResult = await this.executeTwoPhaseFetch(params, strategy, userLocation);

      return {
        success: true,
        message: `Found ${searchResult.total} jobs`,
        jobs: searchResult.jobs,
        pagination: searchResult.pagination,
        filters: this.buildFiltersResponse(params),
        location_info: userLocation || undefined,
        search_strategy: {
          phase: searchResult.phase,
          target_countries: strategy.countries,
          local_results_count: searchResult.localCount || 0,
          fallback_results_count: searchResult.fallbackCount || 0,
        },
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Enhanced job search failed:', error);
      throw error;
    }
  }

  /**
   * Determine search strategy based on user location and target countries
   */
  private determineSearchStrategy(
    params: JobSearchParams,
    userLocation?: UserLocationData
  ): { countries: string[]; prioritizeLocal: boolean } {
    const targetCountries = [...this.countryConfig.target_countries];
    
    // If user specified countries, respect their choice
    if (params.countries && params.countries.length > 0) {
      return {
        countries: params.countries,
        prioritizeLocal: !!userLocation?.city,
      };
    }

    // Determine based on user location
    if (userLocation?.country) {
      const isInTargetCountry = LocationService.isInTargetCountry(
        userLocation.country, 
        targetCountries
      );

      if (isInTargetCountry) {
        // User is in target country -> prioritize their country first
        const userCountryPriority = [userLocation.country];
        const otherTargetCountries = targetCountries.filter(country => 
          !LocationService.isInTargetCountry(userLocation.country!, [country])
        );
        
        return {
          countries: [...userCountryPriority, ...otherTargetCountries],
          prioritizeLocal: true,
        };
      } else {
        // User outside target countries -> search target countries first
        return {
          countries: [...targetCountries, ...this.countryConfig.fallback_countries],
          prioritizeLocal: false,
        };
      }
    }

    // Default: search all target countries
    return {
      countries: targetCountries,
      prioritizeLocal: false,
    };
  }

  /**
   * Execute two-phase fetch: local priority + country fallback
   */
  private async executeTwoPhaseFetch(
    params: JobSearchParams,
    strategy: { countries: string[]; prioritizeLocal: boolean },
    userLocation?: UserLocationData
  ): Promise<{
    jobs: any[];
    total: number;
    pagination: any;
    phase: 'local' | 'country_fallback' | 'global';
    localCount?: number;
    fallbackCount?: number;
  }> {
    const limit = params.limit || 20;
    const offset = params.offset || 0;

    // Phase 1: Local area jobs (if user has location)
    let localJobs: JobSummary[] = [];
    let localTotal = 0;

    if (strategy.prioritizeLocal && userLocation?.city) {
      const localFilters = this.buildJobFilters(params, [userLocation.country!]);
      
      // Add local area filtering
      localFilters.location = userLocation.city;
      if (userLocation.region && !localFilters.location.includes(userLocation.region)) {
        localFilters.location = `${userLocation.city}, ${userLocation.region}`;
      }

      const localResult = await enhancedJobService.searchJobs(
        localFilters,
        { page: 1, limit: Math.ceil(limit * 0.7), sortBy: params.sortBy } // 70% for local
      );

      localJobs = localResult.data;
      localTotal = localResult.pagination.total;
    }

    // Phase 2: Country/Fallback jobs (if we need more results)
    let fallbackJobs: JobSummary[] = [];
    let fallbackTotal = 0;

    const remainingLimit = limit - localJobs.length;
    
    if (remainingLimit > 0) {
      const countryFilters = this.buildJobFilters(params, strategy.countries);
      
      // Exclude local area if we already searched there
      if (strategy.prioritizeLocal && userLocation?.city) {
        countryFilters.location = undefined; // Remove location filter for broader search
        // Could add NOT filters here if Prisma supports it
      }

      const fallbackResult = await enhancedJobService.searchJobs(
        countryFilters,
        { 
          page: Math.floor(offset / limit) + 1, 
          limit: remainingLimit,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder 
        }
      );

      fallbackJobs = fallbackResult.data;
      fallbackTotal = fallbackResult.pagination.total;
    }

    // Combine results
    const combinedJobs = [...localJobs, ...fallbackJobs];
    const totalResults = localTotal + fallbackTotal;

    // Sort combined results if needed
    if (params.sortBy && combinedJobs.length > 0) {
      combinedJobs.sort(this.createSortComparator(params.sortBy, params.sortOrder));
    }

    // Determine phase
    let phase: 'local' | 'country_fallback' | 'global' = 'global';
    if (localJobs.length > 0 && fallbackJobs.length === 0) {
      phase = 'local';
    } else if (localJobs.length > 0 || strategy.prioritizeLocal) {
      phase = 'country_fallback';
    }

    return {
      jobs: combinedJobs.slice(0, limit), // Respect original limit
      total: totalResults,
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil(totalResults / limit),
        total_results: totalResults,
        per_page: limit,
        has_next: offset + limit < totalResults,
        has_prev: offset > 0,
      },
      phase,
      localCount: localJobs.length,
      fallbackCount: fallbackJobs.length,
    };
  }

  /**
   * Convert JobSearchParams to JobFilters for enhanced job service
   */
  private buildJobFilters(params: JobSearchParams, countries: string[]): JobFilters {
    const filters: JobFilters = {
      // Always filter for active jobs
      includeInactive: false,
    };

    // Search query
    if (params.filters?.query) {
      filters.q = params.filters.query;
    }

    // Location (will be set by caller for local vs global search)
    if (params.location) {
      filters.location = params.location;
    }

    // Countries - use multiple countries support
    if (countries.length > 0) {
      filters.countries = countries;
    }

    // Job type and experience
    if (params.filters?.jobType) {
      filters.jobType = params.filters.jobType;
    }

    if (params.filters?.experienceLevel) {
      filters.experienceLevel = params.filters.experienceLevel;
    }

    // Salary range
    if (params.filters?.minSalary) {
      filters.salaryMin = params.filters.minSalary;
    }

    if (params.filters?.maxSalary) {
      filters.salaryMax = params.filters.maxSalary;
    }

    // Skills
    if (params.filters?.skills && params.filters.skills.length > 0) {
      filters.skills = params.filters.skills;
    }

    // Remote/Hybrid preferences
    if (params.filters?.isRemote !== undefined) {
      filters.isRemote = params.filters.isRemote;
    }

    if (params.filters?.isHybrid !== undefined) {
      filters.isHybrid = params.filters.isHybrid;
    }

    // Sector
    if (params.filters?.sector) {
      filters.sector = params.filters.sector;
    }

    // Company
    if (params.filters?.company) {
      filters.company = params.filters.company;
    }

    return filters;
  }

  /**
   * Create sort comparator for combined results
   */
  private createSortComparator(
    sortBy: string, 
    sortOrder: string = 'desc'
  ): (a: JobSummary, b: JobSummary) => number {
    const direction = sortOrder === 'asc' ? 1 : -1;

    return (a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'salary':
          aValue = a.salaryMax || a.salaryMin || 0;
          bValue = b.salaryMax || b.salaryMin || 0;
          break;
        case 'company':
          aValue = a.company || '';
          bValue = b.company || '';
          break;
        case 'location':
          aValue = a.location || '';
          bValue = b.location || '';
          break;
        default: // relevance
          // Prioritize featured/urgent jobs, then by date
          const aScore = (a.isFeatured ? 10 : 0) + (a.isUrgent ? 5 : 0);
          const bScore = (b.isFeatured ? 10 : 0) + (b.isUrgent ? 5 : 0);
          
          if (aScore !== bScore) {
            return (bScore - aScore) * direction;
          }
          
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (typeof aValue === 'string') {
        return aValue.localeCompare(bValue) * direction;
      }

      return (aValue - bValue) * direction;
    };
  }

  /**
   * Build filters response for API
   */
  private buildFiltersResponse(params: JobSearchParams): any {
    return {
      countries: params.countries,
      location: params.location,
      status: params.status || 'active',
      ...params.filters,
      limit: params.limit || 20,
      offset: params.offset || 0,
      sortBy: params.sortBy || 'relevance',
      sortOrder: params.sortOrder || 'desc',
    };
  }
}

// Export singleton instance
export const enhancedJobSearchService = EnhancedJobSearchService.getInstance();
