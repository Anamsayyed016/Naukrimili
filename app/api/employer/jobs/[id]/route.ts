import { NextRequest, NextResponse } from "next/server";
import { requireEmployerAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - Fetch single job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const jobId = params.id;

    if (!jobId) {
      return NextResponse.json(
        { error: "Invalid job ID" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: user.company.id
      },
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
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
      { error: "Failed to fetch job" },
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
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const jobId = params.id;
    const body = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Invalid job ID" },
        { status: 400 }
      );
    }

    // Verify job belongs to employer's company
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: user.company.id
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
      location,
      country = "IN",
      jobType,
      experienceLevel,
      salary,
      salaryMin,
      salaryMax,
      salaryCurrency = "INR",
      skills = [],
      isRemote = false,
      isHybrid = false,
      isUrgent = false,
      isFeatured = false,
      sector,
      requirements,
      benefits,
      applicationDeadline
    } = body;

    // Validate required fields
    if (!title || !description || !location) {
      return NextResponse.json(
        { error: "Title, description, and location are required" },
        { status: 400 }
      );
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        title,
        description,
        location,
        country,
        jobType,
        experienceLevel,
        salary,
        salaryMin,
        salaryMax,
        salaryCurrency,
        skills,
        isRemote,
        isHybrid,
        isUrgent,
        isFeatured,
        sector,
        requirements: requirements ? [requirements] : existingJob.requirements,
        // applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        updatedAt: new Date()
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
      { error: "Failed to update job" },
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
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const jobId = params.id;

    if (!jobId) {
      return NextResponse.json(
        { error: "Invalid job ID" },
        { status: 400 }
      );
    }

    // Verify job belongs to employer's company
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: user.company.id
      }
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Delete job and related applications
    await prisma.$transaction(async (tx) => {
      // Delete applications first
      await tx.application.deleteMany({
        where: { jobId: jobId }
      });

      // Delete job bookmarks
      await tx.jobBookmark.deleteMany({
        where: { jobId: jobId }
      });

      // Delete the job
      await tx.job.delete({
        where: { id: jobId }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}