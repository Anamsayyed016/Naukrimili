/**
 * Enhanced Job Bookmarks API - Real Database Integration
 * GET /api/jobs/bookmarks - Get user's bookmarked jobs
 * POST /api/jobs/bookmarks - Add job to bookmarks
 * DELETE /api/jobs/bookmarks/[jobId] - Remove job from bookmarks
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const bookmarkSchema = z.object({
  jobId: z.number().int().positive(),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Get user's bookmarked jobs with pagination
    const [bookmarks, total] = await Promise.all([
      prisma.jobBookmark.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            include: {
              companyRelation: {
                select: {
                  name: true,
                  logo: true,
                  location: true,
                  industry: true,
                  isVerified: true
                }
              }
            }
          }
        }
      }),
      prisma.jobBookmark.count({ where: { userId: user.id } })
    ]);

    // Transform bookmarks to include job details
    const transformedBookmarks = bookmarks.map(bookmark => ({
      id: bookmark.id,
      notes: bookmark.notes,
      bookmarkedAt: bookmark.createdAt,
      job: {
        id: bookmark.job.id,
        title: bookmark.job.title,
        company: bookmark.job.company || bookmark.job.companyRelation?.name || 'Unknown Company',
        companyLogo: bookmark.job.companyLogo || bookmark.job.companyRelation?.logo,
        location: bookmark.job.location,
        country: bookmark.job.country,
        description: bookmark.job.description,
        salary: bookmark.job.salary,
        salaryMin: bookmark.job.salaryMin,
        salaryMax: bookmark.job.salaryMax,
        salaryCurrency: bookmark.job.salaryCurrency,
        jobType: bookmark.job.jobType,
        experienceLevel: bookmark.job.experienceLevel,
        skills: bookmark.job.skills,
        isRemote: bookmark.job.isRemote,
        isHybrid: bookmark.job.isHybrid,
        isUrgent: bookmark.job.isUrgent,
        isFeatured: bookmark.job.isFeatured,
        isActive: bookmark.job.isActive,
        sector: bookmark.job.sector,
        views: bookmark.job.views,
        applicationsCount: bookmark.job.applicationsCount,
        postedAt: bookmark.job.postedAt,
        createdAt: bookmark.job.createdAt,
        // Application URLs
        applyUrl: bookmark.job.applyUrl,
        apply_url: bookmark.job.apply_url,
        source_url: bookmark.job.source_url,
        isExternal: bookmark.job.source !== 'manual',
        // Company information
        companyInfo: bookmark.job.companyRelation ? {
          name: bookmark.job.companyRelation.name,
          logo: bookmark.job.companyRelation.logo,
          location: bookmark.job.companyRelation.location,
          industry: bookmark.job.companyRelation.industry,
          isVerified: bookmark.job.companyRelation.isVerified
        } : null
      }
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        bookmarks: transformedBookmarks,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: user.id
      }
    });

  } catch (error: any) {
    console.error('❌ Bookmarks GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bookmarks',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    const body = await request.json();
    const { jobId, notes } = bookmarkSchema.parse(body);

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, company: true, isActive: true }
    });

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    if (!job.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Cannot bookmark inactive job'
      }, { status: 400 });
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.jobBookmark.findFirst({
      where: {
        userId: user.id,
        jobId: jobId
      }
    });

    if (existingBookmark) {
      return NextResponse.json({
        success: false,
        error: 'Job already bookmarked'
      }, { status: 409 });
    }

    // Create bookmark
    const bookmark = await prisma.jobBookmark.create({
      data: {
        userId: user.id,
        jobId: jobId,
        notes: notes || ''
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salary: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: bookmark,
      message: 'Job bookmarked successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Bookmarks POST error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to bookmark job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const jobId = parseInt(searchParams.get('jobId') || '0');

    if (!jobId || isNaN(jobId)) {
      return NextResponse.json({
        success: false,
        error: 'Valid jobId is required'
      }, { status: 400 });
    }

    // Find and delete bookmark
    const bookmark = await prisma.jobBookmark.findFirst({
      where: {
        userId: user.id,
        jobId: jobId
      }
    });

    if (!bookmark) {
      return NextResponse.json({
        success: false,
        error: 'Bookmark not found'
      }, { status: 404 });
    }

    await prisma.jobBookmark.delete({
      where: { id: bookmark.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Bookmark removed successfully'
    });

  } catch (error: any) {
    console.error('❌ Bookmarks DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove bookmark',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
