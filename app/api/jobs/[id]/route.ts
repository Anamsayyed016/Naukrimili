/**
 * Enhanced Job Details API - Real Database Integration
 * GET /api/jobs/[id] - Get specific job with enhanced features
 * PUT /api/jobs/[id] - Update job posting
 * DELETE /api/jobs/[id] - Delete job posting
 * 
 * This file uses the standard Next.js 15+ API route pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            company: true,
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.job.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        companyLogo: job.companyLogo,
        location: job.location,
        country: job.country,
        description: job.description,
        applyUrl: job.applyUrl,
        postedAt: job.postedAt,
        salary: job.salary,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        skills: job.skills,
        isRemote: job.isRemote,
        isHybrid: job.isHybrid,
        isUrgent: job.isUrgent,
        isFeatured: job.isFeatured,
        sector: job.sector,
        views: job.views,
        applications: job.applications,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        creator: job.creator
      }
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    await prisma.job.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    },
  });
}
