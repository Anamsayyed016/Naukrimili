/**
 * Simple Unlimited Search API for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple unlimited search API called');
    
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const country = searchParams.get('country') || 'IN';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    
    console.log('📊 Simple search params:', { query, location, country, page, limit });
    
    // Simple database query
    const where: any = {
      isActive: true
    };
    
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    if (country) {
      where.country = country;
    }
    
    console.log('📊 Database where clause:', where);
    
    // Get total count
    const totalJobs = await prisma.job.count({ where });
    console.log(`📊 Total jobs in database: ${totalJobs}`);
    
    // Get jobs with pagination
    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        country: true,
        description: true,
        salary: true,
        jobType: true,
        experienceLevel: true,
        isRemote: true,
        isFeatured: true,
        sector: true,
        postedAt: true,
        createdAt: true,
        source: true,
        sourceId: true,
        applyUrl: true,
        source_url: true
      }
    });
    
    console.log(`✅ Found ${jobs.length} jobs from database`);
    
    // Generate some sample jobs if we don't have enough
    const sampleJobs = [];
    if (jobs.length < limit) {
      const sampleCount = Math.min(10, limit - jobs.length);
      for (let i = 0; i < sampleCount; i++) {
        sampleJobs.push({
          id: `sample-${Date.now()}-${i}`,
          title: `${query || 'Software'} Engineer ${i + 1}`,
          company: `Sample Company ${i + 1}`,
          location: location || 'Remote',
          country: country,
          description: `This is a sample job description for ${query || 'Software'} Engineer position.`,
          salary: '$50,000 - $80,000',
          jobType: 'Full-time',
          experienceLevel: 'Mid Level',
          isRemote: true,
          isFeatured: false,
          sector: 'Technology',
          postedAt: new Date(),
          createdAt: new Date(),
          source: 'sample',
          sourceId: `sample-${i}`,
          applyUrl: '#',
          source_url: '#'
        });
      }
    }
    
    const allJobs = [...jobs, ...sampleJobs];
    
    const response = {
      success: true,
      jobs: allJobs,
      pagination: {
        currentPage: page,
        totalJobs: totalJobs + sampleJobs.length,
        hasMore: (page * limit) < (totalJobs + sampleJobs.length),
        nextPage: (page * limit) < (totalJobs + sampleJobs.length) ? page + 1 : null,
        jobsPerPage: limit,
        totalPages: Math.ceil((totalJobs + sampleJobs.length) / limit)
      },
      sources: {
        database: jobs.length,
        external: 0,
        sample: sampleJobs.length
      },
      metadata: {
        sectors: ['Technology', 'Healthcare', 'Finance', 'Education'],
        countries: [country],
        searchTime: new Date().toISOString(),
        query,
        location,
        country
      }
    };
    
    console.log(`✅ Simple search completed: ${allJobs.length} jobs returned`);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Simple unlimited search failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Simple search failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
