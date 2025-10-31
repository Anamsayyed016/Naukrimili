import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin applications API called');
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      console.log('❌ Admin auth failed:', auth.error);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log('👤 Authenticated admin:', { userId: user.id, email: user.email });
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const jobId = searchParams.get("jobId");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (jobId && jobId !== "all") {
      where.jobId = parseInt(jobId);
    }

    if (search) {
      where.OR = [
        { user: { OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }] } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { job: { title: { contains: search, mode: "insensitive" } } },
        { job: { company: { contains: search, mode: "insensitive" } } }
      ];
    }

    console.log('🔍 Querying applications with where clause:', where);
    
    const [applications, total] = await Promise.all([
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
          },
          resume: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              fileSize: true,
              mimeType: true,
              atsScore: true
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
    
    console.log(`📊 Successfully fetched ${applications.length} applications out of ${total} total for admin`);

    // Normalize application data to ensure consistent structure
    const normalizedApplications = applications.map(app => ({
      ...app,
      applicantName: app.user.firstName && app.user.lastName 
        ? `${app.user.firstName} ${app.user.lastName}`.trim()
        : app.user.firstName || app.user.email || 'Unknown User',
      applicantEmail: app.user.email,
      jobTitle: app.job.title,
      company: app.job.company || (app.company?.name || 'Unknown Company'),
      experience: app.user.experience || 'Not specified',
      location: app.user.location || app.job.location || 'Not specified',
      user: {
        ...app.user,
        name: app.user.firstName && app.user.lastName 
          ? `${app.user.firstName} ${app.user.lastName}`.trim()
          : app.user.firstName || app.user.email || 'Unknown User'
      }
    }));

    // Calculate statistics
    const stats = await prisma.application.aggregate({
      _count: {
        id: true
      }
    });

    const statusStats = await prisma.application.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      applications: normalizedApplications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      totalPages: Math.ceil(total / limit),
      stats: {
        totalApplications: stats._count.id,
        statusBreakdown: statusStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error("Error fetching admin applications:", error);
    
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

