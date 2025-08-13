/**
 * Search Suggestions API - Real Database Integration
 * Provides dynamic search suggestions based on actual job data
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-service';

<<<<<<< Current (Your changes)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ suggestions: [] });
  const lower = q.toLowerCase();

  const match = (arr: string[]) => arr.filter(v => v.toLowerCase().includes(lower)).slice(0, 5);

  const titleMatches = match(TITLES).map(v => ({ type: 'title', value: v }));
  const companyMatches = match(COMPANIES).map(v => ({ type: 'company', value: v }));
  const skillMatches = match(SKILLS).map(v => ({ type: 'skill', value: v }));

  // Merge with simple weighting: titles > companies > skills
  const suggestions = [...titleMatches, ...companyMatches, ...skillMatches].slice(0, 10);
  return NextResponse.json({ suggestions });
=======
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    
    if (!q || q.length < 2) {
      return NextResponse.json({ 
        success: true,
        suggestions: [] 
      });
    }
    
    const searchTerm = q.toLowerCase();
    
    // Get dynamic suggestions from real database
    const [titleSuggestions, companySuggestions, skillSuggestions, locationSuggestions] = await Promise.all([
      // Get unique job titles that match the search
      prisma.job.findMany({
        where: {
          title: {
            contains: searchTerm,
            mode: 'insensitive'
          },
          isActive: true
        },
        select: { title: true },
        distinct: ['title'],
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      
      // Get unique companies that match the search
      prisma.job.findMany({
        where: {
          company: {
            contains: searchTerm,
            mode: 'insensitive'
          },
          isActive: true,
          company: { not: null }
        },
        select: { company: true },
        distinct: ['company'],
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      
      // Get skills that match the search
      prisma.$queryRaw<{skill: string}[]>`
        SELECT DISTINCT unnest(skills) as skill
        FROM "Job"
        WHERE array_to_string(skills, ' ') ILIKE ${'%' + searchTerm + '%'}
        AND "isActive" = true
        LIMIT 5
      `,
      
      // Get unique locations that match the search
      prisma.job.findMany({
        where: {
          location: {
            contains: searchTerm,
            mode: 'insensitive'
          },
          isActive: true,
          location: { not: null }
        },
        select: { location: true },
        distinct: ['location'],
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);
    
    // Format suggestions with type and frequency data
    const suggestions = [
      ...titleSuggestions.map(job => ({ 
        type: 'title', 
        value: job.title,
        category: 'Job Titles'
      })),
      ...companySuggestions.map(job => ({ 
        type: 'company', 
        value: job.company!,
        category: 'Companies'
      })),
      ...skillSuggestions.map(skill => ({ 
        type: 'skill', 
        value: skill.skill,
        category: 'Skills'
      })),
      ...locationSuggestions.map(job => ({ 
        type: 'location', 
        value: job.location!,
        category: 'Locations'
      }))
    ].slice(0, 10); // Limit to 10 total suggestions
    
    return NextResponse.json({ 
      success: true,
      suggestions,
      query: q,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Search suggestions error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch search suggestions',
      suggestions: [],
      message: error.message
    }, { status: 500 });
  }
>>>>>>> Incoming (Background Agent changes)
}
