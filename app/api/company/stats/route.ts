import { NextRequest, NextResponse } from 'next/server';
import { requireEmployerAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;

    // Get company
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Get company stats
    const [
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      recentJobs,
      jobTypeDistribution,
      applicationStatusDistribution
    ] = await Promise.all([
      // Total jobs
      prisma.job.count({
        where: { companyId: company.id }
      }),
      
      // Active jobs
      prisma.job.count({
        where: { 
          companyId: company.id,
          isActive: true
        }
      }),
      
      // Total applications
      prisma.application.count({
        where: { companyId: company.id }
      }),
      
      // Pending applications
      prisma.application.count({
        where: { 
          companyId: company.id,
          status: 'submitted'
        }
      }),
      
      // Recent jobs with application counts
      prisma.job.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: {
            select: { applications: true }
          }
        }
      }),
      
      // Job type distribution
      prisma.job.groupBy({
        by: ['jobType'],
        where: { companyId: company.id },
        _count: { jobType: true }
      }),
      
      // Application status distribution
      prisma.application.groupBy({
        by: ['status'],
        where: { companyId: company.id },
        _count: { status: true }
      })
    ]);

    const stats = {
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      profileViews: 0, // Placeholder - implement later
      companyRating: 0, // Placeholder - implement later
      recentJobs,
      jobTypeDistribution,
      applicationStatusDistribution
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching company stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company stats' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
