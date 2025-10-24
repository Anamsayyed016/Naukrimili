/**
 * Application/Candidate Favorites API
 * For employers to favorite/save candidate applications
 */

import { NextRequest, NextResponse } from "next/server";
import { requireEmployerAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";
// import { getSocketService } from "@/lib/socket-server";

// GET - Get all favorited applications for the employer
export async function GET(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get favorited applications for this employer's company
    const favorites = await prisma.application.findMany({
      where: {
        isFavorite: true,
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
            profilePicture: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true
          }
        },
        resume: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: { updatedAt: 'desc' }
    });

    const total = await prisma.application.count({
      where: {
        isFavorite: true,
        job: { companyId: user.company.id }
      }
    });

    return NextResponse.json({
      success: true,
      data: favorites,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_results: total,
        per_page: limit,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching favorite applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorite applications" },
      { status: 500 }
    );
  }
}

// POST - Add application to favorites
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const body = await request.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Verify the application belongs to the employer's company
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { companyId: user.company.id }
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        job: {
          select: { id: true, title: true, company: true }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Update application to favorite
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { 
        isFavorite: true,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Application ${applicationId} added to favorites by employer ${user.id}`);

    // Send notification to job seeker about being favorited
    try {
      await createNotification({
        userId: application.user.id,
        type: 'APPLICATION_UPDATE',
        title: '⭐ Your profile has been saved!',
        message: `Great news! Your application for ${application.job.title} at ${application.job.company} has been saved by the employer. This means they're interested in your profile!`,
        data: {
          applicationId: application.id,
          jobTitle: application.job.title,
          company: application.job.company,
          actionType: 'favorited'
        }
      });

      // Send real-time notification via Socket.io (optional)
      // try {
      //   const socketService = getSocketService();
      //   if (socketService) {
      //     await socketService.sendNotificationToUser(application.user.id, {
      //       type: 'APPLICATION_UPDATE',
      //       title: '⭐ Your profile has been saved!',
      //       message: `Great news! Your application for ${application.job.title} at ${application.job.company} has been saved by the employer. This means they're interested in your profile!`,
      //       data: {
      //         applicationId: application.id,
      //         jobTitle: application.job.title,
      //         company: application.job.company,
      //         actionType: 'favorited'
      //     }
      //   });
      // }
      // } catch (socketError) {
      //   console.warn('⚠️ Socket service not available:', socketError);
      //   // Continue without socket notification
      // }

      console.log(`📤 Notification sent to job seeker about being favorited: ${application.user.id}`);
    } catch (notificationError) {
      console.warn('⚠️ Failed to send favorite notification:', notificationError);
      // Don't fail the operation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Application added to favorites",
      data: updatedApplication
    });

  } catch (error) {
    console.error("Error adding application to favorites:", error);
    return NextResponse.json(
      { error: "Failed to add application to favorites" },
      { status: 500 }
    );
  }
}

// DELETE - Remove application from favorites
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Verify the application belongs to the employer's company
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { companyId: user.company.id }
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Update application to remove from favorites
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { 
        isFavorite: false,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Application ${applicationId} removed from favorites by employer ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Application removed from favorites",
      data: updatedApplication
    });

  } catch (error) {
    console.error("Error removing application from favorites:", error);
    return NextResponse.json(
      { error: "Failed to remove application from favorites" },
      { status: 500 }
    );
  }
}
