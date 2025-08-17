import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireEmployerAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { createdCompanies: true }
  });

  if (!user || user.role !== "employer" || !user.createdCompanies.length) {
    return { error: "Access denied. Employer account required.", status: 403 };
  }

  return { user, company: user.createdCompanies[0] };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { company } = auth;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const jobId = searchParams.get("jobId");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {
      job: { companyId: company.id }
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (jobId && jobId !== "all") {
      where.jobId = jobId;
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { job: { title: { contains: search, mode: "insensitive" } } }
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              location: true,
              profilePicture: true
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              location: true
            }
          }
        },
        orderBy: { appliedAt: "desc" },
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
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
