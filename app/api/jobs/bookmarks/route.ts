/**
 * Enhanced Job Bookmarks API - Real Database Integration
 * GET /api/jobs/bookmarks - Get user's bookmarked jobs
 * POST /api/jobs/bookmarks - Add job to bookmarks
 * DELETE /api/jobs/bookmarks/[jobId] - Remove job from bookmarks
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedJobService } from '@/lib/enhanced-job-service';
import { extractUserFromRequest, extractPaginationFromRequest } from '@/lib/database-service';
import { z } from 'zod';

// Bookmark creation schema
const createBookmarkSchema = z.object({
  jobId: z.number().positive(),
  notes: z.string().optional(),
});

// GET /api/jobs/bookmarks - Get user's bookmarked jobs with pagination
export async function GET(request: NextRequest) {
  try {
    // Extract user authentication
    const user = extractUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Extract pagination parameters
    const pagination = extractPaginationFromRequest(request);

    // Get user's bookmarked jobs
    const result = await enhancedJobService.getUserBookmarks(user.id, pagination);

    // Transform bookmarks for frontend
    const transformedBookmarks = result.data.map(bookmark => ({
      id: bookmark.id.toString(),
      job_id: bookmark.jobId.toString(),
      job: {
        id: bookmark.job.id.toString(),
        title: bookmark.job.title,
        company: bookmark.job.company,
        company_logo: bookmark.job.companyLogo,
        location: bookmark.job.location,
        country: bookmark.job.country,
        salary: bookmark.job.salary,
        job_type: bookmark.job.jobType,
        remote: bookmark.job.isRemote,
        featured: bookmark.job.isFeatured,
        urgent: bookmark.job.isUrgent,
        posted_at: bookmark.job.postedAt?.toISOString() || bookmark.job.createdAt.toISOString(),
        redirect_url: bookmark.job.applyUrl || `/jobs/${bookmark.job.id}`,
        is_active: bookmark.job.isActive,
      },
      notes: bookmark.notes,
      bookmarked_at: bookmark.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      message: `Found ${result.pagination.total} bookmarked jobs`,
      bookmarks: transformedBookmarks,
      pagination: {
        current_page: result.pagination.page,
        total_pages: result.pagination.totalPages,
        total_results: result.pagination.total,
        per_page: result.pagination.limit,
        has_next: result.pagination.hasNext,
        has_prev: result.pagination.hasPrev,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Bookmarks GET error:', error);

    // Handle database errors
    if (error.name === 'DatabaseError') {
      return NextResponse.json({
        success: false,
        error: 'Database error occurred',
        message: error.message,
        bookmarks: [],
        pagination: { current_page: 1, total_pages: 0, total_results: 0, per_page: 20 },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bookmarks',
      bookmarks: [],
      pagination: { current_page: 1, total_pages: 0, total_results: 0, per_page: 20 },
    }, { status: 500 });
  }
}

// POST /api/jobs/bookmarks - Add job to bookmarks
export async function POST(request: NextRequest) {
  try {
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
    const validatedData = createBookmarkSchema.parse(body);

    // Check if job exists
    const job = await enhancedJobService.getJobById(validatedData.jobId);
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found',
      }, { status: 404 });
    }

    // Add bookmark
    const bookmark = await enhancedJobService.addJobBookmark(
      user.id,
      validatedData.jobId,
      validatedData.notes
    );

    return NextResponse.json({
      success: true,
      message: 'Job bookmarked successfully',
      bookmark: {
        id: bookmark.id.toString(),
        job_id: bookmark.jobId.toString(),
        notes: bookmark.notes,
        bookmarked_at: bookmark.createdAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error: any) {
    console.error('Bookmarks POST error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid bookmark data',
        details: error.errors,
      }, { status: 400 });
    }

    // Handle database errors
    if (error.name === 'DatabaseError') {
      let statusCode = 500;
      
      // Handle duplicate bookmark (user already bookmarked this job)
      if (error.code === 'DUPLICATE_ENTRY' || error.message.includes('unique constraint')) {
        statusCode = 409;
        return NextResponse.json({
          success: false,
          error: 'Job already bookmarked',
          message: 'You have already bookmarked this job',
        }, { status: statusCode });
      }

      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: error.message,
      }, { status: statusCode });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to bookmark job',
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
