import { NextRequest, NextResponse } from "next/server";
import { requireEmployerAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
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
  } catch (_error) {
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

        // Send real-time notification via Socket.io (optional)
        try {
          const { getSocketService } = await import('@/lib/socket-server');
          const socketService = getSocketService();
          console.log('🔍 Socket service status:', socketService ? 'Available' : 'Not available');
          
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
          } else {
            console.log('📡 Socket service not available, notification saved to database only');
          }
        } catch (socketError) {
          console.warn('⚠️ Socket service error (notification saved to database):', socketError.message);
          // Continue without socket notification - database notification is sufficient
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
  } catch (_error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify the application belongs to the employer's company
    const existingApplication = await prisma.application.findFirst({
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

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Delete the application
    await prisma.application.delete({
      where: { id: applicationId }
    });

    // Send notification to job seeker about application deletion
    try {
      await createNotification({
        userId: existingApplication.user.id,
        type: 'APPLICATION_UPDATE',
        title: 'Application Withdrawn',
        message: `Your application for ${existingApplication.job.title} at ${existingApplication.job.company} has been withdrawn by the employer.`,
        data: {
          applicationId: existingApplication.id,
          jobTitle: existingApplication.job.title,
          company: existingApplication.job.company,
          actionType: 'deleted'
        }
      });

      // Send real-time notification via Socket.io (optional)
      try {
        const { getSocketService } = await import('@/lib/socket-server');
        const socketService = getSocketService();
        
        if (socketService) {
          await socketService.sendNotificationToUser(existingApplication.user.id, {
            type: 'APPLICATION_UPDATE',
            title: 'Application Withdrawn',
            message: `Your application for ${existingApplication.job.title} at ${existingApplication.job.company} has been withdrawn by the employer.`,
            data: {
              applicationId: existingApplication.id,
              jobTitle: existingApplication.job.title,
              company: existingApplication.job.company,
              actionType: 'deleted'
            }
          });
          console.log(`📡 Real-time notification sent for application deletion: ${applicationId}`);
        }
      } catch (socketError) {
        console.warn('⚠️ Socket service error (notification saved to database):', socketError.message);
      }

      console.log(`📤 Notification sent for application deletion: ${applicationId}`);
    } catch (notificationError) {
      console.warn('⚠️ Failed to send notification:', notificationError);
      // Don't fail the deletion if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully"
    });
  } catch (_error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
