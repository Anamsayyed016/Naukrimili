import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user: _user } = auth;
    const { id: applicationId } = await params;

    const application = await prisma.application.findUnique({
      where: {
        id: applicationId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            location: true,
            profilePicture: true,
            bio: true,
            skills: true,
            experience: true,
            education: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            description: true,
            salary: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            jobType: true,
            experienceLevel: true
          }
        },
        resume: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            mimeType: true,
            atsScore: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            location: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    console.log('🔍 Application data for admin:', {
      applicationId: application.id,
      userId: application.user.id,
      jobId: application.job.id,
      jobTitle: application.job.title,
      resume: application.resume ? {
        id: application.resume.id,
        fileName: application.resume.fileName,
        fileUrl: application.resume.fileUrl
      } : 'No resume found'
    });

    return NextResponse.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user: _user } = auth;
    const { id: applicationId } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const existingApplication = await prisma.application.findUnique({
      where: {
        id: applicationId
      }
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: status || existingApplication.status,
        notes: notes || existingApplication.notes,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true
          }
        },
        resume: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message: "Application updated successfully"
    });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

