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

    // Parse skills string to array if it's stored as JSON string
    let parsedSkills: string[] = [];
    if (application.user.skills) {
      try {
        // Try parsing as JSON string first
        if (typeof application.user.skills === 'string') {
          const parsed = JSON.parse(application.user.skills);
          parsedSkills = Array.isArray(parsed) ? parsed : [];
        } else if (Array.isArray(application.user.skills)) {
          parsedSkills = application.user.skills;
        }
      } catch {
        // If parsing fails, treat as empty array or comma-separated string
        if (application.user.skills.includes(',')) {
          parsedSkills = application.user.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        } else if (application.user.skills.trim().length > 0) {
          parsedSkills = [application.user.skills.trim()];
        }
      }
    }

    // Normalize application data with parsed skills
    const normalizedApplication = {
      ...application,
      user: {
        ...application.user,
        skills: parsedSkills
      }
    };

    console.log('🔍 Application data for admin:', {
      applicationId: normalizedApplication.id,
      userId: normalizedApplication.user.id,
      jobId: normalizedApplication.job.id,
      jobTitle: normalizedApplication.job.title,
      skillsType: typeof application.user.skills,
      skillsParsed: parsedSkills.length,
      resume: normalizedApplication.resume ? {
        id: normalizedApplication.resume.id,
        fileName: normalizedApplication.resume.fileName,
        fileUrl: normalizedApplication.resume.fileUrl
      } : 'No resume found'
    });

    return NextResponse.json({
      success: true,
      data: normalizedApplication
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

