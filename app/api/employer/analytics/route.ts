import { NextRequest, NextResponse } from "next/server";
import { requireEmployerAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Job statistics
    const jobStats = await prisma.job.aggregate({
      where: {
        companyId: user.company.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      }
    });

    // Application statistics
    const applicationStats = await prisma.application.aggregate({
      where: {
        job: { companyId: user.company.id },
        appliedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      }
    });

    // Status breakdown
    const statusBreakdown = await prisma.application.groupBy({
      by: ['status'],
      where: {
        job: { companyId: user.company.id },
        appliedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      }
    });

    // Job type breakdown
    const jobTypeBreakdown = await prisma.job.groupBy({
      by: ['jobType'],
      where: {
        companyId: user.company.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      }
    });

    // Experience level breakdown
    const experienceBreakdown = await prisma.job.groupBy({
      by: ['experienceLevel'],
      where: {
        companyId: user.company.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      }
    });

    // Monthly trends (last 6 months)
    const monthlyTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as job_count
      FROM "Job" 
      WHERE "companyId" = ${user.company.id}
        AND "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month
    `;

    // Application trends (last 6 months)
    const applicationTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "appliedAt") as month,
        COUNT(*) as application_count
      FROM "Application" a
      JOIN "Job" j ON a."jobId" = j.id
      WHERE j."companyId" = ${user.company.id}
        AND a."appliedAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "appliedAt")
      ORDER BY month
    `;

    // Top performing jobs
    const topJobs = await prisma.job.findMany({
      where: { companyId: user.company.id },
      include: {
        _count: {
          select: {
            applications: true,
            bookmarks: true
          }
        }
      },
      orderBy: {
        applications: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Recent applications
    const recentApplications = await prisma.application.findMany({
      where: {
        job: { companyId: user.company.id }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true
          }
        },
        job: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { appliedAt: "desc" },
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalJobs: jobStats._count.id,
          totalApplications: applicationStats._count.id,
          period: `${period} days`
        },
        breakdowns: {
          status: statusBreakdown.reduce((acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
          }, {} as Record<string, number>),
          jobType: jobTypeBreakdown.reduce((acc, item) => {
            acc[item.jobType] = item._count.id;
            return acc;
          }, {} as Record<string, number>),
          experience: experienceBreakdown.reduce((acc, item) => {
            acc[item.experienceLevel] = item._count.id;
            return acc;
          }, {} as Record<string, number>)
        },
        trends: {
          jobs: monthlyTrends,
          applications: applicationTrends
        },
        topJobs,
        recentApplications
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}