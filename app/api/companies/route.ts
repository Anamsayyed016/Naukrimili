import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const industry = searchParams.get("industry");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: {
      isActive?: boolean;
      isVerified?: boolean;
      industry?: string;
      name?: { contains: string; mode: string };
    } = {};

    if (status && status !== "all") {
      switch (status) {
        case "verified":
          where.isVerified = true;
          break;
        case "unverified":
          where.isVerified = false;
          break;
        case "inactive":
          where.isActive = false;
          break;
      }
    }

    if (industry && industry !== "all") {
      where.industry = industry;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } }
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              jobs: true,
              applications: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.company.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        companies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (_error) {
    console.error("Error fetching companies:", _error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { action, companyIds } = body;

    if (!companyIds || companyIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No company IDs provided" },
        { status: 400 }
      );
    }

    let updateData: {
      isActive?: boolean;
      isVerified?: boolean;
      name?: string;
      description?: string;
      website?: string;
      location?: string;
      industry?: string;
      size?: string;
      founded?: number;
    } = {};
    let message = '';

    switch (action) {
      case 'verify':
        updateData = { isVerified: true };
        message = 'Companies verified successfully';
        break;
      case 'unverify':
        updateData = { isVerified: false };
        message = 'Companies unverified successfully';
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update companies
    const updatedCompanies = await prisma.company.updateMany({
      where: { id: { in: companyIds } },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message,
      data: { updatedCount: updatedCompanies.count }
    });

  } catch (_error) {
    console.error("Error performing bulk action:", _error);
    return NextResponse.json(
      { success: false, error: "Failed to perform action" },
      { status: 500 }
    );
  }
}