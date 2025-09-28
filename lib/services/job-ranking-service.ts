/**
 * Job Ranking Service
 * Scores and ranks jobs based on relevance, user preferences, and search history
 */

import { prisma } from '@/lib/prisma';

export interface RankingWeights {
  keywordMatch: number;
  locationMatch: number;
  freshness: number;
  userHistory: number;
}

export interface RankingResult {
  jobId: string;
  score: number;
  breakdown: {
    keywordScore: number;
    locationScore: number;
    freshnessScore: number;
    userHistoryScore: number;
  };
}

export interface UserSearchHistory {
  recentSearches: string[];
  appliedJobs: string[];
  bookmarkedJobs: string[];
  preferredCompanies: string[];
  preferredLocations: string[];
  preferredSectors: string[];
}

export class JobRankingService {
  private static instance: JobRankingService;
  private defaultWeights: RankingWeights = {
    keywordMatch: 0.4,
    locationMatch: 0.3,
    freshness: 0.2,
    userHistory: 0.1
  };

  public static getInstance(): JobRankingService {
    if (!JobRankingService.instance) {
      JobRankingService.instance = new JobRankingService();
    }
    return JobRankingService.instance;
  }

  /**
   * Rank jobs based on search query and user preferences
   */
  async rankJobs(
    jobs: any[],
    searchQuery: string,
    location: string = '',
    userId?: string,
    customWeights?: Partial<RankingWeights>
  ): Promise<RankingResult[]> {
    const weights = { ...this.defaultWeights, ...customWeights };
    const userHistory = userId ? await this.getUserSearchHistory(userId) : null;
    
    const rankingResults: RankingResult[] = [];

    for (const job of jobs) {
      const keywordScore = this.calculateKeywordScore(job, searchQuery);
      const locationScore = this.calculateLocationScore(job, location);
      const freshnessScore = this.calculateFreshnessScore(job);
      const userHistoryScore = userHistory ? this.calculateUserHistoryScore(job, userHistory) : 0;

      const totalScore = 
        keywordScore * weights.keywordMatch +
        locationScore * weights.locationMatch +
        freshnessScore * weights.freshness +
        userHistoryScore * weights.userHistory;

      rankingResults.push({
        jobId: job.id,
        score: totalScore,
        breakdown: {
          keywordScore,
          locationScore,
          freshnessScore,
          userHistoryScore
        }
      });
    }

    // Sort by score (highest first)
    return rankingResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordScore(job: any, searchQuery: string): number {
    if (!searchQuery.trim()) return 0.5; // Neutral score for empty query

    const query = searchQuery.toLowerCase();
    const jobText = `${job.title || ''} ${job.description || ''} ${job.company || ''} ${job.skills || ''}`.toLowerCase();
    
    let score = 0;
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);

    for (const word of queryWords) {
      // Exact match in title gets highest score
      if (job.title && job.title.toLowerCase().includes(word)) {
        score += 1.0;
      }
      // Exact match in company gets high score
      else if (job.company && job.company.toLowerCase().includes(word)) {
        score += 0.8;
      }
      // Match in description gets medium score
      else if (job.description && job.description.toLowerCase().includes(word)) {
        score += 0.6;
      }
      // Match in skills gets lower score
      else if (job.skills && job.skills.toLowerCase().includes(word)) {
        score += 0.4;
      }
      // Partial match gets even lower score
      else if (this.hasPartialMatch(jobText, word)) {
        score += 0.2;
      }
    }

    // Normalize score
    return Math.min(score / queryWords.length, 1.0);
  }

  /**
   * Calculate location match score
   */
  private calculateLocationScore(job: any, searchLocation: string): number {
    if (!searchLocation.trim()) return 0.5; // Neutral score for empty location

    const location = searchLocation.toLowerCase();
    const jobLocation = (job.location || '').toLowerCase();
    
    if (!jobLocation) return 0.3; // Lower score for jobs without location

    // Exact match
    if (jobLocation.includes(location) || location.includes(jobLocation)) {
      return 1.0;
    }

    // City/state match
    const locationWords = location.split(/[,\s]+/);
    const jobLocationWords = jobLocation.split(/[,\s]+/);
    
    let matchCount = 0;
    for (const word of locationWords) {
      if (word.length > 2 && jobLocationWords.some(jw => jw.includes(word) || word.includes(jw))) {
        matchCount++;
      }
    }

    return matchCount / locationWords.length;
  }

  /**
   * Calculate freshness score based on posted date
   */
  private calculateFreshnessScore(job: any): number {
    const postedDate = job.postedAt || job.createdAt || new Date();
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));

    // Freshness scoring
    if (daysDiff <= 1) return 1.0;      // Very fresh
    if (daysDiff <= 7) return 0.9;      // Fresh
    if (daysDiff <= 30) return 0.7;     // Recent
    if (daysDiff <= 90) return 0.5;     // Moderate
    if (daysDiff <= 180) return 0.3;    // Old
    return 0.1;                         // Very old
  }

  /**
   * Calculate user history relevance score
   */
  private calculateUserHistoryScore(job: any, userHistory: UserSearchHistory): number {
    let score = 0;
    let factors = 0;

    // Company preference
    if (userHistory.preferredCompanies.length > 0) {
      const companyMatch = userHistory.preferredCompanies.some(company => 
        job.company && job.company.toLowerCase().includes(company.toLowerCase())
      );
      if (companyMatch) {
        score += 0.3;
        factors++;
      }
    }

    // Location preference
    if (userHistory.preferredLocations.length > 0) {
      const locationMatch = userHistory.preferredLocations.some(loc => 
        job.location && job.location.toLowerCase().includes(loc.toLowerCase())
      );
      if (locationMatch) {
        score += 0.3;
        factors++;
      }
    }

    // Sector preference
    if (userHistory.preferredSectors.length > 0) {
      const sectorMatch = userHistory.preferredSectors.some(sector => 
        job.sector && job.sector.toLowerCase().includes(sector.toLowerCase())
      );
      if (sectorMatch) {
        score += 0.2;
        factors++;
      }
    }

    // Recent search relevance
    if (userHistory.recentSearches.length > 0) {
      const recentSearchMatch = userHistory.recentSearches.some(search => 
        this.calculateKeywordScore(job, search) > 0.5
      );
      if (recentSearchMatch) {
        score += 0.2;
        factors++;
      }
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Get user search history and preferences
   */
  private async getUserSearchHistory(userId: string): Promise<UserSearchHistory> {
    try {
      // Get recent searches
      const recentSearches = await prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { query: true }
      });

      // Get applied jobs
      const appliedJobs = await prisma.application.findMany({
        where: { userId },
        select: { job: { select: { title: true, company: true, sector: true } } }
      });

      // Get bookmarked jobs
      const bookmarkedJobs = await prisma.jobBookmark.findMany({
        where: { userId },
        select: { job: { select: { title: true, company: true, sector: true } } }
      });

      // Get user preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          locationPreference: true,
          salaryExpectation: true,
          jobTypePreference: true,
          remotePreference: true,
          companyName: true,
          companyIndustry: true
        }
      });

      // Extract preferred companies from applied and bookmarked jobs
      const allJobs = [...appliedJobs, ...bookmarkedJobs];
      const preferredCompanies = [...new Set(
        allJobs.map(j => j.job.company).filter(Boolean)
      )];

      // Extract preferred sectors
      const preferredSectors = [...new Set(
        allJobs.map(j => j.job.sector).filter(Boolean)
      )];

      return {
        recentSearches: recentSearches.map(s => s.query),
        appliedJobs: appliedJobs.map(a => a.job.title),
        bookmarkedJobs: bookmarkedJobs.map(b => b.job.title),
        preferredCompanies,
        preferredLocations: user?.locationPreference ? [user.locationPreference] : [],
        preferredSectors
      };

    } catch (error) {
      console.error('❌ Failed to get user search history:', error);
      return {
        recentSearches: [],
        appliedJobs: [],
        bookmarkedJobs: [],
        preferredCompanies: [],
        preferredLocations: [],
        preferredSectors: []
      };
    }
  }

  /**
   * Check for partial word matches
   */
  private hasPartialMatch(text: string, word: string): boolean {
    if (word.length < 3) return false;
    
    const words = text.split(/\s+/);
    return words.some(w => w.includes(word) || word.includes(w));
  }

  /**
   * Update ranking weights
   */
  updateWeights(weights: Partial<RankingWeights>): void {
    this.defaultWeights = { ...this.defaultWeights, ...weights };
  }

  /**
   * Get current ranking weights
   */
  getWeights(): RankingWeights {
    return { ...this.defaultWeights };
  }
}
