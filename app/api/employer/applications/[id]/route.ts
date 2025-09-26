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

    console.log('🔍 Application data for employer:', {
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
        }
      }
    });

    // Send notification to job seeker about status update
    if (status && status !== existingApplication.status) {
      try {
        // Create specific notification messages for different actions
        let notificationTitle = 'Application Status Updated';
        let notificationMessage = `Your application for ${updatedApplication.job.title} at ${updatedApplication.job.company} has been updated to ${status}`;
        
        switch (status) {
          case 'shortlisted':
            notificationTitle = '🎉 Congratulations! You\'ve been shortlisted!';
            notificationMessage = `Great news! Your application for ${updatedApplication.job.title} at ${updatedApplication.job.company} has been shortlisted. The employer is interested in your profile!`;
            break;
          case 'interview':
            notificationTitle = '📅 Interview Scheduled!';
            notificationMessage = `Excellent! Your application for ${updatedApplication.job.title} at ${updatedApplication.job.company} has been selected for an interview. Check your email for interview details.`;
            break;
          case 'hired':
            notificationTitle = '🎊 Congratulations! You got the job!';
            notificationMessage = `Amazing news! You have been selected for the ${updatedApplication.job.title} position at ${updatedApplication.job.company}. Welcome to the team!`;
            break;
          case 'rejected':
            notificationTitle = 'Application Update';
            notificationMessage = `Thank you for your interest. Unfortunately, your application for ${updatedApplication.job.title} at ${updatedApplication.job.company} was not selected this time. Don't give up - keep applying!`;
            break;
          case 'reviewed':
            notificationTitle = 'Application Reviewed';
            notificationMessage = `Your application for ${updatedApplication.job.title} at ${updatedApplication.job.company} has been reviewed by the hiring team.`;
            break;
        }

        // Create database notification
        await createNotification({
          userId: updatedApplication.user.id,
          type: 'APPLICATION_UPDATE',
          title: notificationTitle,
          message: notificationMessage,
          data: {
            applicationId: updatedApplication.id,
            newStatus: status,
            jobTitle: updatedApplication.job.title,
            company: updatedApplication.job.company,
            actionType: status
          }
        });

        // Send real-time notification via Socket.io
        try {
          const socketService = getSocketService();
          if (socketService) {
            await socketService.sendNotificationToUser(updatedApplication.user.id, {
              type: 'APPLICATION_UPDATE',
              title: notificationTitle,
              message: notificationMessage,
              data: {
                applicationId: updatedApplication.id,
                newStatus: status,
                jobTitle: updatedApplication.job.title,
                company: updatedApplication.job.company,
                actionType: status
              }
            });
            console.log(`📡 Real-time notification sent to jobseeker: ${updatedApplication.user.id}`);
          }
        } catch (socketError) {
          console.warn('⚠️ Socket service not available:', socketError);
          // Continue without socket notification
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
