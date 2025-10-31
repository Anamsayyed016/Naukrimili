import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/resumes
 * Get all resumes with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } }
      ];
    }

    const [resumes, total] = await Promise.all([
      prisma.resume.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              applications: true,
              views: true
            }
          }
        }
      }),
      prisma.resume.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      resumes: resumes.map(resume => ({
        id: resume.id,
        fileName: resume.fileName,
        fileUrl: resume.fileUrl,
        fileSize: resume.fileSize,
        mimeType: resume.mimeType,
        atsScore: resume.atsScore,
        isActive: resume.isActive,
        createdAt: resume.createdAt.toISOString(),
        user: resume.user,
        _count: resume._count
      })),
      total,
      totalPages,
      currentPage: page,
      limit
    });
  } catch (_error) {
    console.error('Error fetching resumes:', _error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}
