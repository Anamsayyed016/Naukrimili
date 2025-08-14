/**
 * Search Suggestions API - Real Database Integration
 * Provides dynamic search suggestions based on actual job data
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const [titleSuggestions, companySuggestions, locationSuggestions] = await Promise.all([
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
        value: job.title
      })),
      ...companySuggestions.map(job => ({ 
        type: 'company', 
        value: job.company!
      })),
      ...locationSuggestions.map(job => ({ 
        type: 'location', 
        value: job.location!
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
    
    // Fallback suggestions if database is not available
    const fallbackSuggestions = getFallbackSuggestions(q);
    
    return NextResponse.json({ 
      success: true,
      suggestions: fallbackSuggestions,
      fallback: true,
      message: 'Using fallback suggestions'
    });
  }
}

function getFallbackSuggestions(query: string) {
  const q = query.toLowerCase();
  const titles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'Designer', 'Developer'];
  const companies = ['TCS', 'Infosys', 'Wipro', 'Accenture', 'IBM'];
  const locations = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai'];
  
  const suggestions = [
    ...titles.filter(t => t.toLowerCase().includes(q)).map(v => ({ type: 'title', value: v })),
    ...companies.filter(c => c.toLowerCase().includes(q)).map(v => ({ type: 'company', value: v })),
    ...locations.filter(l => l.toLowerCase().includes(q)).map(v => ({ type: 'location', value: v }))
  ];
  
  return suggestions.slice(0, 8);
}
