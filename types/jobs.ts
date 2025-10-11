export interface JobResult {
  id: string
  title: string
  company: string
  companyLogo?: string
  location: string
  description: string
  salary?: string
  salary_formatted?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  country?: string
  time_ago: string
  redirect_url: string
  is_remote?: boolean
  is_hybrid?: boolean
  is_urgent?: boolean
  is_featured?: boolean
  job_type?: string
  experience_level?: string
  skills?: string[] | string
  sector?: string
  posted_at?: string
  created_at?: string
  bookmarked_at?: string // For bookmarked jobs
  source?: string // Job source: 'manual' for internal, 'external' for external providers
  source_url?: string // External source URL for direct redirects
  jobType?: string
  experienceLevel?: string
  isExternal?: boolean
  applyUrl?: string
}

export interface JobSearchFilters {
  query: string
  location: string
  salary_min?: number
  salary_max?: number
  job_type?: string
  experience_level?: string
  remote_only?: boolean
  sector?: string
  country?: string
  date_posted?: string
  skills?: string[] | string
  company?: string
  sort_by?: 'newest' | 'oldest' | 'salary_high' | 'salary_low' | 'relevance'
}

export interface JobSearchResponse {
  success: boolean
  jobs: JobResult[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  filters?: {
    applied: Partial<JobSearchFilters>
    available: {
      jobTypes: { value: string; count: number }[]
      experienceLevels: { value: string; count: number }[]
      sectors: { value: string; count: number }[]
      locations: { value: string; count: number }[]
      companies: { value: string; count: number }[]
    }
  }
  search_time_ms?: number
  message?: string
}

// New interfaces for enhanced functionality
export interface JobBookmark {
  id: number
  userId: number
  jobId: number
  createdAt: string
}

export interface AdvancedSearchFilters extends JobSearchFilters {
  salary_currency?: string
  is_hybrid?: boolean
  is_urgent?: boolean
  is_featured?: boolean
  posted_since?: Date
  company_type?: string
}

export interface FilterOption {
  value: string
  label: string
  count?: number
  selected?: boolean
}

export interface SortOption {
  value: string
  label: string
  icon?: string
}

export interface JobListingViewMode {
  mode: 'list' | 'grid' | 'compact'
  itemsPerPage: number
}

// Quick View Modal data
export interface JobQuickView {
  id: string
  title: string
  company: string
  companyLogo?: string
  location: string
  description: string
  requirements: string[]
  benefits: string[]
  salary_formatted?: string
  job_type?: string
  experience_level?: string
  skills?: string[] | string
  posted_at?: string
  apply_url?: string
}