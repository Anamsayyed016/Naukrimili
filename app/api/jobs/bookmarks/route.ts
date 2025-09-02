/**
 * Enhanced Job Bookmarks API - Real Database Integration
 * GET /api/jobs/bookmarks - Get user's bookmarked jobs
 * POST /api/jobs/bookmarks - Add job to bookmarks
 * DELETE /api/jobs/bookmarks/[jobId] - Remove job from bookmarks
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const bookmarks = await prisma.jobBookmark.findMany({
      where: { userId: session.user.id },
      include: {
        job: true
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.jobBookmark.count({
      where: { userId: session.user.id }
    });

    const data = bookmarks.map(bookmark => ({
      id: bookmark.id,
      job_id: bookmark.jobId,
      job: {
        id: bookmark.job.id,
        title: bookmark.job.title,
        company: bookmark.job.company,
        location: bookmark.job.location,
        salary: bookmark.job.salary,
        job_type: bookmark.job.jobType,
        remote: bookmark.job.isRemote,
        featured: bookmark.job.isFeatured,
        urgent: bookmark.job.isUrgent,
        posted_at: bookmark.job.postedAt?.toISOString(),
        redirect_url: `/jobs/${bookmark.job.id}`,
        is_active: bookmark.job.isActive,
      },
      notes: bookmark.notes || '',
      bookmarked_at: bookmark.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      bookmarks: data,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_results: total,
        per_page: limit,
        has_next: page * limit < total,
        has_prev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Bookmarks error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch bookmarks' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body = await request.json();
    const jobId = body.jobId;

    if (!jobId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid jobId' 
      }, { status: 400 });
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job not found' 
      }, { status: 404 });
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.jobBookmark.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId: jobId
        }
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
        userId: session.user.id,
        jobId: jobId,
        notes: body.notes || ''
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Job bookmarked successfully',
      bookmark: {
        id: bookmark.id,
        job_id: bookmark.jobId,
        bookmarked_at: bookmark.createdAt.toISOString(),
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Bookmark creation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to bookmark job' 
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
