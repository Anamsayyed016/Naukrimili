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