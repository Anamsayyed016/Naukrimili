import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(params.id);
    
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