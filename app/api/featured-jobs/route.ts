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
        sourceId: true, // CRITICAL: Needed for SEO URL generation
        source: true, // CRITICAL: Needed to identify job type
        title: true,
        company: true,
        companyLogo: true,
        location: true,
        country: true, // CRITICAL: Needed for SEO URL and region validation
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
        experienceLevel: true,
        applyUrl: true,
        source_url: true,
        apply_url: true
      }
    });

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      sourceId: job.sourceId, // CRITICAL: Include for URL generation
      source: job.source || 'database', // CRITICAL: Include for job type identification
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      location: job.location,
      country: job.country || 'IN', // CRITICAL: Always include country
      salary: job.salary || (job.salaryMin && job.salaryMax ? 
        `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency || 'INR'}` : null),
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      jobType: job.jobType,
      isRemote: job.isRemote,
      isFeatured: job.isFeatured,
      isUrgent: job.isUrgent,
      description: job.description,
      requirements: job.requirements || [],
      skills: job.skills || [],
      sector: job.sector,
      experienceLevel: job.experienceLevel,
      postedAt: job.postedAt?.toISOString() || job.createdAt.toISOString(),
      applyUrl: job.applyUrl,
      source_url: job.source_url,
      apply_url: job.apply_url
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
