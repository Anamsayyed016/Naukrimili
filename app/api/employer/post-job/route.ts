import { NextRequest, NextResponse } from "next/server";
import { requireEmployerAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

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
      company,
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

    const job = await prisma.job.create({
      data: {
        title,
        company: company || user.company.name,
        location,
        country,
        description,
        applyUrl,
        salary,
        salaryMin,
        salaryMax,
        salaryCurrency,
        jobType,
        experienceLevel,
        skills,
        isRemote,
        isHybrid,
        isUrgent,
        sector,
        companyId: user.company.id,
        createdBy: user.id,
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
