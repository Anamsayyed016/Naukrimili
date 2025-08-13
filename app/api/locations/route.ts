/**
 * Locations API - Real Database Integration
 * GET /api/locations - Get locations with job counts and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, extractPaginationFromRequest } from '@/lib/database-service';
import { z } from 'zod';

// Location search schema
const locationSearchSchema = z.object({
  q: z.string().optional(),
  country: z.string().optional(),
  min_jobs: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  remote_only: z.string().optional().transform(val => val === 'true'),
  sort_by: z.enum(['name', 'job_count', 'latest_job']).optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate search parameters
    const validatedParams = locationSearchSchema.parse(
      Object.fromEntries(searchParams.entries())
    );
    
    const pagination = extractPaginationFromRequest(request);
    
    // Build where conditions
    const jobWhereConditions: any = {
      isActive: true
    };
    
    if (validatedParams.country) {
      jobWhereConditions.country = validatedParams.country;
    }
    
    if (validatedParams.remote_only) {
      jobWhereConditions.isRemote = true;
    }
    
    if (validatedParams.q) {
      jobWhereConditions.OR = [
        { location: { contains: validatedParams.q, mode: 'insensitive' } },
        { country: { contains: validatedParams.q, mode: 'insensitive' } }
      ];
    }
    
    // Get locations with job counts (excluding null locations unless remote_only)
    const locationWhereConditions = validatedParams.remote_only ? 
      jobWhereConditions : 
      { ...jobWhereConditions, location: { not: null } };
    
    const locations = await prisma.job.groupBy({
      by: ['location', 'country'],
      where: locationWhereConditions,
      _count: {
        id: true
      },
      _max: {
        createdAt: true,
        salary: true,
        salaryMax: true
      },
      having: validatedParams.min_jobs ? {
        id: { _count: { gte: validatedParams.min_jobs } }
      } : undefined,
      orderBy: validatedParams.sort_by === 'name' ? { location: validatedParams.sort_order } :
               validatedParams.sort_by === 'job_count' ? { _count: { id: validatedParams.sort_order } } :
               { _max: { createdAt: validatedParams.sort_order } },
      take: pagination.limit,
      skip: (pagination.page - 1) * pagination.limit,
    });
    
    // Get total count for pagination
    const totalLocations = await prisma.job.findMany({
      where: locationWhereConditions,
      select: { location: true, country: true },
      distinct: ['location', 'country']
    });
    
    // Format location data with additional statistics
    const formattedLocations = await Promise.all(
      locations.map(async (locationGroup) => {
        const locationName = locationGroup.location || 'Remote';
        const countryName = locationGroup.country;
        
        // Get job type breakdown for this location
        const jobTypeStats = await prisma.job.groupBy({
          by: ['jobType'],
          where: {
            location: locationGroup.location,
            country: countryName,
            isActive: true,
            jobType: { not: null }
          },
          _count: { jobType: true }
        });
        
        // Get remote/hybrid stats
        const remoteStats = await prisma.job.aggregate({
          where: {
            location: locationGroup.location,
            country: countryName,
            isActive: true
          },
          _count: {
            _all: true
          },
          _sum: {
            isRemote: true,
            isHybrid: true
          }
        });
        
        // Get salary statistics
        const salaryStats = await prisma.job.aggregate({
          where: {
            location: locationGroup.location,
            country: countryName,
            isActive: true,
            salaryMin: { not: null }
          },
          _avg: {
            salaryMin: true,
            salaryMax: true
          },
          _min: {
            salaryMin: true
          },
          _max: {
            salaryMax: true
          }
        });
        
        return {
          id: `${locationName}-${countryName}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: locationName,
          country: countryName,
          display_name: locationName === 'Remote' ? 'Remote' : `${locationName}, ${countryName}`,
          job_count: locationGroup._count.id,
          latest_job_date: locationGroup._max.createdAt?.toISOString(),
          job_types: Object.fromEntries(
            jobTypeStats.map(stat => [stat.jobType!, stat._count.jobType])
          ),
          work_arrangements: {
            on_site: remoteStats._count._all - (remoteStats._sum.isRemote || 0) - (remoteStats._sum.isHybrid || 0),
            remote: remoteStats._sum.isRemote || 0,
            hybrid: remoteStats._sum.isHybrid || 0
          },
          salary_stats: {
            average_min: salaryStats._avg.salaryMin ? Math.round(salaryStats._avg.salaryMin) : null,
            average_max: salaryStats._avg.salaryMax ? Math.round(salaryStats._avg.salaryMax) : null,
            lowest: salaryStats._min.salaryMin,
            highest: salaryStats._max.salaryMax,
            currency: 'INR' // Default to INR, could be made dynamic
          }
        };
      })
    );
    
    const totalPages = Math.ceil(totalLocations.length / pagination.limit);
    
    return NextResponse.json({
      success: true,
      message: `Found ${totalLocations.length} locations`,
      locations: formattedLocations,
      pagination: {
        current_page: pagination.page,
        total_pages: totalPages,
        total_results: totalLocations.length,
        per_page: pagination.limit,
        has_next: pagination.page < totalPages,
        has_prev: pagination.page > 1,
      },
      filters: validatedParams,
      summary: {
        total_jobs: formattedLocations.reduce((sum, loc) => sum + loc.job_count, 0),
        unique_locations: formattedLocations.length,
        countries_covered: [...new Set(formattedLocations.map(loc => loc.country))].length
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('Locations GET error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid search parameters',
        details: error.errors,
        locations: []
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch locations',
      message: error.message,
      locations: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Location creation not supported',
    message: 'Locations are automatically extracted from job postings'
  }, { status: 405 });
}