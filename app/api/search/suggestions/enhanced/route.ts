/**
 * Enhanced AI Search Suggestions API
 * Provides personalized suggestions based on user history, resume, and applications
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

// Initialize OpenAI only if API key is available
let openai: any = null;
if (process.env.OPENAI_API_KEY) {
  try {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.warn('OpenAI initialization failed:', error);
  }
}

export interface EnhancedSuggestionRequest {
  query?: string;
  location?: string;
  context?: 'job_search' | 'company_search' | 'skill_search';
  includeHistory?: boolean;
  includeResume?: boolean;
  includeApplications?: boolean;
}

export interface EnhancedSuggestion {
  query: string;
  confidence: number;
  reasoning: string;
  category: 'job_title' | 'company' | 'location' | 'skill' | 'industry';
  source: 'history' | 'resume' | 'applications' | 'ai_generated' | 'popular';
}

/**
 * GET /api/search/suggestions/enhanced
 * Get enhanced AI-powered search suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const context = (searchParams.get('context') as any) || 'job_search';
    const includeHistory = searchParams.get('includeHistory') !== 'false';
    const includeResume = searchParams.get('includeResume') !== 'false';
    const includeApplications = searchParams.get('includeApplications') !== 'false';

    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        suggestions: getFallbackSuggestions(query, location)
      });
    }

    // Get user context data
    const userContext = await getUserContext(session.user.id, {
      includeHistory,
      includeResume,
      includeApplications
    });

    // Generate AI suggestions
    const aiSuggestions = await generateAISuggestions({
      query,
      location,
      context,
      userContext
    });

    // Get popular suggestions
    const popularSuggestions = await getPopularSuggestions(session.user.id);

    // Combine all suggestions
    const allSuggestions = [
      ...aiSuggestions,
      ...popularSuggestions
    ];

    // Remove duplicates and sort by confidence
    const uniqueSuggestions = removeDuplicateSuggestions(allSuggestions)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      suggestions: uniqueSuggestions,
      context: {
        hasHistory: userContext.searchHistory.length > 0,
        hasResume: userContext.resumeData !== null,
        hasApplications: userContext.applications.length > 0
      }
    });

  } catch (error) {
    console.error('Enhanced suggestions error:', error);
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    
    return NextResponse.json({
      success: true,
      suggestions: getFallbackSuggestions(query, location)
    });
  }
}

/**
 * POST /api/search/suggestions/enhanced
 * Get enhanced suggestions with detailed context
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body: EnhancedSuggestionRequest = await request.json();
    
    const {
      query = '',
      location = '',
      context = 'job_search',
      includeHistory = true,
      includeResume = true,
      includeApplications = true
    } = body;

    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        suggestions: getFallbackSuggestions(query, location)
      });
    }

    // Get user context data
    const userContext = await getUserContext(session.user.id, {
      includeHistory,
      includeResume,
      includeApplications
    });

    // Generate AI suggestions
    const aiSuggestions = await generateAISuggestions({
      query,
      location,
      context,
      userContext
    });

    // Get contextual suggestions based on user data
    const contextualSuggestions = await getContextualSuggestions(userContext, query, location);

    // Combine all suggestions
    const allSuggestions = [
      ...aiSuggestions,
      ...contextualSuggestions
    ];

    // Remove duplicates and sort by confidence
    const uniqueSuggestions = removeDuplicateSuggestions(allSuggestions)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15);

    return NextResponse.json({
      success: true,
      suggestions: uniqueSuggestions,
      context: {
        hasHistory: userContext.searchHistory.length > 0,
        hasResume: userContext.resumeData !== null,
        hasApplications: userContext.applications.length > 0,
        userSkills: [], // Commented out as skills field doesn't exist in Resume model
        recentSearches: userContext.searchHistory.slice(0, 5).map(h => h.query)
      }
    });

  } catch (error) {
    console.error('Enhanced suggestions error:', error);
    
    const { query = '', location = '' } = await request.json().catch(() => ({}));
    
    return NextResponse.json({
      success: true,
      suggestions: getFallbackSuggestions(query, location)
    });
  }
}

// Helper functions

async function getUserContext(userId: string, options: {
  includeHistory: boolean;
  includeResume: boolean;
  includeApplications: boolean;
}) {
  const [searchHistory, resumeData, applications] = await Promise.all([
    options.includeHistory ? prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        query: true,
        location: true,
        filters: true,
        searchType: true,
        createdAt: true
      }
    }) : [],
    
    options.includeResume ? prisma.resume.findFirst({
      where: { userId, isActive: true },
      select: {
        parsedData: true,
        fileName: true,
        specialties: true
      }
    }) : null,
    
    options.includeApplications ? prisma.application.findMany({
      where: { userId },
      take: 10,
      select: {
        job: {
          select: {
            title: true,
            company: true,
            skills: true,
            sector: true
          }
        }
        // createdAt: true // Commented out as createdAt field doesn't exist in Application model
      }
    }) : []
  ]);

  return {
    searchHistory,
    resumeData,
    applications
  };
}

async function generateAISuggestions(params: {
  query: string;
  location: string;
  context: string;
  userContext: any;
}): Promise<EnhancedSuggestion[]> {
  const { query, location, context, userContext } = params;

  if (!openai || !process.env.OPENAI_API_KEY) {
    return getFallbackSuggestions(query, location);
  }

  try {
    // Build context for AI
    const contextData = buildAIContext(userContext, query, location);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI job search assistant. Generate personalized search suggestions based on the user's context.

          User Context:
          ${contextData}

          Generate 5-8 search suggestions that are:
          1. Relevant to the user's background and interests
          2. Varied in approach (job titles, skills, companies, industries)
          3. Personalized based on their history
          4. Include both specific and broad suggestions

          Return as JSON array with:
          - query: the search term
          - confidence: 0-1 relevance score
          - reasoning: why this suggestion is relevant
          - category: job_title, company, location, skill, or industry
          - source: ai_generated`
        },
        {
          role: "user",
          content: `Generate search suggestions for: "${query}" in ${location || 'any location'}

          Context: ${context}
          
          Focus on suggestions that would help this user find better job opportunities based on their profile.`
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      return getFallbackSuggestions(query, location);
    }

    try {
      const suggestions = JSON.parse(response);
      return Array.isArray(suggestions) ? suggestions : [suggestions];
    } catch (parseError) {
      return getFallbackSuggestions(query, location);
    }

  } catch (error) {
    console.error('AI suggestions error:', error);
    return getFallbackSuggestions(query, location);
  }
}

async function getPopularSuggestions(userId: string): Promise<EnhancedSuggestion[]> {
  try {
    const popularSearches = await prisma.searchHistory.groupBy({
      by: ['query'],
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 5
    });

    return popularSearches.map(item => ({
      query: item.query,
      confidence: Math.min(0.9, item._count.query / 10), // Normalize confidence
      reasoning: `You've searched for this ${item._count.query} times recently`,
      category: 'job_title' as const,
      source: 'history' as const
    }));
  } catch (error) {
    console.error('Error getting popular suggestions:', error);
    return [];
  }
}

async function getContextualSuggestions(userContext: any, query: string, location: string): Promise<EnhancedSuggestion[]> {
  const suggestions: EnhancedSuggestion[] = [];

  // Skills-based suggestions from resume
  // Commented out as skills field doesn't exist in Resume model
  // if (userContext.resumeData?.skills) {
  //   try {
  //     const skills = JSON.parse(userContext.resumeData.skills);
  //     if (Array.isArray(skills)) {
  //       skills.slice(0, 3).forEach((skill: string) => {
  //         suggestions.push({
  //           query: `${skill} jobs`,
  //           confidence: 0.8,
  //           reasoning: `Based on your skills: ${skill}`,
  //           category: 'skill',
  //           source: 'resume'
  //         });
  //       });
  //     }
  //   } catch (error) {
  //     // Ignore JSON parse errors
  //   }
  // }

  // Company suggestions from applications
  const companies = [...new Set(userContext.applications.map((app: any) => app.job.company))];
  companies.slice(0, 3).forEach((company: string) => {
    suggestions.push({
      query: `jobs at ${company}`,
      confidence: 0.7,
      reasoning: `You've applied to ${company} before`,
      category: 'company',
      source: 'applications'
    });
  });

  // Location suggestions
  if (location) {
    suggestions.push({
      query: `${query} remote`,
      confidence: 0.6,
      reasoning: 'Try remote positions for more opportunities',
      category: 'location',
      source: 'ai_generated'
    });
  }

  return suggestions;
}

function buildAIContext(userContext: any, query: string, location: string): string {
  const searchHistory = userContext.searchHistory.slice(0, 5).map((h: any) => h.query).join(', ');
  // const skills = userContext.resumeData?.skills ? JSON.parse(userContext.resumeData.skills).slice(0, 5).join(', ') : 'None';
  const applications = userContext.applications.slice(0, 3).map((app: any) => app.job.title).join(', ');

  return `
    Search History: ${searchHistory || 'None'}
    Skills: None // Commented out as skills field doesn't exist in Resume model
    Recent Applications: ${applications || 'None'}
    Current Query: ${query}
    Location: ${location || 'Not specified'}
  `;
}

function removeDuplicateSuggestions(suggestions: EnhancedSuggestion[]): EnhancedSuggestion[] {
  const seen = new Set();
  return suggestions.filter(suggestion => {
    const key = suggestion.query.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getFallbackSuggestions(query: string, location: string): EnhancedSuggestion[] {
  const baseQuery = query || 'jobs';
  const baseLocation = location || '';

  return [
    {
      query: `${baseQuery} jobs`,
      confidence: 0.9,
      reasoning: 'Direct job search with your terms',
      category: 'job_title',
      source: 'popular'
    },
    {
      query: `${baseQuery} careers`,
      confidence: 0.8,
      reasoning: 'Alternative terminology for broader results',
      category: 'job_title',
      source: 'popular'
    },
    {
      query: `${baseQuery} positions`,
      confidence: 0.7,
      reasoning: 'Using "positions" for variety',
      category: 'job_title',
      source: 'popular'
    },
    ...(baseLocation ? [{
      query: `${baseQuery} in ${baseLocation}`,
      confidence: 0.8,
      reasoning: `Location-specific search in ${baseLocation}`,
      category: 'location' as const,
      source: 'popular' as const
    }] : [])
  ];
}
