export interface JobResult {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary_formatted?: string
  time_ago: string
  redirect_url: string
  is_remote?: boolean
  job_type?: string
  skills?: string[]
  experience_level?: string
  sector?: string
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
}
export interface JobSearchResponse {
  jobs: JobResult[]
  total: number
  page: number
  per_page: number
  total_pages: number
  has_google_fallback?: boolean
  google_fallback_urls?: string[]
  search_time_ms?: number
  message?: string
}