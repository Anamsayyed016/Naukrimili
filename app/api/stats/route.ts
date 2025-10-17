import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching stats...');
    
    const [
      totalJobs,
      activeJobs,
      totalApplications
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({
        where: { isActive: true }
      }),
      prisma.application.count()
    ]);

    const stats = {
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications: 0,
      profileViews: 0,
      companyRating: 0
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}