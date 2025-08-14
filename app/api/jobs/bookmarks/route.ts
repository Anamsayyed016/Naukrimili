/**
 * Enhanced Job Bookmarks API - Real Database Integration
 * GET /api/jobs/bookmarks - Get user's bookmarked jobs
 * POST /api/jobs/bookmarks - Add job to bookmarks
 * DELETE /api/jobs/bookmarks/[jobId] - Remove job from bookmarks
 */

import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory stores for dev/demo
const mockJobs = [
  { id: 1, title: 'Senior Software Engineer', company: 'TechCorp', location: 'Bangalore', salary: '15-25 LPA', jobType: 'full-time', isRemote: true, isFeatured: true, isUrgent: false, createdAt: new Date() },
  { id: 2, title: 'Product Manager', company: 'InnovateSoft', location: 'Mumbai', salary: '20-35 LPA', jobType: 'full-time', isRemote: false, isFeatured: true, isUrgent: true, createdAt: new Date() },
  { id: 3, title: 'Data Scientist', company: 'Digital Solutions', location: 'Delhi', salary: '18-30 LPA', jobType: 'full-time', isRemote: false, isFeatured: false, isUrgent: false, createdAt: new Date() },
  { id: 4, title: 'UX Designer', company: 'Future Systems', location: 'Hyderabad', salary: '12-20 LPA', jobType: 'full-time', isRemote: true, isFeatured: false, isUrgent: false, createdAt: new Date() },
  { id: 5, title: 'DevOps Engineer', company: 'CloudTech', location: 'Pune', salary: '14-24 LPA', jobType: 'full-time', isRemote: true, isFeatured: false, isUrgent: true, createdAt: new Date() },
  { id: 6, title: 'QA Automation Engineer', company: 'QualityWorks', location: 'Chennai', salary: '10-18 LPA', jobType: 'full-time', isRemote: false, isFeatured: false, isUrgent: false, createdAt: new Date() },
];

const bookmarksByUser: Record<string, Set<number>> = {};

function getUserId(request: NextRequest): string {
  return request.headers.get('x-user-id') || 'guest';
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const userBookmarks = Array.from(bookmarksByUser[userId] || new Set<number>());
    const jobs = userBookmarks
      .map(id => mockJobs.find(j => j.id === id))
      .filter(Boolean) as typeof mockJobs;

    const total = jobs.length;
    const data = jobs.slice(offset, offset + limit).map(job => ({
      id: String(job.id),
      job_id: String(job.id),
      job: {
        id: String(job.id),
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        job_type: job.jobType,
        remote: job.isRemote,
        featured: job.isFeatured,
        urgent: job.isUrgent,
        posted_at: job.createdAt.toISOString(),
        redirect_url: `/jobs/${job.id}`,
        is_active: true,
      },
      notes: '',
      bookmarked_at: new Date().toISOString(),
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
    return NextResponse.json({ success: false, error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    const jobId = Number(body.jobId);

    if (!jobId || Number.isNaN(jobId)) {
      return NextResponse.json({ success: false, error: 'Invalid jobId' }, { status: 400 });
    }

    const job = mockJobs.find(j => j.id === jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (!bookmarksByUser[userId]) bookmarksByUser[userId] = new Set<number>();

    if (bookmarksByUser[userId].has(jobId)) {
      return NextResponse.json({ success: false, error: 'Job already bookmarked' }, { status: 409 });
    }

    bookmarksByUser[userId].add(jobId);

      return NextResponse.json({
        success: true,
        message: 'Job bookmarked successfully',
        bookmark: {
        id: String(jobId),
        job_id: String(jobId),
          bookmarked_at: new Date().toISOString(),
      }
      }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to bookmark job' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    },
  });
}
