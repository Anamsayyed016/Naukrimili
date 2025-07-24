import { useState, useEffect } from 'react'

export interface AdData {
  id: string
  title: string
  description: string
  image_url: string
  click_url: string
  ad_type: string
  target_segments: string[]
  budget: number
  daily_budget: number
  cpc: number
  cpm: number
  keywords: string[]
  industry?: string
  location?: string
  company_id?: string
  relevance_score?: number
}

export interface UserData {
  user_id: string
  job_searches?: string[]
  job_applications?: string[]
  skills?: string[]
  industry?: string
  location?: string
  profile_completeness?: number
  job_postings?: string[]
  candidate_searches?: string[]
  company_profile_views?: string[]
  recruitment_tool_usage?: number
  is_student?: boolean
  career_resource_views?: string[]
  candidate_contacts?: string[]
  ats_usage?: number
  talent_pool_searches?: string[]
  recruitment_events?: string[]
}

export interface AdsResponse {
  success: boolean
  data: {
    ads: AdData[]
    user_segment: string
    total_available: number
    context?: string
  }
}

export interface AdTrackingData {
  ad_id: string
  event_type: 'impression' | 'click' | 'conversion'
  user_id?: string
  conversion_value?: number
}

export function useAdsApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAds = async (
    userData: UserData,
    numAds: number = 3,
    context?: string
  ): Promise<AdsResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      
      params.append('user_id', userData.user_id)
      params.append('num_ads', numAds.toString())
      
      if (context) params.append('context', context)
      if (userData.industry) params.append('industry', userData.industry)
      if (userData.location) params.append('location', userData.location)
      if (userData.profile_completeness) params.append('profile_completeness', userData.profile_completeness.toString())
      if (userData.is_student) params.append('is_student', userData.is_student.toString())
      
      if (userData.job_searches?.length) params.append('job_searches', userData.job_searches.join(','))
      if (userData.job_applications?.length) params.append('job_applications', userData.job_applications.join(','))
      if (userData.skills?.length) params.append('skills', userData.skills.join(','))

      const response = await fetch(`/api/ads?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: AdsResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch ads')
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

  const trackAdEvent = async (trackingData: AdTrackingData): Promise<boolean> => {
    try {
      const response = await fetch('/api/ads/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackingData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.success
    } catch (err) {
      console.error('Error tracking ad event:', err)
      return false
    }
  }

  const trackImpression = (adId: string, userId?: string): Promise<boolean> => {
    return trackAdEvent({
      ad_id: adId,
      event_type: 'impression',
      user_id: userId
    })
  }

  const trackClick = (adId: string, userId?: string): Promise<boolean> => {
    return trackAdEvent({
      ad_id: adId,
      event_type: 'click',
      user_id: userId
    })
  }

  const trackConversion = (adId: string, userId?: string, conversionValue?: number): Promise<boolean> => {
    return trackAdEvent({
      ad_id: adId,
      event_type: 'conversion',
      user_id: userId,
      conversion_value: conversionValue
    })
  }

  return {
    loading,
    error,
    fetchAds,
    trackAdEvent,
    trackImpression,
    trackClick,
    trackConversion,
  }
}

// Hook for automatically loading ads based on user data
export function usePersonalizedAds(
  userData: UserData,
  numAds: number = 3,
  context?: string
) {
  const [ads, setAds] = useState<AdData[]>([])
  const [userSegment, setUserSegment] = useState<string>('')
  const { loading, error, fetchAds, trackImpression } = useAdsApi()

  const loadAds = async () => {
    const response = await fetchAds(userData, numAds, context)
    if (response) {
      setAds(response.data.ads)
      setUserSegment(response.data.user_segment)
      
      // Auto-track impressions
      response.data.ads.forEach(ad => {
        trackImpression(ad.id, userData.user_id)
      })
    }
  }

  useEffect(() => {
    if (userData.user_id) {
      loadAds()
    }
  }, [
    userData.user_id,
    userData.industry,
    userData.location,
    numAds,
    context
  ])

  return {
    ads,
    userSegment,
    loading,
    error,
    refetch: loadAds
  }
}

// Hook for ad click handling with automatic tracking
export function useAdClick() {
  const { trackClick } = useAdsApi()

  const handleAdClick = async (ad: AdData, userId?: string) => {
    // Track the click
    await trackClick(ad.id, userId)
    
    // Navigate to the ad URL
    if (ad.click_url.startsWith('http')) {
      // External link
      window.open(ad.click_url, '_blank', 'noopener,noreferrer')
    } else {
      // Internal link
      window.location.href = ad.click_url
    }
  }

  return { handleAdClick }
}

// Context-aware ads component hook
export function useContextualAds(context: string, userData: UserData) {
  const [contextualAds, setContextualAds] = useState<AdData[]>([])
  const { fetchAds, trackImpression } = useAdsApi()

  useEffect(() => {
    const loadContextualAds = async () => {
      const response = await fetchAds(userData, 2, context) // Get 2 contextual ads
      if (response) {
        setContextualAds(response.data.ads)
        
        // Track impressions
        response.data.ads.forEach(ad => {
          trackImpression(ad.id, userData.user_id)
        })
      }
    }

    if (userData.user_id && context) {
      loadContextualAds()
    }
  }, [context, userData.user_id])

  return { contextualAds }
}
