import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "appliedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    const where: any = {
      userId: session.user.id
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { job: { title: { contains: search, mode: "insensitive" } } },
        { job: { company: { contains: search, mode: "insensitive" } } },
        { job: { location: { contains: search, mode: "insensitive" } } }
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

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
              isRemote: true,
              isHybrid: true,
              createdAt: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              website: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.application.count({ where })
    ]);

    // Calculate statistics
    const stats = await prisma.application.aggregate({
      where: { userId: session.user.id },
      _count: {
        id: true
      }
    });

    const statusStats = await prisma.application.groupBy({
      by: ['status'],
      where: { userId: session.user.id },
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
    console.error('Error fetching jobseeker applications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, coverLetter, resumeId } = body;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Check if job exists and is active
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        isActive: true
      },
      include: {
        company: true
      }
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found or no longer available' },
        { status: 404 }
      );
    }

    // Check if user already applied for this job
    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: session.user.id,
        jobId: jobId
      }
    });

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: 'You have already applied for this job' },
        { status: 409 }
      );
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId: jobId,
        companyId: job.companyId,
        coverLetter: coverLetter || '',
        resumeId: resumeId || null,
        status: 'submitted'
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
