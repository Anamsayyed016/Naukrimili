import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const [resumes, total] = await Promise.all([
      prisma.resume.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.resume.count({
        where: { userId: user.id }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        resumes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch resumes'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (action === 'create') {
      // If setting as active, deactivate all other resumes first
      if (data.isActive !== false) {
        await prisma.resume.updateMany({
          where: { 
            userId: user.id,
            isActive: true 
          },
          data: { isActive: false }
        });
      }

      const resume = await prisma.resume.create({
        data: {
          userId: user.id,
          fileName: data.fileName || 'resume',
          fileUrl: data.fileUrl || '',
          fileSize: data.fileSize || 0,
          mimeType: data.mimeType || 'application/json',
          parsedData: data.parsedData || {},
          atsScore: data.atsScore || 0,
          isActive: data.isActive !== false,
          isBuilder: data.isBuilder || false
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Resume created successfully',
        resume
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Error creating resume:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create resume'
    }, { status: 500 });
  }
}