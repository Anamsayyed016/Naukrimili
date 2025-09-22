/**
 * Notification Service for User Notifications
 * Handles creation and management of user notifications
 * Now supports both real-time Socket.io notifications AND email notifications
 */

import { prisma } from '@/lib/prisma';
import { mailerService } from '@/lib/mailer';

// Global socket service instance (will be set by server.js)
let globalSocketService: any = null;

/**
 * Set the global socket service instance
 */
export function setSocketService(socketService: any) {
  globalSocketService = socketService;
}

/**
 * Send real-time notification via socket
 */
async function sendRealTimeNotification(notification: any): Promise<void> {
  if (!globalSocketService) {
    console.warn('⚠️ Socket service not available, notification will be sent when user connects');
    return;
  }

  try {
    const notificationData = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.createdAt.toISOString(),
      isRead: notification.isRead
    };

    await globalSocketService.sendNotificationToUser(notification.userId, notificationData);
    console.log(`📤 Real-time notification sent to user ${notification.userId}: ${notification.title}`);
  } catch (error) {
    console.error('❌ Error sending real-time notification:', error);
    throw error;
  }
}

/**
 * Send email notification based on notification type
 */
async function sendEmailNotification(notification: any): Promise<void> {
  if (!mailerService.isReady()) {
    console.warn('⚠️ Email service not ready, email notification skipped');
    return;
  }

  try {
    // Get user details for email
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true, name: true }
    });

    if (!user?.email) {
      console.warn(`⚠️ User ${notification.userId} has no email address, email notification skipped`);
      return;
    }

    let emailSent = false;

    // Send different email types based on notification type
    switch (notification.type) {
      case 'WELCOME':
        emailSent = await mailerService.sendWelcomeEmail(
          user.email,
          user.name || 'User',
          notification.data?.provider || 'account'
        );
        break;

      case 'JOB_APPLICATION_RECEIVED':
        // This is for employers receiving applications
        if (notification.data?.jobTitle && notification.data?.applicantName) {
          emailSent = await mailerService.sendApplicationNotificationEmail(
            user.email,
            user.name || 'Employer',
            notification.data.jobTitle,
            notification.data.applicantName
          );
        }
        break;

      case 'APPLICATION_UPDATE':
        // This is for job seekers getting status updates
        if (notification.data?.jobTitle && notification.data?.status && notification.data?.companyName) {
          emailSent = await mailerService.sendApplicationStatusEmail(
            user.email,
            user.name || 'Applicant',
            notification.data.jobTitle,
            notification.data.status,
            notification.data.companyName
          );
        }
        break;

      case 'INTERVIEW_SCHEDULED':
        // Send custom email for interview scheduling
        emailSent = await mailerService.sendEmail({
          to: user.email,
          subject: `Interview Scheduled: ${notification.data?.jobTitle || 'Job Position'}`,
          text: notification.message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>📅 Interview Scheduled</h2>
              <p>${notification.message}</p>
              <p><strong>Job:</strong> ${notification.data?.jobTitle || 'N/A'}</p>
              <p><strong>Company:</strong> ${notification.data?.companyName || 'N/A'}</p>
              <p><strong>Date:</strong> ${notification.data?.interviewDate || 'N/A'}</p>
              <p><strong>Time:</strong> ${notification.data?.interviewTime || 'N/A'}</p>
            </div>
          `
        });
        break;

      default:
        // Send generic notification email for other types
        emailSent = await mailerService.sendEmail({
          to: user.email,
          subject: notification.title,
          text: notification.message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${notification.title}</h2>
              <p>${notification.message}</p>
              <p><a href="${process.env.NEXTAUTH_URL}/dashboard">View Dashboard</a></p>
            </div>
          `
        });
        break;
    }

    if (emailSent) {
      console.log(`📧 Email notification sent to ${user.email}: ${notification.title}`);
    } else {
      console.warn(`⚠️ Failed to send email notification to ${user.email}`);
    }

  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    // Don't throw error to avoid breaking the notification creation
  }
}

export interface CreateNotificationData {
  userId: string;
  type: 'WELCOME' | 'JOB_MATCH' | 'APPLICATION_UPDATE' | 'SYSTEM' | 'INTERVIEW_SCHEDULED' | 'JOB_APPLICATION_RECEIVED' | 'JOB_POSTED' | 'ADMIN_ACTION' | 'MESSAGE_RECEIVED' | 'RESUME_VIEWED' | 'RESUME_UPLOADED';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new notification for a user
 * Sends both real-time Socket.io notification AND email notification
 */
export async function createNotification(data: CreateNotificationData): Promise<NotificationData> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data as any || null,
        isRead: false
      }
    });

    console.log(`✅ Notification created: ${data.type} for user ${data.userId}`);
    
    // Send real-time notification via socket
    try {
      await sendRealTimeNotification(notification);
    } catch (socketError) {
      console.warn('⚠️ Failed to send real-time notification:', socketError);
      // Don't fail the notification creation if socket fails
    }

    // Send email notification (non-blocking)
    try {
      await sendEmailNotification(notification);
    } catch (emailError) {
      console.warn('⚠️ Failed to send email notification:', emailError);
      // Don't fail the notification creation if email fails
    }
    
    return notification as NotificationData;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
}

/**
 * Create a welcome notification for new users
 */
export async function createWelcomeNotification(userId: string, userName: string, provider: string): Promise<void> {
  try {
    const notification = await createNotification({
      userId,
      type: 'WELCOME',
      title: `Welcome to Naukrimili! 🎉`,
      message: `Hi ${userName}! Welcome to Naukrimili. You've successfully signed up using your ${provider} account. Start exploring amazing job opportunities and take your career to the next level!`,
      data: {
        provider,
        isNewUser: true,
        welcomeDate: new Date().toISOString()
      }
    });

    // Real-time notifications are handled by the socket server in server.js
    // The notification is already created in the database and will be sent via socket when the user connects
    console.log(`✅ Welcome notification created for user ${userId} - will be sent via socket when user connects`);

    console.log(`✅ Welcome notification created for user ${userId} (${provider})`);
  } catch (error) {
    console.error('❌ Error creating welcome notification:', error);
    // Don't throw error to avoid breaking the OAuth flow
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string, 
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string;
  } = {}
): Promise<{ notifications: NotificationData[]; total: number }> {
  try {
    const { limit = 20, offset = 0, unreadOnly = false, type } = options;

    const where: any = { userId };
    
    if (unreadOnly) {
      where.isRead = false;
    }
    
    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.notification.count({ where })
    ]);

    return { notifications: notifications as NotificationData[], total };
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId // Ensure user can only update their own notifications
      },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Notification ${notificationId} marked as read for user ${userId}`);
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    });

    console.log(`✅ All notifications marked as read for user ${userId}`);
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}

/**
 * Delete old notifications (cleanup utility)
 */
export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        isRead: true // Only delete read notifications
      }
    });

    console.log(`✅ Deleted ${result.count} old notifications (older than ${daysOld} days)`);
    return result.count;
  } catch (error) {
    console.error('❌ Error deleting old notifications:', error);
    throw new Error('Failed to delete old notifications');
  }
}
