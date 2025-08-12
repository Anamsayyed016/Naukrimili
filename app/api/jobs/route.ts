/**
 * Enhanced Jobs API - Real Database Integration
 * GET /api/jobs - Advanced job search with real data
 * POST /api/jobs - Create new job posting
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedJobService } from '@/lib/enhanced-job-service';
import { extractPaginationFromRequest, extractUserFromRequest, handleDatabaseError } from '@/lib/database-service';
import { jobApi } from '@/lib/api';
import { z } from 'zod';

// Validation schemas
const jobSearchParamsSchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  company: z.string().optional(),
  country: z.string().default('IN'),
  job_type: z.string().optional(),
  experience_level: z.string().optional(),
  sector: z.string().optional(),
  remote: z.string().optional().transform(val => val === 'true'),
  hybrid: z.string().optional().transform(val => val === 'true'),
  featured: z.string().optional().transform(val => val === 'true'),
  urgent: z.string().optional().transform(val => val === 'true'),
  salary_min: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  salary_max: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  skills: z.string().optional().transform(val => val ? val.split(',').filter(Boolean) : undefined),
  date_posted: z.enum(['today', 'week', 'month', 'all']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  companyLogo: z.string().url().optional(),
  location: z.string().optional(),
  country: z.string().min(2, 'Country code is required'),
  description: z.string().min(10, 'Job description must be at least 10 characters'),
  applyUrl: z.string().url().optional(),
  salary: z.string().optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  salaryCurrency: z.string().optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance']).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive', 'internship']).optional(),
  skills: z.array(z.string()).default([]),
  isRemote: z.boolean().default(false),
  isHybrid: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  sector: z.string().optional(),
  source: z.string().default('manual'),
  sourceId: z.string(),
  postedAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  rawJson: z.any().default({}),
});

// GET /api/jobs - Enhanced job search with real database data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate and parse search parameters
    const validatedParams = jobSearchParamsSchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    // Extract pagination parameters
    const pagination = extractPaginationFromRequest(request);

    // Build filters
    const filters: any = {
      q: validatedParams.q,
      location: validatedParams.location,
      company: validatedParams.company,
      country: validatedParams.country,
      jobType: validatedParams.job_type,
      experienceLevel: validatedParams.experience_level,
      sector: validatedParams.sector,
      isRemote: validatedParams.remote,
      isHybrid: validatedParams.hybrid,
      isFeatured: validatedParams.featured,
      isUrgent: validatedParams.urgent,
      salaryMin: validatedParams.salary_min,
      salaryMax: validatedParams.salary_max,
      skills: validatedParams.skills,
      datePosted: validatedParams.date_posted,
    };

    // Search jobs using enhanced service
    const result = await enhancedJobService.searchJobs(filters, pagination);

    // Transform response for frontend compatibility
    const transformedJobs = result.data.map(job => ({
      id: job.id.toString(),
      title: job.title,
      company: job.company || 'Unknown Company',
      company_logo: job.companyLogo,
      location: job.location || 'Remote',
      country: job.country,
      salary: job.salary || `${job.salaryMin ? `${job.salaryMin}` : ''}${job.salaryMax ? ` - ${job.salaryMax}` : ''} ${job.salaryCurrency || ''}`.trim(),
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      salary_currency: job.salaryCurrency,
      job_type: job.jobType,
      experience_level: job.experienceLevel,
      remote: job.isRemote,
      hybrid: job.isHybrid,
      featured: job.isFeatured,
      urgent: job.isUrgent,
      sector: job.sector,
      skills: job.skills,
      posted_at: job.postedAt?.toISOString() || job.createdAt.toISOString(),
      redirect_url: job.applyUrl || `/jobs/${job.id}`,
      created_at: job.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      message: `Found ${result.pagination.total} jobs`,
      jobs: transformedJobs,
      pagination: {
        current_page: result.pagination.page,
        total_pages: result.pagination.totalPages,
        total_results: result.pagination.total,
        per_page: result.pagination.limit,
        has_next: result.pagination.hasNext,
        has_prev: result.pagination.hasPrev,
      },
      filters: filters,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Jobs GET error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid search parameters',
        details: error.errors,
        jobs: [],
        pagination: { current_page: 1, total_pages: 0, total_results: 0, per_page: 20 },
      }, { status: 400 });
    }

    // Handle database errors
    if (error.name === 'DatabaseError') {
      return NextResponse.json({
        success: false,
        error: 'Database error occurred',
        message: error.message,
        jobs: [],
        pagination: { current_page: 1, total_pages: 0, total_results: 0, per_page: 20 },
      }, { status: 500 });
    }

    // Fallback error response
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch jobs',
      jobs: [],
      pagination: { current_page: 1, total_pages: 0, total_results: 0, per_page: 20 },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// POST /api/jobs - Create new job posting with validation
export async function POST(request: NextRequest) {
  try {
    // Extract user authentication (implement based on your auth system)
    const user = extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createJobSchema.parse(body);

    // Create job in database
    const job = await jobApi.createJob({
      title: validatedData.title,
      company: validatedData.company,
      companyLogo: validatedData.companyLogo,
      location: validatedData.location,
      country: validatedData.country,
      description: validatedData.description,
      applyUrl: validatedData.applyUrl,
      salary: validatedData.salary,
      salaryMin: validatedData.salaryMin,
      salaryMax: validatedData.salaryMax,
      salaryCurrency: validatedData.salaryCurrency,
      jobType: validatedData.jobType,
      experienceLevel: validatedData.experienceLevel,
      skills: validatedData.skills,
      isRemote: validatedData.isRemote,
      isHybrid: validatedData.isHybrid,
      isUrgent: validatedData.isUrgent,
      isFeatured: validatedData.isFeatured,
      sector: validatedData.sector,
      source: validatedData.source,
      sourceId: validatedData.sourceId,
      postedAt: validatedData.postedAt,
      rawJson: validatedData.rawJson,
    });

    return NextResponse.json({
      success: true,
      message: 'Job created successfully',
      job: {
        id: job.id.toString(),
        title: job.title,
        company: job.company,
        location: job.location || 'Remote',
        country: 'IN', // Default value since property doesn't exist
        created_at: new Date().toISOString(), // Use current timestamp since createdAt doesn't exist
      },
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error: any) {
    console.error('Jobs POST error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid job data',
        details: error.errors,
      }, { status: 400 });
    }

    // Handle database errors
    if (error.name === 'DatabaseError') {
      let statusCode = 500;
      
      switch (error.code) {
        case 'DUPLICATE_ENTRY':
          statusCode = 409;
          break;
        case 'FOREIGN_KEY_ERROR':
          statusCode = 400;
          break;
      }

      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: error.message,
      }, { status: statusCode });
    }

    // Fallback error response
    return NextResponse.json({
      success: false,
      error: 'Failed to create job',
      message: error.message,
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    },
  });
}
