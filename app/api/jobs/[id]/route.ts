import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSEOJobUrl } from "@/lib/seo-url-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Fetching job details for ID:', params.id);
    
    // Parse the job ID from SEO URL or direct ID
    const jobId = parseSEOJobUrl(params.id);
    
    if (!jobId) {
      console.log('❌ Invalid job ID format:', params.id);
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    console.log('🔍 Parsed job ID:', jobId);

    // Try to find job by ID (handle both numeric and string IDs)
    let job;
    
    // First try as numeric ID
    if (!isNaN(Number(jobId))) {
      job = await prisma.job.findUnique({
        where: { id: Number(jobId) },
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
        }
      });
    } else {
      // Try as string ID (for external jobs)
      job = await prisma.job.findFirst({
        where: { 
          OR: [
            { id: jobId as any },
            { externalId: jobId },
            { source: jobId }
          ]
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
        }
      });
    }

    if (!job) {
      console.log('❌ Job not found:', jobId);
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    console.log('✅ Job found:', job.id);

    return NextResponse.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error("Error fetching job details:", error);
    return NextResponse.json(
      { error: "Failed to fetch job details" },
      { status: 500 }
    );
  }
}

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

    console.log(`🗑️ Deleting job ${jobId}...`);

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