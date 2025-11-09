import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15 compatibility: params can be a Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const jobId = parseInt(resolvedParams.id);
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID" },
        { status: 400 }
      );
    }

    // Verify authentication and get user
    const { requireEmployerAuth } = await import("@/lib/auth-utils");
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;

    // Get the user's company
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Check if the job belongs to this company
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id
      },
      include: {
        _count: {
          select: {
            applications: true,
            bookmarks: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or you don't have permission to view this job" },
        { status: 403 }
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15 compatibility: params can be a Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const jobId = parseInt(resolvedParams.id);
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID" },
        { status: 400 }
      );
    }

    // Verify authentication and get user
    const { requireEmployerAuth } = await import("@/lib/auth-utils");
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const body = await request.json();

    // Get the user's company
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Check if the job belongs to this company
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id
      }
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job not found or you don't have permission to update this job" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.requirements !== undefined) {
      updateData.requirements = Array.isArray(body.requirements) 
        ? JSON.stringify(body.requirements) 
        : JSON.stringify([body.requirements]);
    }
    if (body.benefits !== undefined) {
      updateData.benefits = Array.isArray(body.benefits) 
        ? JSON.stringify(body.benefits) 
        : JSON.stringify([body.benefits]);
    }
    if (body.salary !== undefined) updateData.salary = body.salary;
    if (body.jobType !== undefined) updateData.jobType = body.jobType;
    if (body.experienceLevel !== undefined) updateData.experienceLevel = body.experienceLevel;
    if (body.sector !== undefined) updateData.sector = body.sector;
    if (body.skills !== undefined) {
      updateData.skills = Array.isArray(body.skills) 
        ? JSON.stringify(body.skills) 
        : body.skills;
    }
    if (body.isRemote !== undefined) updateData.isRemote = body.isRemote;
    if (body.isHybrid !== undefined) updateData.isHybrid = body.isHybrid;
    if (body.isUrgent !== undefined) updateData.isUrgent = body.isUrgent;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    if (body.applicationDeadline !== undefined) {
      updateData.applicationDeadline = body.applicationDeadline 
        ? new Date(body.applicationDeadline) 
        : null;
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15 compatibility: params can be a Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const jobId = parseInt(resolvedParams.id);
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID" },
        { status: 400 }
      );
    }

    // Verify authentication and get user
    const { requireEmployerAuth } = await import("@/lib/auth-utils");
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log(`🗑️ User ${user.id} attempting to delete job ${jobId}...`);

    // Get the user's company
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Check if the job belongs to this company
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or you don't have permission to delete this job" },
        { status: 403 }
      );
    }

    console.log(`✅ Job ${jobId} belongs to user's company, proceeding with deletion...`);

    // Delete the job
    await prisma.job.delete({
      where: { id: jobId }
    });

    console.log(`✅ Job ${jobId} deleted successfully`);

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