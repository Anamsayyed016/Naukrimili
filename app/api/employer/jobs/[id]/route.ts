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
    
    console.log('📥 Request body received for job update');
    const body = await request.json();
    console.log('📋 Update payload:', JSON.stringify(body, null, 2));

    // Get the user's company
    console.log('🔍 Looking up company for user:', user.id);
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });
    console.log('🏢 Company found:', company ? `${company.id} - ${company.name}` : 'None');

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Check if the job belongs to this company
    console.log('🔍 Looking up job:', jobId, 'for company:', company.id);
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id
      }
    });
    console.log('📝 Existing job found:', existingJob ? `ID: ${existingJob.id}, Title: ${existingJob.title}` : 'None');

    if (!existingJob) {
      console.log('❌ Job not found or permission denied');
      return NextResponse.json(
        { error: "Job not found or you don't have permission to update this job" },
        { status: 403 }
      );
    }

    // Prepare update data
    console.log('🔧 Preparing update data...');
    const updateData: any = {};
    
    if (body.title !== undefined) {
      updateData.title = body.title;
      console.log('  ✓ title:', body.title);
    }
    if (body.location !== undefined) {
      updateData.location = body.location;
      console.log('  ✓ location:', body.location);
    }
    if (body.country !== undefined) {
      updateData.country = body.country;
      console.log('  ✓ country:', body.country);
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
      console.log('  ✓ description length:', body.description?.length);
    }
    if (body.requirements !== undefined) {
      updateData.requirements = Array.isArray(body.requirements) 
        ? JSON.stringify(body.requirements) 
        : JSON.stringify([body.requirements]);
      console.log('  ✓ requirements:', typeof body.requirements);
    }
    if (body.benefits !== undefined) {
      updateData.benefits = Array.isArray(body.benefits) 
        ? JSON.stringify(body.benefits) 
        : JSON.stringify([body.benefits]);
      console.log('  ✓ benefits:', typeof body.benefits);
    }
    if (body.salary !== undefined) {
      updateData.salary = body.salary;
      console.log('  ✓ salary:', body.salary);
    }
    if (body.jobType !== undefined) {
      updateData.jobType = body.jobType;
      console.log('  ✓ jobType:', body.jobType);
    }
    if (body.experienceLevel !== undefined) {
      updateData.experienceLevel = body.experienceLevel;
      console.log('  ✓ experienceLevel:', body.experienceLevel);
    }
    if (body.sector !== undefined) {
      updateData.sector = body.sector;
      console.log('  ✓ sector:', body.sector);
    }
    if (body.skills !== undefined) {
      updateData.skills = Array.isArray(body.skills) 
        ? JSON.stringify(body.skills) 
        : body.skills;
      console.log('  ✓ skills:', Array.isArray(body.skills) ? body.skills.length + ' items' : typeof body.skills);
    }
    if (body.isRemote !== undefined) {
      updateData.isRemote = body.isRemote;
      console.log('  ✓ isRemote:', body.isRemote);
    }
    if (body.isHybrid !== undefined) {
      updateData.isHybrid = body.isHybrid;
      console.log('  ✓ isHybrid:', body.isHybrid);
    }
    if (body.isUrgent !== undefined) {
      updateData.isUrgent = body.isUrgent;
      console.log('  ✓ isUrgent:', body.isUrgent);
    }
    if (body.isFeatured !== undefined) {
      updateData.isFeatured = body.isFeatured;
      console.log('  ✓ isFeatured:', body.isFeatured);
    }
    if (body.applicationDeadline !== undefined) {
      updateData.applicationDeadline = body.applicationDeadline 
        ? new Date(body.applicationDeadline) 
        : null;
      console.log('  ✓ applicationDeadline:', body.applicationDeadline);
    }
    
    console.log('📊 Total fields to update:', Object.keys(updateData).length);

    // Update the job
    console.log('💾 Updating job with data:', JSON.stringify(updateData, null, 2));
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData
    });
    console.log('✅ Job updated successfully:', updatedJob.id);

    return NextResponse.json({
      success: true,
      data: updatedJob,
      message: "Job updated successfully"
    });

  } catch (error: any) {
    console.error("❌ Error updating job:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    });
    return NextResponse.json(
      { 
        error: "Failed to update job",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
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