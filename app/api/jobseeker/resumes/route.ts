import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status"); // active, inactive, all

    const skip = (page - 1) * limit;

    const where: any = {
      userId: session.user.id
    };

    if (status && status !== "all") {
      where.isActive = status === "active";
    }

    const [resumes, total] = await Promise.all([
      prisma.resume.findMany({
        where,
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              appliedAt: true,
              job: {
                select: {
                  id: true,
                  title: true,
                  company: true
                }
              }
            },
            orderBy: { appliedAt: 'desc' },
            take: 3
          },
          _count: {
            select: {
              applications: true,
              views: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.resume.count({ where })
    ]);

    // Calculate statistics
    const stats = await prisma.resume.aggregate({
      where: { userId: session.user.id },
      _count: {
        id: true
      }
    });

    const activeResumes = await prisma.resume.count({
      where: {
        userId: session.user.id,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        resumes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalResumes: stats._count.id,
          activeResumes
        }
      }
    });
  } catch (_error) {
    console.error('Error fetching jobseeker resumes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      fileName,
      fileUrl,
      fileSize,
      mimeType,
      parsedData,
      atsScore,
      isActive = true
    } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { success: false, error: 'File name and URL are required' },
        { status: 400 }
      );
    }

    // If setting as active, deactivate other resumes
    if (isActive) {
      await prisma.resume.updateMany({
        where: {
          userId: session.user.id,
          isActive: true
        },
        data: {
          isActive: false
        }
      });
    }

    const resume = await prisma.resume.create({
      data: {
        fileName,
        fileUrl,
        fileSize: fileSize || 0,
        mimeType: mimeType || 'application/pdf',
        userId: session.user.id,
        isActive,
        parsedData: parsedData || {},
        atsScore: atsScore || 0
      }
    });

    return NextResponse.json({
      success: true,
      data: resume,
      message: 'Resume created successfully'
    }, { status: 201 });
  } catch (_error) {
    console.error('Error creating resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create resume' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
