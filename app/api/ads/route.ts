import { NextRequest, NextResponse } from 'next/server'

// This would typically import from your Python backend
// For now, we'll create a TypeScript version of the key functionality

interface UserData {
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

interface AdData {
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

// Mock ads data (in production, this would come from your Python backend)
const mockAds: AdData[] = [
  {
    id: "ad_001",
    title: "Senior Software Engineer - Remote",
    description: "Join our tech team! Competitive salary, great benefits, work from anywhere.",
    image_url: "/ads/tech-job.jpg",
    click_url: "/jobs/senior-software-engineer-remote",
    ad_type: "job_listing",
    target_segments: ["job_seeker", "passive_candidate"],
    budget: 5000.0,
    daily_budget: 200.0,
    cpc: 2.50,
    cpm: 15.0,
    keywords: ["python", "react", "remote", "senior", "engineer"],
    industry: "Technology",
    location: "Remote",
    company_id: "tech_corp_001"
  },
  {
    id: "ad_002",
    title: "Master Your Skills with TechLearn Pro",
    description: "Advanced courses in AI, Data Science, and Web Development. Get certified!",
    image_url: "/ads/online-course.jpg",
    click_url: "/courses/techlearn-pro",
    ad_type: "course_promotion",
    target_segments: ["student", "career_changer", "job_seeker"],
    budget: 3000.0,
    daily_budget: 100.0,
    cpc: 1.80,
    cpm: 12.0,
    keywords: ["course", "learning", "certification", "ai", "data science"],
    industry: "Education"
  },
  {
    id: "ad_003",
    title: "RecruitMaster - ATS Solution",
    description: "Streamline your hiring process with our advanced ATS. Free 30-day trial!",
    image_url: "/ads/ats-tool.jpg",
    click_url: "/tools/recruitmaster",
    ad_type: "recruitment_tool",
    target_segments: ["employer", "recruiter"],
    budget: 8000.0,
    daily_budget: 300.0,
    cpc: 5.0,
    cpm: 25.0,
    keywords: ["ats", "recruitment", "hiring", "hr", "applicant tracking"],
    industry: "HR Technology"
  },
  {
    id: "ad_004",
    title: "Professional Resume Builder",
    description: "Create stunning resumes in minutes. ATS-optimized templates included!",
    image_url: "/ads/resume-builder.jpg",
    click_url: "/tools/resume-builder",
    ad_type: "resume_builder",
    target_segments: ["job_seeker", "student", "career_changer"],
    budget: 2500.0,
    daily_budget: 80.0,
    cpc: 1.20,
    cpm: 8.0,
    keywords: ["resume", "cv", "template", "ats", "professional"],
    industry: "Career Services"
  }
]

// Simple user classification logic (simplified version of the Python implementation)
function classifyUser(userData: UserData): string {
  const jobSeekerScore = 
    (userData.job_applications?.length || 0) * 0.4 +
    (userData.job_searches?.length || 0) * 0.2 +
    (userData.profile_completeness || 0) / 100 * 0.1

  const employerScore = 
    (userData.job_postings?.length || 0) * 0.4 +
    (userData.candidate_searches?.length || 0) * 0.3 +
    (userData.recruitment_tool_usage || 0) * 0.1

  const studentScore = userData.is_student ? 0.5 : 0

  const recruiterScore = 
    (userData.candidate_contacts?.length || 0) * 0.4 +
    (userData.ats_usage || 0) * 0.3

  const scores = {
    job_seeker: jobSeekerScore,
    employer: employerScore,
    student: studentScore,
    recruiter: recruiterScore
  }

  return Object.entries(scores).reduce((a, b) => scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b)[0]
}

// Calculate ad relevance score
function calculateRelevance(ad: AdData, userSegment: string, userData: UserData): number {
  let score = 0

  // Segment matching (40% weight)
  if (ad.target_segments.includes(userSegment)) {
    score += 0.4
  }

  // Industry matching (20% weight)
  if (ad.industry && userData.industry && ad.industry.toLowerCase() === userData.industry.toLowerCase()) {
    score += 0.2
  }

  // Location matching (15% weight)
  if (ad.location && userData.location) {
    if (ad.location.toLowerCase() === "remote" || userData.location.toLowerCase().includes(ad.location.toLowerCase())) {
      score += 0.15
    }
  }

  // Skills/Keywords matching (15% weight)
  if (ad.keywords && userData.skills) {
    const keywordMatches = ad.keywords.filter(keyword => 
      userData.skills!.some(skill => skill.toLowerCase().includes(keyword.toLowerCase()))
    ).length
    if (keywordMatches > 0) {
      score += 0.15 * Math.min(keywordMatches / ad.keywords.length, 1.0)
    }
  }

  // Recent search relevance (10% weight)
  if (ad.keywords && userData.job_searches) {
    const searchMatches = userData.job_searches.filter(search =>
      ad.keywords.some(keyword => search.toLowerCase().includes(keyword.toLowerCase()))
    ).length
    if (searchMatches > 0) {
      score += 0.1 * Math.min(searchMatches / userData.job_searches.length, 1.0)
    }
  }

  return Math.max(0, Math.min(score, 1.0))
}

// GET /api/ads - Get personalized ads for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract user data from query parameters or request headers
    const userId = searchParams.get('user_id') || 'anonymous'
    const numAds = parseInt(searchParams.get('num_ads') || '3')
    const context = searchParams.get('context') // e.g., 'jobs', 'companies', 'profile'
    
    // In a real implementation, you would fetch user data from your database
    // For now, we'll use mock data or extract from query parameters
    const userData: UserData = {
      user_id: userId,
      job_searches: searchParams.get('job_searches')?.split(',') || [],
      job_applications: searchParams.get('job_applications')?.split(',') || [],
      skills: searchParams.get('skills')?.split(',') || [],
      industry: searchParams.get('industry') || undefined,
      location: searchParams.get('location') || undefined,
      profile_completeness: parseInt(searchParams.get('profile_completeness') || '0'),
      is_student: searchParams.get('is_student') === 'true'
    }

    // Classify user
    const userSegment = classifyUser(userData)

    // Score and select relevant ads
    const scoredAds = mockAds.map(ad => ({
      ...ad,
      relevance_score: calculateRelevance(ad, userSegment, userData)
    })).filter(ad => ad.relevance_score > 0)

    // Sort by relevance and select top ads
    scoredAds.sort((a, b) => b.relevance_score! - a.relevance_score!)
    const selectedAds = scoredAds.slice(0, numAds)

    // Apply context-based adjustments
    if (context) {
      selectedAds.forEach(ad => {
        if (context === 'jobs' && ad.ad_type === 'job_listing') {
          ad.relevance_score! *= 1.3
        } else if (context === 'companies' && ad.ad_type === 'sponsored_company') {
          ad.relevance_score! *= 1.4
        } else if (context === 'profile' && ['resume_builder', 'career_service'].includes(ad.ad_type)) {
          ad.relevance_score! *= 1.2
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ads: selectedAds,
        user_segment: userSegment,
        total_available: mockAds.length,
        context: context
      }
    })

  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ads' },
      { status: 500 }
    )
  }
}

// POST /api/ads/track - Track ad events (impressions, clicks, conversions)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ad_id, event_type, user_id, conversion_value } = body

    // Validate required fields
    if (!ad_id || !event_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: ad_id, event_type' },
        { status: 400 }
      )
    }

    // Find the ad
    const ad = mockAds.find(a => a.id === ad_id)
    if (!ad) {
      return NextResponse.json(
        { success: false, error: 'Ad not found' },
        { status: 404 }
      )
    }

    // In a real implementation, you would:
    // 1. Log the event to your analytics database
    // 2. Update ad performance metrics
    // 3. Adjust ad spend and budget
    // 4. Send data to your Python backend for ML model updates

    const trackingData = {
      ad_id,
      event_type,
      user_id: user_id || 'anonymous',
      timestamp: new Date().toISOString(),
      conversion_value: conversion_value || 0,
      cost: event_type === 'click' ? ad.cpc : (event_type === 'impression' ? ad.cpm / 1000 : 0)
    }

    // Here you would typically call your Python backend
    // await fetch('http://localhost:8000/api/ads/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(trackingData)
    // })

    return NextResponse.json({
      success: true,
      data: {
        message: `${event_type} tracked successfully`,
        tracking_data: trackingData
      }
    })

  } catch (error) {
    console.error('Error tracking ad event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track ad event' },
      { status: 500 }
    )
  }
}
