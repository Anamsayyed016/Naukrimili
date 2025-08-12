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
    const result = await enhancedJobService.getUserBookmarks(user.userId, pagination);

    // Transform bookmarks for frontend
    const transformedBookmarks = result.data.map(bookmark => ({
      id: bookmark.id?.toString() || '0',
      job_id: bookmark.id?.toString() || '0',
      job: {
        id: bookmark.id?.toString() || '0',
        title: bookmark.title || 'Unknown Job',
        company: bookmark.company || 'Unknown Company',
        company_logo: bookmark.companyLogo,
        location: bookmark.location || 'Remote',
        country: bookmark.country,
        salary: bookmark.salary || 'N/A',
        job_type: bookmark.jobType || 'full-time',
        remote: bookmark.isRemote || false,
        featured: bookmark.isFeatured || false,
        urgent: bookmark.isUrgent || false,
        posted_at: bookmark.postedAt?.toISOString() || bookmark.createdAt?.toISOString() || new Date().toISOString(),
        redirect_url: bookmark.applyUrl || `/jobs/${bookmark.id}`,
        is_active: true, // Default value
      },
      notes: '', // Default empty notes since property doesn't exist
      bookmarked_at: bookmark.bookmarkedAt?.toISOString() || new Date().toISOString(),
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
    const result = await enhancedJobService.addBookmark(
      user.userId,
      validatedData.jobId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Job bookmarked successfully',
        bookmark: {
          id: validatedData.jobId.toString(),
          job_id: validatedData.jobId.toString(),
          notes: validatedData.notes || '',
          bookmarked_at: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to add bookmark',
      }, { status: 500 });
    }

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
