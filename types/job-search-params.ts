/**
 * Job Search Parameters Interface
 * Implements the enhanced job fetching algorithm for country targeting and location prioritization
 */

export interface JobSearchParams {
  // Target countries for job search (priority order: UK, US, India, UAE, others)
  countries: string[];
  
  // User location for local job prioritization
  location?: string;          // user's city/region from geolocation
  
  // Job status filtering
  status?: 'active';          // only active jobs
  
  // Advanced filtering options from website UI
  filters?: {
    jobType?: string;         // full-time, part-time, contract, internship
    minSalary?: number;       // minimum salary in local currency
    maxSalary?: number;       // maximum salary in local currency
    skills?: string[];        // required skills array
    experienceLevel?: string; // entry, mid, senior, executive
    sector?: string;          // Technology, Finance, Healthcare, etc.
    isRemote?: boolean;       // remote job preference
    isHybrid?: boolean;       // hybrid job preference
    company?: string;         // company name filter
    query?: string;           // search query for title/description
  };
  
  // Pagination and limits
  limit?: number;             // max jobs to fetch (default: 20)
  offset?: number;            // pagination offset (default: 0)
  
  // Sorting preferences
  sortBy?: 'relevance' | 'date' | 'salary' | 'location';
  sortOrder?: 'asc' | 'desc';
}

export interface UserLocationData {
  // Primary location data
  city?: string;
  region?: string;
  country?: string;
  
  // Geographic coordinates for proximity calculations
  latitude?: number;
  longitude?: number;
  coordinates?: { lat: number; lng: number }; // New coordinates structure
  
  // Location detection method
  source: 'ip' | 'browser' | 'manual' | 'gps'; // Added 'gps' source
  
  // Location confidence
  accuracy?: number;
  
  // Additional metadata
  state?: string; // Added state field
  timestamp?: string; // Added timestamp for caching
}

export interface JobSearchResponse {
  success: boolean;
  message: string;
  jobs: any[]; // Will use existing job interface
  pagination: {
    current_page: number;
    total_pages: number;
    total_results: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters: any;
  location_info?: UserLocationData;
  search_strategy?: {
    phase: 'local' | 'country_fallback' | 'global';
    target_countries: string[];
    local_results_count: number;
    fallback_results_count: number;
  };
  timestamp: string;
}

export interface CountryPriorityConfig {
  target_countries: string[];
  fallback_countries: string[];
  local_priority_radius?: number; // in kilometers
}

// Default country configuration
export const DEFAULT_COUNTRY_CONFIG: CountryPriorityConfig = {
  target_countries: ['United Kingdom', 'United States', 'India', 'United Arab Emirates'],
  fallback_countries: ['Canada', 'Australia', 'Germany', 'Singapore', 'Netherlands'],
  local_priority_radius: 50, // 50km radius for local job prioritization
};

// Country code mappings for API consistency
export const COUNTRY_CODES = {
  'United Kingdom': 'GB',
  'United States': 'US', 
  'India': 'IN',
  'United Arab Emirates': 'AE',
  'Canada': 'CA',
  'Australia': 'AU',
  'Germany': 'DE',
  'Singapore': 'SG',
  'Netherlands': 'NL',
} as const;

export type CountryCode = typeof COUNTRY_CODES[keyof typeof COUNTRY_CODES];
export type CountryName = keyof typeof COUNTRY_CODES;
