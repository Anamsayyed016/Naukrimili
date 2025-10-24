/**
 * Featured Jobs API - Real Database Integration
 * Provides featured job listings for the landing page
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const location = searchParams.get('location');
    const category = searchParams.get('category');

    // Build where clause
    const whereClause: any = {
      isFeatured: true,
      isActive: true
    };

    // Filter by location if specified
    if (location) {
      whereClause.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    // Filter by category/sector if specified
    if (category) {
      whereClause.OR = [
        { title: { contains: category, mode: 'insensitive' } },
        { description: { contains: category, mode: 'insensitive' } },
        { sector: { contains: category, mode: 'insensitive' } }
      ];
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        { isUrgent: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salary: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        jobType: true,
        isRemote: true,
        isFeatured: true,
        isUrgent: true,
        description: true,
        requirements: true,
        skills: true,
        postedAt: true,
        createdAt: true,
        sector: true,
        experienceLevel: true
      }
    });

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || (job.salaryMin && job.salaryMax ? 
        `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency || 'INR'}` : null),
      jobType: job.jobType,
      isRemote: job.isRemote,
      isFeatured: job.isFeatured,
      isUrgent: job.isUrgent,
      description: job.description,
      requirements: job.requirements || [],
      skills: job.skills || [],
      sector: job.sector,
      experienceLevel: job.experienceLevel,
      postedAt: job.postedAt?.toISOString() || job.createdAt.toISOString()
    }));

    const res = NextResponse.json({
      success: true,
      jobs: formattedJobs,
      total: formattedJobs.length,
      message: `Found ${formattedJobs.length} featured jobs`
    });

    // Short cache for homepage sections
    res.headers.set('Cache-Control', 'public, max-age=120, s-maxage=120, stale-while-revalidate=600');
    return res;

  } catch (error: any) {
    console.error('Featured jobs error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch featured jobs',
      jobs: []
    }, { status: 500 });
  }
}
