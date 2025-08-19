import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

// Helper function to require employer authentication
async function requireEmployerAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  // Check if user is an employer
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { company: true }
  });

  if (!user || user.role !== "employer" || !user.company) {
    return { error: "Access denied. Employer account required.", status: 403 };
  }

  return { user, company: user.company };
}

// POST - Create new job
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user, company } = auth;
    const body = await request.json();

    const {
      title,
      description,
      requirements,
      responsibilities,
      location,
      jobType,
      experienceLevel,
      educationLevel,
      salaryMin,
      salaryMax,
      salaryType,
      skills,
      benefits,
      isRemote,
      isActive = true,
      applicationDeadline,
      maxApplications
    } = body;

    // Validate required fields
    if (!title || !description || !location || !jobType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements: requirements || "",
        responsibilities: responsibilities || "",
        location,
        jobType,
        experienceLevel: experienceLevel || "entry",
        educationLevel: educationLevel || "bachelor",
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        salaryType: salaryType || "yearly",
        skills: skills || [],
        benefits: benefits || [],
        isRemote: isRemote || false,
        isActive,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        maxApplications: maxApplications ? parseInt(maxApplications) : null,
        companyId: company.id,
        createdBy: user.id,
        status: isActive ? "active" : "draft"
      }
    });

    return NextResponse.json({
      success: true,
      data: job,
      message: "Job posted successfully"
    });

  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get employer's jobs with filtering and pagination
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
    const jobType = searchParams.get("jobType");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      companyId: company.id
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (jobType && jobType !== "all") {
      where.jobType = jobType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } }
      ];
    }

    // Get jobs with count
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.job.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// OPTIONS - Handle CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

