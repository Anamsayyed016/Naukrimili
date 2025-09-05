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
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const jobId = searchParams.get("jobId");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {
      job: { companyId: user.company.id }
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (jobId && jobId !== "all") {
      where.jobId = parseInt(jobId, 10);
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { job: { title: { contains: search, mode: "insensitive" } } }
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              location: true,
              profilePicture: true,
              bio: true,
              skills: true,
              experience: true
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              company: true,
              jobType: true,
              experienceLevel: true
            }
          }
        },
        orderBy: { appliedAt: "desc" },
        skip,
        take: limit
      }),
      prisma.application.count({ where })
    ]);

    // Calculate statistics
    const stats = await prisma.application.aggregate({
      where: {
        job: { companyId: user.company.id }
      },
      _count: {
        id: true
      }
    });

    const statusStats = await prisma.application.groupBy({
      by: ['status'],
      where: {
        job: { companyId: user.company.id }
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalApplications: stats._count.id,
          statusBreakdown: statusStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id;
            return acc;
          }, {} as Record<string, number>)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching company applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
