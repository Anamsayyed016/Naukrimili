/**
 * Comprehensive Notification Service
 * Extends existing notification system with role-specific notifications
 * Maintains backward compatibility with existing code
 */

import { getSocketService } from './socket-server';
import { createNotification } from './notification-service';
import { prisma } from './prisma';
import { NotificationType } from './socket-server';

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'job' | 'application' | 'company' | 'system' | 'communication' | 'analytics';
}

export interface RoleBasedNotification {
  jobseeker?: NotificationTemplate;
  employer?: NotificationTemplate;
  admin?: NotificationTemplate;
}

class ComprehensiveNotificationService {
  private socketService = getSocketService();

  /**
   * Send notification to specific role with appropriate template
   */
  async sendRoleBasedNotification(
    role: 'jobseeker' | 'employer' | 'admin',
    userId: string,
    template: NotificationTemplate
  ) {
    try {
      console.log(`📤 Sending ${role} notification to user ${userId}:`, template.title);

      const notification = await createNotification({
        userId,
        type: template.type,
        title: template.title,
        message: template.message,
        data: template.data
      });

      // Send real-time notification
      if (this.socketService) {
        await this.socketService.sendNotificationToUser(userId, {
          type: template.type,
          title: template.title,
          message: template.message,
          data: template.data
        });
      }

      return notification;
    } catch (error) {
      console.error(`❌ Failed to send ${role} notification:`, error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users by role
   */
  async sendNotificationToRole(
    role: 'jobseeker' | 'employer' | 'admin',
    template: NotificationTemplate,
    userIds?: string[]
  ) {
    try {
      let targetUserIds = userIds;

      if (!targetUserIds) {
        // Get all users with the specified role
        const users = await prisma.user.findMany({
          where: { role },
          select: { id: true }
        });
        targetUserIds = users.map(user => user.id);
      }

      if (targetUserIds.length === 0) {
        console.log(`⚠️ No users found for role: ${role}`);
        return [];
      }

      const promises = targetUserIds.map(userId => 
        this.sendRoleBasedNotification(role, userId, template)
      );

      return Promise.allSettled(promises);
    } catch (error) {
      console.error(`❌ Failed to send notification to role ${role}:`, error);
      throw error;
    }
  }

  /**
   * JOBSEEKER NOTIFICATIONS
   */
  async notifyJobseekerApplicationSubmitted(userId: string, jobTitle: string, companyName: string) {
    return this.sendRoleBasedNotification('jobseeker', userId, {
      type: 'APPLICATION_UPDATE',
      title: 'Application Submitted Successfully! 🎉',
      message: `Your application for "${jobTitle}" at ${companyName} has been submitted successfully.`,
      data: { jobTitle, companyName, actionUrl: '/dashboard/jobseeker/applications' },
      priority: 'medium',
      category: 'application'
    });
  }

  async notifyJobseekerApplicationStatusChange(
    userId: string, 
    jobTitle: string, 
    companyName: string, 
    status: string
  ) {
    const statusMessages = {
      'reviewed': 'Your application is being reviewed',
      'shortlisted': 'Congratulations! You have been shortlisted',
      'rejected': 'Unfortunately, your application was not selected',
      'accepted': 'Congratulations! Your application has been accepted'
    };

    return this.sendRoleBasedNotification('jobseeker', userId, {
      type: 'APPLICATION_UPDATE',
      title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `${statusMessages[status as keyof typeof statusMessages]} for "${jobTitle}" at ${companyName}.`,
      data: { jobTitle, companyName, status, actionUrl: '/dashboard/jobseeker/applications' },
      priority: 'high',
      category: 'application'
    });
  }

  async notifyJobseekerInterviewScheduled(
    userId: string, 
    jobTitle: string, 
    companyName: string, 
    interviewDate: string
  ) {
    return this.sendRoleBasedNotification('jobseeker', userId, {
      type: 'INTERVIEW_SCHEDULED',
      title: 'Interview Scheduled! 📅',
      message: `Your interview for "${jobTitle}" at ${companyName} is scheduled for ${interviewDate}.`,
      data: { jobTitle, companyName, interviewDate, actionUrl: '/dashboard/jobseeker/applications' },
      priority: 'high',
      category: 'application'
    });
  }

  async notifyJobseekerJobMatch(userId: string, jobTitle: string, companyName: string, matchScore: number) {
    return this.sendRoleBasedNotification('jobseeker', userId, {
      type: 'JOB_RECOMMENDATION',
      title: 'New Job Match! 🎯',
      message: `We found a ${matchScore}% match: "${jobTitle}" at ${companyName}`,
      data: { jobTitle, companyName, matchScore, actionUrl: '/jobs' },
      priority: 'medium',
      category: 'job'
    });
  }

  async notifyJobseekerProfileIncomplete(userId: string, missingFields: string[]) {
    return this.sendRoleBasedNotification('jobseeker', userId, {
      type: 'PROFILE_INCOMPLETE',
      title: 'Complete Your Profile',
      message: `Complete your profile by adding: ${missingFields.join(', ')} to get better job matches.`,
      data: { missingFields, actionUrl: '/dashboard/jobseeker/profile' },
      priority: 'low',
      category: 'job'
    });
  }

  /**
   * EMPLOYER NOTIFICATIONS
   */
  async notifyEmployerNewApplication(
    userId: string, 
    applicantName: string, 
    jobTitle: string, 
    applicationId: string
  ) {
    return this.sendRoleBasedNotification('employer', userId, {
      type: 'APPLICATION_RECEIVED',
      title: 'New Job Application! 📥',
      message: `${applicantName} applied for "${jobTitle}". Review their application now.`,
      data: { applicantName, jobTitle, applicationId, actionUrl: `/employer/applications/${applicationId}` },
      priority: 'high',
      category: 'application'
    });
  }

  async notifyEmployerJobExpiring(userId: string, jobTitle: string, daysLeft: number) {
    return this.sendRoleBasedNotification('employer', userId, {
      type: 'JOB_EXPIRED',
      title: 'Job Posting Expiring Soon',
      message: `Your job posting "${jobTitle}" expires in ${daysLeft} days. Consider extending it.`,
      data: { jobTitle, daysLeft, actionUrl: '/employer/jobs' },
      priority: 'medium',
      category: 'job'
    });
  }

  async notifyEmployerJobPerformance(
    userId: string, 
    jobTitle: string, 
    views: number, 
    applications: number
  ) {
    return this.sendRoleBasedNotification('employer', userId, {
      type: 'DASHBOARD_UPDATE',
      title: 'Job Performance Update',
      message: `"${jobTitle}" has ${views} views and ${applications} applications this week.`,
      data: { jobTitle, views, applications, actionUrl: '/employer/analytics' },
      priority: 'low',
      category: 'analytics'
    });
  }

  async notifyEmployerCompanyVerification(userId: string, status: 'approved' | 'rejected') {
    const statusMessages = {
      'approved': 'Your company has been verified and approved!',
      'rejected': 'Your company verification was rejected. Please review and resubmit.'
    };

    return this.sendRoleBasedNotification('employer', userId, {
      type: 'COMPANY_VERIFIED',
      title: `Company ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: statusMessages[status],
      data: { status, actionUrl: '/employer/company/profile' },
      priority: 'high',
      category: 'company'
    });
  }

  /**
   * ADMIN NOTIFICATIONS
   */
  async notifyAdminNewCompanyRegistration(adminId: string, companyName: string, companyId: string) {
    return this.sendRoleBasedNotification('admin', adminId, {
      type: 'ADMIN_ACTION',
      title: 'New Company Registration',
      message: `"${companyName}" has registered and needs verification.`,
      data: { companyName, companyId, actionUrl: `/admin/companies/${companyId}` },
      priority: 'medium',
      category: 'company'
    });
  }

  async notifyAdminSystemAlert(adminId: string, alertType: string, message: string) {
    return this.sendRoleBasedNotification('admin', adminId, {
      type: 'SYSTEM_ANNOUNCEMENT',
      title: `System Alert: ${alertType}`,
      message,
      data: { alertType, actionUrl: '/admin/dashboard' },
      priority: 'urgent',
      category: 'system'
    });
  }

  async notifyAdminUserActivity(adminId: string, activity: string, count: number) {
    return this.sendRoleBasedNotification('admin', adminId, {
      type: 'ANALYTICS_READY',
      title: 'User Activity Report',
      message: `${activity}: ${count} users in the last 24 hours.`,
      data: { activity, count, actionUrl: '/admin/analytics' },
      priority: 'low',
      category: 'analytics'
    });
  }

  /**
   * BROADCAST NOTIFICATIONS
   */
  async broadcastJobAlert(jobTitle: string, location: string, jobType: string) {
    const template: NotificationTemplate = {
      type: 'JOB_ALERT_MATCH',
      title: 'New Job Alert Match! 🔔',
      message: `New ${jobType} position: "${jobTitle}" in ${location}`,
      data: { jobTitle, location, jobType, actionUrl: '/jobs' },
      priority: 'medium',
      category: 'job'
    };

    return this.sendNotificationToRole('jobseeker', template);
  }

  async broadcastSystemMaintenance(message: string, scheduledTime: string) {
    const template: NotificationTemplate = {
      type: 'SYSTEM_MAINTENANCE',
      title: 'Scheduled Maintenance',
      message: `System maintenance scheduled for ${scheduledTime}. ${message}`,
      data: { scheduledTime, actionUrl: '/' },
      priority: 'high',
      category: 'system'
    };

    // Send to all roles
    const promises = await Promise.allSettled([
      this.sendNotificationToRole('jobseeker', template),
      this.sendNotificationToRole('employer', template),
      this.sendNotificationToRole('admin', template)
    ]);

    return promises;
  }

  /**
   * UTILITY METHODS
   */
  async getNotificationStats(userId: string) {
    try {
      const stats = await prisma.notification.groupBy({
        by: ['type', 'isRead'],
        where: { userId },
        _count: { id: true }
      });

      return stats.reduce((acc, stat) => {
        if (!acc[stat.type]) acc[stat.type] = { read: 0, unread: 0 };
        if (stat.isRead) {
          acc[stat.type].read = stat._count.id;
        } else {
          acc[stat.type].unread = stat._count.id;
        }
        return acc;
      }, {} as Record<string, { read: number; unread: number }>);
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {};
    }
  }

  async markNotificationsAsReadByType(userId: string, type: NotificationType) {
    try {
      await prisma.notification.updateMany({
        where: { userId, type, isRead: false },
        data: { isRead: true }
      });

      // Update real-time count
      if (this.socketService) {
        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false }
        });

        this.socketService.io?.to(`user:${userId}`).emit('notification_count', {
          count: unreadCount,
          userId
        });
      }

      return true;
    } catch (error) {
      console.error('Error marking notifications as read by type:', error);
      return false;
    }
  }
}

// Export singleton instance
export const comprehensiveNotificationService = new ComprehensiveNotificationService();

// Export individual methods for easy use
export const {
  notifyJobseekerApplicationSubmitted,
  notifyJobseekerApplicationStatusChange,
  notifyJobseekerInterviewScheduled,
  notifyJobseekerJobMatch,
  notifyJobseekerProfileIncomplete,
  notifyEmployerNewApplication,
  notifyEmployerJobExpiring,
  notifyEmployerJobPerformance,
  notifyEmployerCompanyVerification,
  notifyAdminNewCompanyRegistration,
  notifyAdminSystemAlert,
  notifyAdminUserActivity,
  broadcastJobAlert,
  broadcastSystemMaintenance,
  getNotificationStats,
  markNotificationsAsReadByType
} = comprehensiveNotificationService;
