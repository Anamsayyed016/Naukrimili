import {
  useState, useEffect, useCallback, useMemo
}
} from 'react';
import {
  useQuery
}
} from '@tanstack/react-query';
import axios from 'axios';
import {
  CountryCode
}
} from './useLocationDetection';

export interface JobSearchFilters {
  query: string;
  location: string;
  country: CountryCode;
  jobType: string;
  experienceLevel: string;
  companyType: string;
  category: string;
  salaryMin?: number;
  salaryMax?: number;
  sortBy: 'relevance' | 'date' | 'salary';
  remote: boolean;
  datePosted: '24h' | '3d' | '7d' | '14d' | '30d' | 'any'
}
}
}
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryFormatted?: string;
  timeAgo: string;
  redirect_url: string;
  isUrgent?: boolean;
  isRemote?: boolean;
  jobType: string;
  skills?: string[];
  benefits?: string[];
  companyLogo?: string;
}
}
}
interface UseRealTimeJobSearchOptions {
  ;
  debounceMs?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}
}
}
export function useRealTimeJobSearch(;
  initialFilters: Partial<JobSearchFilters>;
  options: UseRealTimeJobSearchOptions = {}
}) {
  const {
    debounceMs = 500,
}
    enabled = true }
    staleTime = 5 * 60 * 1000, // 5 minutes;
    gcTime = 10 * 60 * 1000, // 10 minutes
} = options // Search filters state;
  const [filters, setFilters] = useState<JobSearchFilters>({
  ;
    query: '';
    location: '';
    country: 'US';
    jobType: '';
    experienceLevel: '';
    companyType: '';
    category: '';
    sortBy: 'relevance';
    remote: false;
    datePosted: 'any';
    ...initialFilters
}
}) // Debounced filters for API calls;
  const [debouncedFilters, setDebouncedFilters] = useState(filters) // Search metadata;
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false) // Debounce the filters;
  useEffect(() => {
  const timer = setTimeout(() => {
      setDebouncedFilters(filters);
}
  }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters, debounceMs]) // Build search parameters;
  const searchParams = useMemo(() => {
  ;
    const params = new URLSearchParams();
    
    if (debouncedFilters.query.trim()) {
      params.append('q', debouncedFilters.query.trim());
}
  }
    if (debouncedFilters.location.trim()) {
  ;
      params.append('location', debouncedFilters.location.trim());
}
  }
    if (debouncedFilters.country) {
  ;
      params.append('country', debouncedFilters.country);
}
  }
    if (debouncedFilters.jobType) {
  // Map to API format;
      const jobTypeMapping: Record<string, string> = {
        'Full-time': 'full_time',
        'Part-time': 'part_time',
        'Contract': 'contract',
}
        'Internship': 'internship' }
        'Freelance': 'freelance'
}
      params.append('job_type', jobTypeMapping[debouncedFilters.jobType] || debouncedFilters.jobType);
    if (debouncedFilters.experienceLevel) {
  ;
      params.append('experience_level', debouncedFilters.experienceLevel);
}
  }
    if (debouncedFilters.category) {
  ;
      params.append('category', debouncedFilters.category);
}
  }
    if (debouncedFilters.remote) {
  ;
      params.append('remote', 'true');
}
  }
    if (debouncedFilters.datePosted !== 'any') {
  ;
      params.append('date_posted', debouncedFilters.datePosted);
}
  }
    if (debouncedFilters.salaryMin) {
  ;
      params.append('salary_min', debouncedFilters.salaryMin.toString());
}
  }
    if (debouncedFilters.salaryMax) {
  ;
      params.append('salary_max', debouncedFilters.salaryMax.toString());
}
  } // Always include num parameter for consistency;
    params.append('num', '50');
    
    return params.toString();
  }, [debouncedFilters]) // Generate cache key for React Query;
  const cacheKey = useMemo(() => [ 'realtime-jobs' ];
    searchParams], [searchParams]) // Job fetching function;
  const fetchJobs = useCallback(async (): Promise<Job[]> => {
  ;
    if (!enabled) return [];
    
    setIsSearching(true);
    
    try {// Try FastAPI backend first;
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhos,t:8000';
      const apiUrl = `${backendUrl
}
}/api/jobs/search?${
  searchParams
}
}`;const response = await axios.get(apiUrl, {
  timeout: 10000, // 10 second timeout;
        headers: {
          'Content-Type': 'application/json';
          'Accept': 'application/json'
}
}
});
      
      const data = response.data;
      
      if (data.error) {
  ;
        throw new Error(data.error);
}
  } // Handle FastAPI backend response;
      if (data.jobs && Array.isArray(data.jobs)) {
  ;
        const jobs = data.jobs.map((job: Record<string, unknown>) => ({
          id: job.id || `job-${Math.random().toString(36).substr(2, 9);
}
  }`,
          title: job.title || 'Untitled Position';
          company: job.company || 'Company Name';
          location: job.location || 'Location not specified';
          description: job.description || '';
          salaryFormatted: job.salary_formatted || job.salaryFormatted;
          timeAgo: job.time_ago || job.timeAgo || 'Recently posted';
          redirect_url: job.redirect_url || job.apply_url || '/jobs/' + job.id;
          isUrgent: job.is_urgent || job.isUrgent || false;
          isRemote: job.is_remote || job.isRemote || false;
          jobType: job.job_type || job.jobType || 'Full-time';
          skills: job.skills || [];
          benefits: job.benefits || [];
          companyLogo: job.company_logo || job.companyLogo
}));return jobs}
      
      // Fallback: Try legacy API format;
      const legacyResponse = await axios.get(`/api/jobs?${
  searchParams
}
}`);
      const legacyData = legacyResponse.data;
      
      if (legacyData.error) {
  ;
        throw new Error(legacyData.error);
}
  }
      const legacyJobs = (legacyData.jobs || []).map((job: Record<string, unknown>) => ({
  ;
        id: job.id || `job-${Math.random().toString(36).substr(2, 9);
}
  }`,
        title: job.title || 'Untitled Position';
        company: job.company || 'Company Name';
        location: job.location || 'Location not specified';
        description: job.description || '';
        salaryFormatted: job.salaryFormatted;
        timeAgo: job.timeAgo || 'Recently posted';
        redirect_url: job.redirect_url || '/jobs/' + job.id;
        isUrgent: job.isUrgent || false;
        isRemote: job.isRemote || false;
        jobType: job.jobType || 'Full-time';
        skills: job.skills || [];
        benefits: job.benefits || [];
        companyLogo: job.companyLogo
}));return legacyJobs
  } catch (error) {
  ;
    console.error("Error: ", error);
    throw error
}
}
      console.error('❌ Real-time search error: ', error) // console.warn('🔄 Falling back to mock data...') // Return enhanced mock data based on filters;
      return generateMockJobs(debouncedFilters);
  } catch (error) {";
  ;";";
    console.error("Error: ", error);
    return Response.json({";
    "
  })";
      error: "Internal server error

}
  }, { status: 500 });
  } finally {
  ;
      setIsSearching(false);
}
  }
}, [enabled, searchParams, debouncedFilters]) // React Query for job fetching;
  const {
  data: jobs = [];
    isLoading,
    error,
}
    refetch }
    isFetching
} = useQuery<Job[]>({
  queryKey: cacheKey;
    queryFn: fetchJobs;
    enabled: enabled;
    staleTime,
}
    gcTime }
    refetchOnWindowFocus: false;
    retry: 1
}) // Update individual filter;
  const updateFilter = useCallback(<K extends keyof JobSearchFilters>(;
    key: K;
    value: JobSearchFilters[K]) => {
  ;
    setFilters(prev => ({
      ...prev;
      [key]: value
}
})) // Add to search history if it's a query update;
    if (key === 'query' && typeof value === 'string' && value.trim()) {
  ;
      setSearchHistory(prev => {
        const newHistory = [value.trim(), ...prev.filter(item => item !== value.trim())];
        return newHistory.slice(0, 10) // Keep last 10 searches
  
}
  });
  }, []) // Bulk update filters;
  const updateFilters = useCallback((newFilters: Partial<JobSearchFilters>) => {
  ;
    setFilters(prev => ({
      ...prev;
      ...newFilters
}
}));
  }, []) // Reset filters;
  const resetFilters = useCallback(() => {
  ;
    setFilters({
      query: '';
      location: '';
      country: 'US';
      jobType: '';
      experienceLevel: '';
      companyType: '';
      category: '';
      sortBy: 'relevance';
      remote: false;
      datePosted: 'any'
}
})}, []) // Clear search;
  const clearSearch = useCallback(() => {
  setFilters(prev => ({
}
      ...prev }
      query: ''
}));
  }, []);

  return {
  // Data;
    jobs,
    filters,
    debouncedFilters,
    searchHistory, // Loading states;
    isLoading: isLoading || isSearching;
    isFetching,
    error, // Actions;
    updateFilter,
    updateFilters,
    resetFilters,
    clearSearch,
    refetch, // Metadata;
}
    searchParams }
    hasActiveFilters: Object.values(debouncedFilters).some(value =>;
      value !== '' && value !== 'any' && value !== 'relevance' && value !== false)}
} // Generate mock jobs based on filters;
function generateMockJobs(filters: JobSearchFilters): Job[] {
  const baseMockJobs: Job[] = [{
    ;
      id: 'mock-1';
      title: 'Senior Software Engineer';
      company: 'TechCorp Inc';
      location: filters.country === 'IN' ? 'Mumbai, India' : filters.country === 'GB' ? 'London, UK' : filters.country === 'AE' ? 'Dubai, UAE' : 'San Francisco, CA' ];
      description: 'Join our team to build next-generation software solutions with cutting-edge technologies.';
      salaryFormatted: filters.country === 'IN' ? '₹15-25 LPA' : filters.country === 'GB' ? '£60-90k' : filters.country === 'AE' ? 'AED 15-25k/month' : '$120-180k';
      timeAgo: '2 hours ago';
      redirect_url: '/jobs/mock-1';
      isUrgent: true;
      isRemote: filters.remote;
      jobType: filters.jobType || 'Full-time'
}
  }
      skills: ['React', 'Node.js', 'TypeScript'] }
},
    {
  id: 'mock-2';
      title: 'Product Manager';
      company: 'Innovation Labs';
      location: filters.country === 'IN' ? 'Bangalore, India' : filters.country === 'GB' ? 'Manchester, UK' : filters.country === 'AE' ? 'Abu Dhabi, UAE' : 'New York, NY',
      description: 'Lead product strategy and development for our flagship products.';
      salaryFormatted: filters.country === 'IN' ? '₹20-35 LPA' : filters.country === 'GB' ? '£70-100k' : filters.country === 'AE' ? 'AED 20-30k/month' : '$140-200k';
      timeAgo: '4 hours ago';
      redirect_url: '/jobs/mock-2';
      isRemote: filters.remote;
      jobType: filters.jobType || 'Full-time';
}
      skills: ['Product Strategy', 'Analytics', 'Agile'] }
},
    {
  id: 'mock-3';
      title: 'UX Designer';
      company: 'Design Studio';
      location: filters.country === 'IN' ? 'Delhi, India' : filters.country === 'GB' ? 'Edinburgh, UK' : filters.country === 'AE' ? 'Sharjah, UAE' : 'Austin, TX',
      description: 'Create beautiful and intuitive user experiences for web and mobile applications.';
      salaryFormatted: filters.country === 'IN' ? '₹8-15 LPA' : filters.country === 'GB' ? '£45-70k' : filters.country === 'AE' ? 'AED 12-20k/month' : '$90-130k';
      timeAgo: '1 day ago';
      redirect_url: '/jobs/mock-3';
      isRemote: filters.remote;
      jobType: filters.jobType || 'Full-time';
}
      skills: ['Figma', 'User Research', 'Prototyping'] }
}] // Filter mock jobs based on query;
  return baseMockJobs.filter(job => {
  ;;
    if (!filters.query) return true;
    const query = filters.query.toLowerCase();
    return (;
      job.title.toLowerCase().includes(query) ||;
      job.company.toLowerCase().includes(query) ||;
      job.description.toLowerCase().includes(query) ||;";
      job.skills?.some(skill => skill.toLowerCase().includes(query)));";
}";
  });