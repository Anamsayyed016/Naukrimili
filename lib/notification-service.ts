/**
 * Notification Service for User Notifications
 * Handles creation and management of user notifications
 */

import { prisma } from '@/lib/prisma';

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
