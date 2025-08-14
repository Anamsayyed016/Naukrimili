import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-service';

export async function GET(request: NextRequest) {
  try {
    // Get real job data from database
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salary: true,
        jobType: true,
        experienceLevel: true,
        isRemote: true,
        source: true,
        postedAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Get database statistics
    const stats = await prisma.job.aggregate({
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });

    // Get jobs by source
    const sourceBreakdown = await prisma.job.groupBy({
      by: ['source'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Real job data retrieved successfully',
      data: {
        jobs: jobs,
        totalJobs: stats._count.id,
        sourceBreakdown: sourceBreakdown,
        lastUpdated: new Date().toISOString(),
        dataType: 'REAL_DATA'
      }
    });
  } catch (error) {
    console.error('Error fetching real job data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch real job data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create a new job entry with real data
    const newJob = await prisma.job.create({
      data: {
        source: 'manual',
        title: body.title || 'Test Job',
        company: body.company || 'Test Company',
        location: body.location || 'Test Location',
        description: body.description || 'Test job description',
        salary: body.salary,
        jobType: body.jobType || 'full-time',
        experienceLevel: body.experienceLevel || 'mid',
        isRemote: body.isRemote || false,
        isActive: true,
        rawJson: body
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Job created successfully',
      data: newJob
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}