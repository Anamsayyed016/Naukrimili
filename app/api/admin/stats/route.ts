import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    // Get comprehensive system statistics
    const [
      totalUsers,
      newUsersThisWeek,
      totalJobs,
      activeJobs,
      pendingJobs,
      totalCompanies,
      verifiedCompanies,
      totalApplications,
      recentUsers,
      recentJobs,
      jobTypeDistribution,
      userRoleDistribution
    ] = await Promise.all([
      // User statistics
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      
      // Job statistics
      prisma.job.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.job.count({ where: { isActive: false } }),
      
      // Company statistics
      prisma.company.count(),
      prisma.company.count({ where: { isVerified: true } }),
      
      // Application statistics
      prisma.application.count(),
      
      // Recent data
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, email: true, name: true, role: true, createdAt: true }
      }),
      prisma.job.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, company: true, location: true, createdAt: true }
      }),
      
      // Distribution data
      prisma.job.groupBy({
        by: ['jobType'],
        _count: { jobType: true }
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      })
    ]);

    // Calculate growth rates (comparing current week to previous week)
    const currentWeekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const previousWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    const [currentWeekJobs, previousWeekJobs] = await Promise.all([
      prisma.job.count({ where: { createdAt: { gte: currentWeekStart } } }),
      prisma.job.count({ where: { createdAt: { gte: previousWeekStart, lt: currentWeekStart } } })
    ]);

    const jobGrowthRate = previousWeekJobs > 0 
      ? ((currentWeekJobs - previousWeekJobs) / previousWeekJobs) * 100 
      : 0;

    const stats = {
      overview: {
        totalUsers,
        totalJobs,
        totalCompanies,
        totalApplications,
        activeJobs,
        pendingJobs,
        verifiedCompanies
      },
      growth: {
        newUsersThisWeek,
        newJobsThisWeek: currentWeekJobs,
        jobGrowthRate: Math.round(jobGrowthRate * 100) / 100
      },
      recent: {
        users: recentUsers,
        jobs: recentJobs
      },
      distributions: {
        jobTypes: jobTypeDistribution.reduce((acc, item) => {
          acc[item.jobType || 'unknown'] = item._count.jobType;
          return acc;
        }, {} as Record<string, number>),
        userRoles: userRoleDistribution.reduce((acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
