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
    
    // Get company statistics
    const [totalJobs, activeJobs, totalApplications, recentApplications] = await Promise.all([
      prisma.job.count({
        where: { companyId: user.company.id }
      }),
      prisma.job.count({
        where: { 
          companyId: user.company.id,
          isActive: true
        }
      }),
      prisma.application.count({
        where: {
          job: { companyId: user.company.id }
        }
      }),
      prisma.application.count({
        where: {
          job: { companyId: user.company.id },
          appliedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    // Get job applications by status
    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      where: {
        job: { companyId: user.company.id }
      },
      _count: {
        status: true
      }
    });

    // Get top performing jobs
    const topJobs = await prisma.job.findMany({
      where: { companyId: user.company.id },
      select: {
        id: true,
        title: true,
        applicationsCount: true,
        views: true
      },
      orderBy: { applicationsCount: 'desc' },
      take: 5
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalJobs,
          activeJobs,
          totalApplications,
          recentApplications
        },
        applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        topJobs
      }
    });
  } catch (error) {
    console.error("Error fetching company stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch company statistics" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
