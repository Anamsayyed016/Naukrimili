import { prisma } from '@/lib/prisma';

export interface NotificationOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  type?: string;
}

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export async function getUserNotifications(userId: string, options: NotificationOptions = {}) {
  const {
    limit = 20,
    offset = 0,
    unreadOnly = false,
    type
  } = options;

  try {
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

    return {
      notifications,
      total
    };
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return {
      notifications: [],
      total: 0
    };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false 
      },
      data: { isRead: true }
    });
    return true;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
}

export async function createNotification(data: CreateNotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? JSON.stringify(data.data) : null,
        isRead: false
      }
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}