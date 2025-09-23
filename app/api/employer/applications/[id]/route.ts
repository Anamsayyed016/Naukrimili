import { NextRequest, NextResponse } from "next/server";
import { requireEmployerAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getSocketService } from "@/lib/socket-server";
import { createNotification } from "@/lib/notification-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { id: applicationId } = await params;

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { companyId: user.company.id }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
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
            jobType: true,
            experienceLevel: true
          }
        },
        resume: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            atsScore: true
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
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { id: applicationId } = await params;
    const body = await request.json();
    const { status, notes } = body;

    // Verify the application belongs to the employer's company
    const existingApplication = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { companyId: user.company.id }
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
            name: true,
            email: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true
          }
        }
      }
    });

    // Send notification to job seeker about status update
    if (status && status !== existingApplication.status) {
      try {
        // Create database notification
        await createNotification({
          userId: updatedApplication.user.id,
          type: 'APPLICATION_UPDATE',
          title: 'Application Status Updated',
          message: `Your application for ${updatedApplication.job.title} at ${updatedApplication.job.company} has been updated to ${status}`,
          data: {
            applicationId: updatedApplication.id,
            newStatus: status,
            jobTitle: updatedApplication.job.title,
            company: updatedApplication.job.company
          }
        });

        // Send real-time notification via Socket.io
        const socketService = getSocketService();
        if (socketService) {
          await socketService.sendNotificationToUser(updatedApplication.user.id, {
            type: 'APPLICATION_UPDATE',
            title: 'Application Status Updated',
            message: `Your application for ${updatedApplication.job.title} at ${updatedApplication.job.company} has been updated to ${status}`,
            data: {
              applicationId: updatedApplication.id,
              newStatus: status,
              jobTitle: updatedApplication.job.title,
              company: updatedApplication.job.company
            }
          });
        }

        console.log(`📤 Notification sent for application status update: ${applicationId} -> ${status}`);
      } catch (notificationError) {
        console.warn('⚠️ Failed to send notification:', notificationError);
        // Don't fail the update if notification fails
      }
    }

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
