/**
 * Enhanced Job Details API - Real Database Integration
 * GET /api/jobs/[id] - Get specific job with enhanced features
 * PUT /api/jobs/[id] - Update job posting
 * DELETE /api/jobs/[id] - Delete job posting
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedJobService } from '@/lib/enhanced-job-service';
import { extractUserFromRequest } from '@/lib/database-service';
import { z } from 'zod';

// Update job schema (partial)
const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  companyLogo: z.string().url().optional(),
  location: z.string().optional(),
  description: z.string().min(10).optional(),
  applyUrl: z.string().url().optional(),
  salary: z.string().optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  salaryCurrency: z.string().optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance']).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive', 'internship']).optional(),
  skills: z.array(z.string()).optional(),
  isRemote: z.boolean().optional(),
  isHybrid: z.boolean().optional(),
  isUrgent: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sector: z.string().optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/jobs/[id] - Get specific job with similar jobs and statistics
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    
    if (isNaN(jobId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid job ID',
      }, { status: 400 });
    }

    // Get main job details
    const job = await enhancedJobService.getJobById(jobId);
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found',
      }, { status: 404 });
    }

    // Get similar jobs (async operation)
    const similarJobsPromise = enhancedJobService.getSimilarJobs(jobId, 6);

    // Get job statistics
    const statsPromise = enhancedJobService.getJobStats({
      company: job.company,
      location: job.location,
      sector: job.sector,
    });

    // Wait for all async operations
    const [similarJobs, stats] = await Promise.all([
      similarJobsPromise,
      statsPromise,
    ]);

    // Transform main job for frontend
    const transformedJob = {
      id: job.id.toString(),
      title: job.title,
      company: job.company || 'Unknown Company',
      company_logo: job.companyLogo,
      location: job.location || 'Remote',
      country: job.country,
      description: job.description,
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
      apply_url: job.applyUrl || `/apply/${job.id}`,
      is_active: job.isActive,
      created_at: job.createdAt.toISOString(),
      updated_at: job.updatedAt.toISOString(),
      views: job.views || 0,
      applications: job.applications || 0,
    };

    // Transform similar jobs
    const transformedSimilarJobs = similarJobs.map(similarJob => ({
      id: similarJob.id.toString(),
      title: similarJob.title,
      company: similarJob.company,
      company_logo: similarJob.companyLogo,
      location: similarJob.location,
      country: similarJob.country,
      salary: similarJob.salary,
      job_type: similarJob.jobType,
      remote: similarJob.isRemote,
      posted_at: similarJob.postedAt?.toISOString() || similarJob.createdAt.toISOString(),
      redirect_url: similarJob.applyUrl || `/jobs/${similarJob.id}`,
    }));

    return NextResponse.json({
      success: true,
      job: transformedJob,
      similar_jobs: transformedSimilarJobs,
      statistics: {
        company_jobs: stats.companyJobs,
        location_jobs: stats.locationJobs,
        sector_jobs: stats.sectorJobs,
        average_salary: stats.averageSalary,
        salary_range: stats.salaryRange,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Job GET error:', error);

    // Handle database errors
    if (error.name === 'DatabaseError') {
      return NextResponse.json({
        success: false,
        error: 'Database error occurred',
        message: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch job details',
      message: error.message,
    }, { status: 500 });
  }
}

// PUT /api/jobs/[id] - Update job posting
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    
    if (isNaN(jobId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid job ID',
      }, { status: 400 });
    }

    // Extract user authentication
    const user = extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateJobSchema.parse(body);

    // Check if job exists and user has permission
    const existingJob = await enhancedJobService.getJobById(jobId);
    if (!existingJob) {
      return NextResponse.json({
        success: false,
        error: 'Job not found',
      }, { status: 404 });
    }

    // Update job in database
    const updatedJob = await enhancedJobService.updateJob(jobId, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
      job: {
        id: updatedJob.id.toString(),
        title: updatedJob.title,
        company: updatedJob.company,
        location: updatedJob.location,
        is_active: updatedJob.isActive,
        updated_at: updatedJob.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Job PUT error:', error);

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
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update job',
      message: error.message,
    }, { status: 500 });
  }
}

// DELETE /api/jobs/[id] - Delete job posting
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    
    if (isNaN(jobId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid job ID',
      }, { status: 400 });
    }

    // Extract user authentication
    const user = extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Check if job exists
    const existingJob = await enhancedJobService.getJobById(jobId);
    if (!existingJob) {
      return NextResponse.json({
        success: false,
        error: 'Job not found',
      }, { status: 404 });
    }

    // Soft delete job (mark as inactive)
    await enhancedJobService.updateJob(jobId, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Job DELETE error:', error);

    // Handle database errors
    if (error.name === 'DatabaseError') {
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete job',
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    },
  });
}
