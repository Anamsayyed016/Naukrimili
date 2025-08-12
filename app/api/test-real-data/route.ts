/**
 * Quick Fix - Simple Working Jobs API for Testing
 * This uses the same Prisma approach as the working seed script
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing direct Prisma connection...');
    
    // Simple direct database query (same as seed script)
    const jobs = await prisma.job.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        country: true,
        salary: true,
        jobType: true,
        isRemote: true,
        isFeatured: true,
        createdAt: true,
      }
    });

    const total = await prisma.job.count();

    console.log(`✅ Successfully fetched ${jobs.length} jobs from database`);

    return NextResponse.json({
      success: true,
      message: `Real database integration working! Found ${total} total jobs`,
      jobs: jobs.map(job => ({
        id: job.id.toString(),
        title: job.title,
        company: job.company || 'Unknown Company',
        location: job.location || 'Remote',
        country: job.country,
        salary: job.salary,
        job_type: job.jobType,
        remote: job.isRemote,
        featured: job.isFeatured,
        posted_at: job.createdAt.toISOString(),
      })),
      total_jobs: total,
      database_status: 'CONNECTED',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Database connection error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      message: error.message,
      database_status: 'DISCONNECTED',
      jobs: [],
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
