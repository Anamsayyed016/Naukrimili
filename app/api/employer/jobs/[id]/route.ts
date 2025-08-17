import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

// GET - Get specific job details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireEmployerAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { company } = auth;
    const jobId = params.id;

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id
      },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update job
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireEmployerAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { company } = auth;
    const jobId = params.id;
    const body = await request.json();

    // Check if job exists and belongs to company
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id
      }
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

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
      isActive,
      applicationDeadline,
      maxApplications,
      status
    } = body;

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        title: title || undefined,
        description: description || undefined,
        requirements: requirements || undefined,
        responsibilities: responsibilities || undefined,
        location: location || undefined,
        jobType: jobType || undefined,
        experienceLevel: experienceLevel || undefined,
        educationLevel: educationLevel || undefined,
        salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
        salaryType: salaryType || undefined,
        skills: skills || undefined,
        benefits: benefits || undefined,
        isRemote: isRemote !== undefined ? isRemote : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
        maxApplications: maxApplications ? parseInt(maxApplications) : undefined,
        status: status || undefined
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedJob,
      message: "Job updated successfully"
    });

  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireEmployerAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { company } = auth;
    const jobId = params.id;

    // Check if job exists and belongs to company
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id
      }
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Delete job (this will also delete related applications due to cascade)
    await prisma.job.delete({
      where: { id: jobId }
    });

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting job:", error);
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

