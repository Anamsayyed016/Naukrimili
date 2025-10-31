import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    // Test database connection first
    await prisma.$connect();
    console.log('✅ Database connected for admin stats');

    // Get comprehensive system statistics with error handling
      let totalUsers = 0, newUsersThisWeek = 0, totalJobs = 0, activeJobs = 0, pendingJobs = 0;
    let totalCompanies = 0, verifiedCompanies = 0, totalApplications = 0, pendingApplications = 0;
    let totalViews = 0, averageSalary = 0;
    let recentUsers = [], recentJobs = [], recentApplications = [], jobTypeDistribution = [], userRoleDistribution = [];

    try {
      const [
        totalUsersResult,
        newUsersThisWeekResult,
        totalJobsResult,
        activeJobsResult,
        pendingJobsResult,
        totalCompaniesResult,
        verifiedCompaniesResult,
        totalApplicationsResult,
        pendingApplicationsResult,
        viewsAggregateResult,
        salaryAggregateResult,
        recentUsersResult,
        recentJobsResult,
        recentApplicationsResult,
        jobTypeDistributionResult,
        userRoleDistributionResult
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
        prisma.application.count({ where: { status: { in: ['pending', 'submitted'] } } }),
        
        // Platform views - sum of all job views
        prisma.job.aggregate({
          _sum: { views: true }
        }),
        
        // Average salary calculation
        prisma.job.aggregate({
          where: {
            salaryMin: { not: null },
            salaryMax: { not: null }
          },
          _avg: {
            salaryMin: true,
            salaryMax: true
          }
        }),
        
        // Recent data
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
        }),
        prisma.job.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, title: true, company: true, location: true, createdAt: true }
        }),
        prisma.application.findMany({
          orderBy: { appliedAt: 'desc' },
          take: 5,
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true }
            },
            job: {
              select: { id: true, title: true, company: true }
            },
            resume: {
              select: { id: true, fileName: true, fileUrl: true }
            }
          }
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

      // Extract values from results
      totalUsers = totalUsersResult;
      newUsersThisWeek = newUsersThisWeekResult;
      totalJobs = totalJobsResult;
      activeJobs = activeJobsResult;
      pendingJobs = pendingJobsResult;
      totalCompanies = totalCompaniesResult;
      verifiedCompanies = verifiedCompaniesResult;
      totalApplications = totalApplicationsResult;
      pendingApplications = pendingApplicationsResult;
      // Extract total views - handle null/undefined cases
      totalViews = viewsAggregateResult._sum?.views ?? 0;
      if (totalViews === null || totalViews === undefined) {
        totalViews = 0;
      }
      
      // Calculate average salary - handle null/undefined cases
      const avgMin = salaryAggregateResult._avg?.salaryMin;
      const avgMax = salaryAggregateResult._avg?.salaryMax;
      
      if (avgMin !== null && avgMin !== undefined && avgMax !== null && avgMax !== undefined) {
        averageSalary = (Number(avgMin) + Number(avgMax)) / 2;
      } else {
        averageSalary = 0;
      }
      
      console.log('🔍 Debug - Aggregate results:', {
        viewsSum: viewsAggregateResult._sum,
        totalViews,
        salaryAvg: salaryAggregateResult._avg,
        avgMin,
        avgMax,
        calculatedAverageSalary: averageSalary
      });
      
      recentUsers = recentUsersResult;
      recentJobs = recentJobsResult;
      recentApplications = recentApplicationsResult || [];
      jobTypeDistribution = jobTypeDistributionResult;
      userRoleDistribution = userRoleDistributionResult;
    } catch (dbError) {
      console.error('❌ Database query failed:', dbError);
      // Return mock data if database fails
      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalUsers: 0,
            totalJobs: 0,
            totalCompanies: 0,
            totalApplications: 0,
            pendingApplications: 0,
            activeJobs: 0,
            pendingJobs: 0,
            verifiedCompanies: 0,
            totalViews: 0,
            averageSalary: 0
          },
          growth: {
            newUsersThisWeek: 0,
            newJobsThisWeek: 0,
            jobGrowthRate: 0
          },
          recent: {
            users: [],
            jobs: []
          },
          distributions: {
            jobTypes: {},
            userRoles: {}
          }
        },
        message: 'Database temporarily unavailable - showing empty data'
      });
    }

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

    // Ensure values are numbers, not null/undefined
    const safeTotalViews = Number(totalViews) || 0;
    const safeAverageSalary = Math.round(Number(averageSalary) || 0);
    
    const stats = {
      overview: {
        totalUsers,
        totalJobs,
        totalCompanies,
        totalApplications,
        pendingApplications,
        activeJobs,
        pendingJobs,
        verifiedCompanies,
        totalViews: safeTotalViews,
        averageSalary: safeAverageSalary
      },
      growth: {
        newUsersThisWeek,
        newJobsThisWeek: currentWeekJobs,
        jobGrowthRate: Math.round(jobGrowthRate * 100) / 100
      },
      recent: {
        users: recentUsers,
        jobs: recentJobs,
        applications: recentApplications.map(app => ({
          id: app.id,
          status: app.status,
          appliedAt: app.appliedAt.toISOString(),
          user: {
            id: app.user.id,
            email: app.user.email,
            firstName: app.user.firstName,
            lastName: app.user.lastName
          },
          job: {
            id: app.job.id,
            title: app.job.title,
            company: app.job.company
          },
          resume: app.resume ? {
            id: app.resume.id,
            fileName: app.resume.fileName,
            fileUrl: app.resume.fileUrl
          } : null,
          applicantName: app.user.firstName && app.user.lastName 
            ? `${app.user.firstName} ${app.user.lastName}`.trim()
            : app.user.firstName || app.user.email || 'Unknown User',
          jobTitle: app.job.title,
          company: app.job.company || 'Unknown Company'
        }))
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

    console.log('📊 Admin stats calculated:', {
      totalUsers,
      totalJobs,
      totalApplications,
      activeJobs,
      totalViews: safeTotalViews,
      averageSalary: safeAverageSalary,
      verifiedCompanies,
      pendingApplications,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (_error) {
    console.error('Admin stats error:', _error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
