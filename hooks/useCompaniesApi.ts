import { useState, useEffect } from 'react'

export interface Company {
  id: string
  name: string
  description: string
  industry: string
  size: string
  location: string
  founded: string
  website: string
  logo?: string
  rating: number
  reviewCount: number
  workLifeBalance: number
  salaryRating: number
  cultureRating: number
  activeJobs: number
  isHiring: boolean
  isTrending?: boolean
  benefits: string[]
  technologies: string[]
  verified?: boolean
  employees?: number
  headquarters?: string
  type?: 'startup' | 'corporation' | 'non-profit' | 'government'
  createdAt: string
  updatedAt: string
}

export interface CompaniesResponse {
  success: boolean
  data: Company[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  filters: {
    industries: string[]
    sizes: string[]
    locations: string[]
  }
  error?: string
}

export interface CompanyResponse {
  success: boolean
  data: {
    company: Company
    relatedCompanies: Company[]
    stats: {
      totalEmployees: number
      totalReviews: number
      overallRating: number
      industryRank: number
      growthRate: number
    }
  }
  error?: string
}

export interface CompaniesFilters {
  search?: string
  industry?: string
  size?: string
  location?: string
  hiring?: boolean
  verified?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function useCompaniesApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async (filters: CompaniesFilters = {}): Promise<CompaniesResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.industry) params.append('industry', filters.industry)
      if (filters.size) params.append('size', filters.size)
      if (filters.location) params.append('location', filters.location)
      if (filters.hiring) params.append('hiring', 'true')
      if (filters.verified) params.append('verified', 'true')
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/companies?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CompaniesResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch companies')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchCompany = async (id: string): Promise<CompanyResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/companies/${id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CompanyResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch company')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const createCompany = async (companyData: Partial<Company>): Promise<Company | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create company')
      }

      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateCompany = async (id: string, companyData: Partial<Company>): Promise<Company | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update company')
      }

      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteCompany = async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete company')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    fetchCompanies,
    fetchCompany,
    createCompany,
    updateCompany,
    deleteCompany,
  }
}

// Hook for using companies with automatic loading
export function useCompanies(filters: CompaniesFilters = {}) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [pagination, setPagination] = useState<CompaniesResponse['pagination'] | null>(null)
  const [availableFilters, setAvailableFilters] = useState<CompaniesResponse['filters'] | null>(null)
  const { loading, error, fetchCompanies } = useCompaniesApi()

  const loadCompanies = async () => {
    const response = await fetchCompanies(filters)
    if (response) {
      setCompanies(response.data)
      setPagination(response.pagination)
      setAvailableFilters(response.filters)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [
    filters.search,
    filters.industry,
    filters.size,
    filters.location,
    filters.hiring,
    filters.verified,
    filters.page,
    filters.limit,
    filters.sortBy,
    filters.sortOrder
  ])

  return {
    companies,
    pagination,
    availableFilters,
    loading,
    error,
    refetch: loadCompanies
  }
}

// Hook for individual company
export function useCompany(id: string) {
  const [company, setCompany] = useState<Company | null>(null)
  const [relatedCompanies, setRelatedCompanies] = useState<Company[]>([])
  const [stats, setStats] = useState<CompanyResponse['data']['stats'] | null>(null)
  const { loading, error, fetchCompany } = useCompaniesApi()

  useEffect(() => {
    if (id) {
      const loadCompany = async () => {
        const response = await fetchCompany(id)
        if (response) {
          setCompany(response.data.company)
          setRelatedCompanies(response.data.relatedCompanies)
          setStats(response.data.stats)
        }
      }
      loadCompany()
    }
  }, [id])

  return {
    company,
    relatedCompanies,
    stats,
    loading,
    error
  }
}
;