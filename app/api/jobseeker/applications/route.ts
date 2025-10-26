import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Jobseeker applications API called');
    
    const session = await auth();
    if (!session?.user?.id) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = session.user;
    console.log('✅ User authenticated:', user.id);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: any = {
      userId: user.id
    };

    if (status && status !== "all") {
      where.status = status;
    }

    console.log('🔍 Querying applications with where clause:', where);

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              jobType: true,
              experienceLevel: true,
              salary: true,
              postedAt: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              logo: true
            }
          }
        },
        orderBy: { appliedAt: "desc" },
        skip,
        take: limit
      }),
      prisma.application.count({ where })
    ]);

    console.log(`📊 Found ${applications.length} applications out of ${total} total for user ${user.id}`);

    // Calculate statistics
    const stats = await prisma.application.aggregate({
      where: {
        userId: user.id
      },
      _count: {
        id: true
      }
    });

    const statusStats = await prisma.application.groupBy({
      by: ['status'],
      where: {
        userId: user.id
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
  } catch (_error) {
    console.error("Error fetching jobseeker applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
