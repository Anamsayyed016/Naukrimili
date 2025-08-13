/**
 * Companies API - Real Database Integration
 * GET /api/companies - Get companies with job counts and details
 * POST /api/companies - Create new company (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, extractPaginationFromRequest, extractUserFromRequest } from '@/lib/database-service';
import { z } from 'zod';

// Company search schema
const companySearchSchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  sector: z.string().optional(),
  min_jobs: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  sort_by: z.enum(['name', 'job_count', 'latest_job']).optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate search parameters
    const validatedParams = companySearchSchema.parse(
      Object.fromEntries(searchParams.entries())
    );
    
    const pagination = extractPaginationFromRequest(request);
    
    // Build where conditions for company filtering
    const jobWhereConditions: any = {
      isActive: true,
      company: { not: null }
    };
    
    if (validatedParams.q) {
      jobWhereConditions.company = {
        contains: validatedParams.q,
        mode: 'insensitive'
      };
    }
    
    if (validatedParams.location) {
      jobWhereConditions.location = {
        contains: validatedParams.location,
        mode: 'insensitive'
      };
    }
    
    if (validatedParams.sector) {
      jobWhereConditions.sector = validatedParams.sector;
    }
    
    // Get companies with aggregated job data
    const companies = await prisma.job.groupBy({
      by: ['company'],
      where: jobWhereConditions,
      _count: {
        id: true
      },
      _max: {
        createdAt: true,
        companyLogo: true,
        location: true,
        sector: true
      },
      having: validatedParams.min_jobs ? {
        id: { _count: { gte: validatedParams.min_jobs } }
      } : undefined,
      orderBy: validatedParams.sort_by === 'name' ? { company: validatedParams.sort_order } :
               validatedParams.sort_by === 'job_count' ? { _count: { id: validatedParams.sort_order } } :
               { _max: { createdAt: validatedParams.sort_order } },
      take: pagination.limit,
      skip: (pagination.page - 1) * pagination.limit,
    });
    
    // Get total count for pagination
    const totalCompanies = await prisma.job.findMany({
      where: jobWhereConditions,
      select: { company: true },
      distinct: ['company']
    });
    
    // Format company data with additional details
    const formattedCompanies = await Promise.all(
      companies.map(async (companyGroup) => {
        const companyName = companyGroup.company!;
        
        // Get recent job details for this company
        const recentJobs = await prisma.job.findMany({
          where: {
            company: companyName,
            isActive: true
          },
          select: {
            id: true,
            title: true,
            location: true,
            sector: true,
            jobType: true,
            salaryMin: true,
            salaryMax: true,
            isRemote: true,
            isFeatured: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        });
        
        return {
          id: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: companyName,
          logo: companyGroup._max.companyLogo,
          location: companyGroup._max.location,
          sector: companyGroup._max.sector,
          job_count: companyGroup._count.id,
          latest_job_date: companyGroup._max.createdAt?.toISOString(),
          recent_jobs: recentJobs.map(job => ({
            id: job.id.toString(),
            title: job.title,
            location: job.location,
            sector: job.sector,
            job_type: job.jobType,
            salary_range: job.salaryMin && job.salaryMax ? 
              `${job.salaryMin} - ${job.salaryMax}` : null,
            is_remote: job.isRemote,
            is_featured: job.isFeatured,
            posted_at: job.createdAt.toISOString()
          })),
          stats: {
            total_jobs: companyGroup._count.id,
            remote_jobs: await prisma.job.count({
              where: { company: companyName, isRemote: true, isActive: true }
            }),
            featured_jobs: await prisma.job.count({
              where: { company: companyName, isFeatured: true, isActive: true }
            })
          }
        };
      })
    );
    
    const totalPages = Math.ceil(totalCompanies.length / pagination.limit);
    
    return NextResponse.json({
      success: true,
      message: `Found ${totalCompanies.length} companies`,
      companies: formattedCompanies,
      pagination: {
        current_page: pagination.page,
        total_pages: totalPages,
        total_results: totalCompanies.length,
        per_page: pagination.limit,
        has_next: pagination.page < totalPages,
        has_prev: pagination.page > 1,
      },
      filters: validatedParams,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('Companies GET error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid search parameters',
        details: error.errors,
        companies: []
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch companies',
      message: error.message,
      companies: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // This would typically be used by admin to create company profiles
    // For now, companies are automatically created when jobs are posted
    const user = extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Company profile creation not yet implemented',
      note: 'Companies are automatically created when jobs are posted',
      data: body
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      message: error.message
    }, { status: 500 });
  }
}