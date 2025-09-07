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
    const status = searchParams.get("status");
    const search = searchParams.get("search");

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

    const where: any = { userId: user.id };

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { job: { title: { contains: search, mode: "insensitive" } } },
        { job: { company: { contains: search, mode: "insensitive" } } }
      ];
    }

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
              salary: true,
              isRemote: true
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
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.application.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applications'
    }, { status: 500 });
  }
}