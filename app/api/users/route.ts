/**
 * Enhanced User Management API - Real Database Integration
 * GET /api/users - Get user list (admin only)
 * POST /api/users - Create new user
 * GET /api/users/[id] - Get specific user
 * PUT /api/users/[id] - Update user
 * DELETE /api/users/[id] - Delete user
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

async function requireAdminAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id as string, 10) }
  });

  if (!user || user.role !== "admin") {
    return { error: "Access denied. Admin account required.", status: 403 };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (role && role !== "all") {
      where.role = role;
    }

    if (status && status !== "all") {
      where.isActive = status === "active";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          location: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              applications: true,
              createdJobs: true,
              createdCompanies: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
