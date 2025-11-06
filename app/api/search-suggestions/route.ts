/**
 * Search Suggestions API - Real Database Integration
 * Provides dynamic search suggestions based on actual job data
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache suggestions for 5 minutes to improve performance
const suggestionCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    // Check cache first
    const cached = suggestionCache.get(q.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Fetch dynamic suggestions from database
    const suggestions = await getDynamicSuggestions(q);

    const responseData = {
      success: true,
      suggestions,
      query: q,
      timestamp: new Date().toISOString(),
    };

    // Cache the result
    suggestionCache.set(q.toLowerCase(), {
      data: responseData,
      timestamp: Date.now()
    });

    // Clean old cache entries (keep only last 100)
    if (suggestionCache.size > 100) {
      const firstKey = suggestionCache.keys().next().value;
      suggestionCache.delete(firstKey);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    // Return fallback suggestions on error
    return NextResponse.json({ 
      success: true, 
      suggestions: getFallbackSuggestions(q || '') 
    });
  }
}

async function getDynamicSuggestions(query: string) {
  const q = query.toLowerCase();
  
  try {
    // Fetch from database in parallel for speed
    const [jobTitles, companies, skills, locations] = await Promise.all([
      // Job titles from actual jobs
      prisma.job.findMany({
        where: {
          title: {
            contains: query,
            mode: 'insensitive'
          },
          isActive: true
        },
        select: { title: true },
        distinct: ['title'],
        take: 5,
        orderBy: { views: 'desc' }
      }),
      
      // Companies from actual jobs
      prisma.job.findMany({
        where: {
          company: {
            contains: query,
            mode: 'insensitive'
          },
          isActive: true
        },
        select: { company: true },
        distinct: ['company'],
        take: 5,
        orderBy: { applicationsCount: 'desc' }
      }),
      
      // Skills from actual jobs
      prisma.job.findMany({
        where: {
          skills: {
            contains: query,
            mode: 'insensitive'
          },
          isActive: true
        },
        select: { skills: true },
        take: 10
      }),
      
      // Locations from actual jobs
      prisma.job.findMany({
        where: {
          location: {
            contains: query,
            mode: 'insensitive'
          },
          isActive: true
        },
        select: { location: true },
        distinct: ['location'],
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Parse skills and extract unique ones
    const skillSet = new Set<string>();
    skills.forEach(job => {
      if (job.skills) {
        try {
          const parsedSkills = JSON.parse(job.skills);
          if (Array.isArray(parsedSkills)) {
            parsedSkills.forEach(skill => {
              if (typeof skill === 'string' && skill.toLowerCase().includes(q)) {
                skillSet.add(skill);
              }
            });
          }
        } catch {
          // If not JSON, treat as comma-separated
          const skillArray = job.skills.split(',').map(s => s.trim());
          skillArray.forEach(skill => {
            if (skill.toLowerCase().includes(q)) {
              skillSet.add(skill);
            }
          });
        }
      }
    });

    // Combine all suggestions
    const allSuggestions = [
      ...jobTitles.map(j => ({ type: 'title', value: j.title })),
      ...companies.filter(c => c.company).map(c => ({ type: 'company', value: c.company! })),
      ...Array.from(skillSet).slice(0, 5).map(s => ({ type: 'skill', value: s })),
      ...locations.filter(l => l.location).map(l => ({ type: 'location', value: l.location! }))
    ];

    // Remove duplicates and limit to 15
    const uniqueSuggestions = Array.from(
      new Map(allSuggestions.map(item => [item.value, item])).values()
    ).slice(0, 15);

    return uniqueSuggestions.length > 0 ? uniqueSuggestions : getFallbackSuggestions(query);
  } catch (error) {
    console.error('Error fetching dynamic suggestions:', error);
    return getFallbackSuggestions(query);
  }
}

function getFallbackSuggestions(query: string) {
  const q = query.toLowerCase();
  const titles = [
    'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer',
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Business Analyst',
    'Marketing Manager', 'Sales Executive', 'HR Manager', 'Content Writer', 'Graphic Designer'
  ];
  const companies = ['TechCorp', 'InnovateSoft', 'Digital Solutions', 'Future Systems', 'CloudTech'];
  const locations = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];
  const skills = ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'SQL', 'AWS', 'Docker'];

  const suggestions = [
    ...titles.filter(t => t.toLowerCase().includes(q)).map(v => ({ type: 'title', value: v })),
    ...companies.filter(c => c.toLowerCase().includes(q)).map(v => ({ type: 'company', value: v })),
    ...skills.filter(s => s.toLowerCase().includes(q)).map(v => ({ type: 'skill', value: v })),
    ...locations.filter(l => l.toLowerCase().includes(q)).map(v => ({ type: 'location', value: v })),
  ];

  return suggestions.slice(0, 10);
}
