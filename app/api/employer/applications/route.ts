import { NextRequest, NextResponse } from "next/server";
import { requireEmployerAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Employer applications API called');
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      console.log('❌ Employer auth failed:', auth.error);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log('👤 Authenticated employer:', { userId: user.id, companyId: user.company.id, companyName: user.company.name });
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const jobId = searchParams.get("jobId");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {
      companyId: user.company.id
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (jobId && jobId !== "all") {
      where.jobId = jobId;
    }

    if (search) {
      where.OR = [
        { user: { OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }] } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { job: { title: { contains: search, mode: "insensitive" } } }
      ];
    }

    console.log('🔍 Querying applications with where clause:', where);
    
    let applications, total;
    try {
      [applications, total] = await Promise.all([
        prisma.application.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
      
      console.log(`📊 Successfully fetched ${applications.length} applications out of ${total} total for company ${user.company.id}`);
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      throw dbError;
    }

    // Calculate statistics
    const stats = await prisma.application.aggregate({
      where: {
        companyId: user.company.id
      },
      _count: {
        id: true
      }
    });

    const statusStats = await prisma.application.groupBy({
      by: ['status'],
      where: {
        companyId: user.company.id
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
    
    // Provide more detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error('Detailed error information:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: "Failed to fetch applications",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
