import { NextRequest, NextResponse } from "next/server";
import { requireEmployerAuth } from "@/lib/auth-utils";
import { auth } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Temporary bypass for debugging - return all jobs
    console.log('🔍 Fetching jobs without authentication...');
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const jobType = searchParams.get("jobType");
    const experienceLevel = searchParams.get("experienceLevel");

    const skip = (page - 1) * limit;

    // For now, get all jobs (we'll filter by user later)
    const where: any = {};

    if (status && status !== "all") {
      where.isActive = status === "active";
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } }
      ];
    }

    if (jobType && jobType !== "all") {
      where.jobType = jobType;
    }

    if (experienceLevel && experienceLevel !== "all") {
      where.experienceLevel = experienceLevel;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              appliedAt: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              applications: true,
              bookmarks: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.job.count({ where })
    ]);

    // Calculate statistics
    const stats = await prisma.job.aggregate({
      _count: {
        id: true
      }
    });

    const totalApplications = await prisma.application.count();

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalJobs: stats._count.id,
          totalApplications
        }
      }
    });
  } catch (error) {
    console.error("Error fetching company jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const body = await request.json();
    
    const {
      title,
      company: companyName,
      location,
      country = "IN",
      description,
      applyUrl,
      salary,
      salaryMin,
      salaryMax,
      salaryCurrency = "INR",
      jobType,
      experienceLevel,
      skills = [],
      isRemote = false,
      isHybrid = false,
      isUrgent = false,
      sector
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Get the user's company for job creation
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found. Please complete your company profile first." },
        { status: 400 }
      );
    }

    const job = await prisma.job.create({
      data: {
        title,
        company: companyName || company.name,
        location,
        country,
        description,
        requirements: JSON.stringify([]),
        applyUrl,
        salary,
        salaryMin,
        salaryMax,
        salaryCurrency,
        jobType,
        experienceLevel,
        skills: JSON.stringify(skills),
        isRemote,
        isHybrid,
        isUrgent,
        sector,
        source: "manual",
        rawJson: body
      }
    });

    return NextResponse.json({
      success: true,
      data: job,
      message: "Job posted successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

