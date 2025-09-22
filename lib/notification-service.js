/**
 * Notification Service for User Notifications
 * Handles creation and management of user notifications
 */

import { prisma } from './prisma.js';

// Global socket service instance (will be set by server.js)
let globalSocketService = null;

/**
 * Set the global socket service instance
 */
export function setSocketService(socketService) {
  globalSocketService = socketService;
}

/**
 * Send real-time notification via socket
 */
async function sendRealTimeNotification(notification) {
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
 * Create a new notification for a user
 */
export async function createNotification(data) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || null,
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
    
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
}

/**
 * Create a welcome notification for new users
 */
export async function createWelcomeNotification(userId, userName, provider) {
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
  userId, 
  options = {}
) {
  try {
    const { limit = 20, offset = 0, unreadOnly = false, type } = options;

    const where = { userId };
    
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

    return { notifications, total };
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId, userId) {
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
export async function markAllNotificationsAsRead(userId) {
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
export async function deleteOldNotifications(daysOld = 30) {
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
