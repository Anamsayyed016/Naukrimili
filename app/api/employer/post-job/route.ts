import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth-config";
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
      country = "IN",
      jobType,
      experienceLevel,
      educationLevel,
      salaryMin,
      salaryMax,
      salaryCurrency = "INR",
      salaryType = "yearly",
      skills,
      benefits,
      isRemote = false,
      isHybrid = false,
      isUrgent = false,
      isFeatured = false,
      sector,
      applicationDeadline,
      maxApplications,
      isActive = true,
      status = "draft"
    } = body;

    // Validate required fields
    if (!title || !description || !location || !jobType) {
      return NextResponse.json(
        { error: "Title, description, location, and job type are required" },
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
        country,
        jobType,
        experienceLevel: experienceLevel || "entry",
        educationLevel: educationLevel || "bachelor",
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        salaryCurrency,
        salaryType,
        skills: skills || [],
        benefits: benefits || [],
        isRemote,
        isHybrid,
        isUrgent,
        isFeatured,
        sector,
        isActive,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        maxApplications: maxApplications ? parseInt(maxApplications) : null,
        companyId: company.id,
        createdBy: user.id,
        status,
        source: "manual",
        sourceId: `manual-${Date.now()}`,
        rawJson: body
      }
    });

    return NextResponse.json({
      success: true,
      data: job,
      message: "Job posted successfully"
    });

  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
