import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

// Helper function to require employer authentication
async function requireEmployerAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  // Check if user is an employer
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { createdCompanies: true }
  });

  if (!user || user.role !== "employer" || !user.createdCompanies.length) {
    return { error: "Access denied. Employer account required.", status: 403 };
  }

  return { user, company: user.createdCompanies[0] };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { company } = auth;

    // Fetch real statistics from database
    const [
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      recentJobs,
      jobTypeDistribution,
      applicationStatusDistribution
    ] = await Promise.all([
      // Total jobs count
      prisma.job.count({
        where: { companyId: company.id }
      }),
      
      // Active jobs count
      prisma.job.count({
        where: { 
          companyId: company.id,
          isActive: true
        }
      }),
      
      // Total applications count
      prisma.application.count({
        where: { companyId: company.id }
      }),
      
      // Pending applications count
      prisma.application.count({
        where: { 
          companyId: company.id,
          status: "submitted"
        }
      }),
      
      // Recent jobs (last 5)
      prisma.job.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: {
            select: { applications: true }
          }
        }
      }),
      
      // Job type distribution
      prisma.job.groupBy({
        by: ["jobType"],
        where: { companyId: company.id },
        _count: { jobType: true }
      }),
      
      // Application status distribution
      prisma.application.groupBy({
        by: ["status"],
        where: { companyId: company.id },
        _count: { status: true }
      })
    ]);

    // Calculate total pages and applications for recent jobs
    const recentJobsWithStats = recentJobs.map(job => ({
      ...job,
      totalPages: Math.ceil(job._count.applications / 10),
      totalApplications: job._count.applications
    }));

    const stats = {
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      profileViews: 0, // Placeholder - implement view tracking later
      companyRating: 4.0, // Placeholder - implement rating system later
      recentJobs: recentJobsWithStats,
      jobTypeDistribution,
      applicationStatusDistribution
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching company stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
