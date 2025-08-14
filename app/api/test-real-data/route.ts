/**
 * Real Data API for Testing Database Connection and Real Data Retrieval
 * This endpoint validates that the database is connected and returns actual job data
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, checkDatabaseHealth } from '@/lib/database-service';

export async function GET(request: NextRequest) {
  try {
    // Check database health first
    const healthCheck = await checkDatabaseHealth();
    
    if (!healthCheck.isHealthy) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: healthCheck.error,
        latency: healthCheck.latency,
        database_status: 'DISCONNECTED',
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    // Fetch real job data from database
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        country: true,
        salary: true,
        jobType: true,
        experienceLevel: true,
        isRemote: true,
        isFeatured: true,
        source: true,
        postedAt: true,
        createdAt: true
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    });

    // Get total job count
    const totalJobs = await prisma.job.count({
      where: {
        isActive: true
      }
    });

    // Get jobs by source for analytics
    const jobsBySource = await prisma.job.groupBy({
      by: ['source'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });

    // Get recent jobs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentJobs = await prisma.job.count({
      where: {
        isActive: true,
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Real data test successful - Database connected and returning live data',
      jobs: jobs,
      statistics: {
        totalJobs: totalJobs,
        recentJobs: recentJobs,
        jobsBySource: jobsBySource
      },
      database_status: 'CONNECTED',
      database_health: {
        isHealthy: healthCheck.isHealthy,
        latency: healthCheck.latency
      },
      dataType: 'REAL_DATA',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Real data test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Real data test failed',
      error: error.message || 'Unknown database error',
      database_status: 'ERROR',
      dataType: 'ERROR',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create a test job with real database insertion
    const testJob = await prisma.job.create({
      data: {
        source: 'test_api',
        sourceId: `test_${Date.now()}`,
        title: body.title || 'Test API Job',
        company: body.company || 'Test Company API',
        location: body.location || 'Remote',
        country: body.country || 'IN',
        description: body.description || 'This is a test job created via API to verify real data insertion',
        salary: body.salary || 'Competitive',
        jobType: body.jobType || 'full-time',
        experienceLevel: body.experienceLevel || 'mid',
        isRemote: body.isRemote !== undefined ? body.isRemote : true,
        isActive: true,
        rawJson: {
          ...body,
          created_via: 'test_api',
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test job created successfully in database',
      job: testJob,
      dataType: 'REAL_DATA',
      database_status: 'CONNECTED',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Test job creation failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Test job creation failed',
      error: error.message || 'Unknown database error',
      database_status: 'ERROR',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
