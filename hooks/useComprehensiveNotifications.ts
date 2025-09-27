/**
 * Comprehensive Notifications Hook
 * Provides easy access to role-based notifications
 */

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface NotificationParams {
  jobTitle?: string;
  companyName?: string;
  applicantName?: string;
  applicationId?: string;
  status?: string;
  interviewDate?: string;
  matchScore?: number;
  missingFields?: string[];
  daysLeft?: number;
  views?: number;
  applications?: number;
  companyId?: string;
  alertType?: string;
  message?: string;
  activity?: string;
  count?: number;
  location?: string;
  jobType?: string;
  scheduledTime?: string;
  type?: string;
}

export function useComprehensiveNotifications() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendNotification = useCallback(async (action: string, params: NotificationParams = {}) => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/notifications/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...params
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      return data.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Notification error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Jobseeker notification methods
  const notifyApplicationSubmitted = useCallback((jobTitle: string, companyName: string) => {
    return sendNotification('jobseeker_application_submitted', { jobTitle, companyName });
  }, [sendNotification]);

  const notifyApplicationStatusChange = useCallback((
    jobTitle: string, 
    companyName: string, 
    status: string
  ) => {
    return sendNotification('jobseeker_application_status_change', { 
      jobTitle, 
      companyName, 
      status 
    });
  }, [sendNotification]);

  const notifyInterviewScheduled = useCallback((
    jobTitle: string, 
    companyName: string, 
    interviewDate: string
  ) => {
    return sendNotification('jobseeker_interview_scheduled', { 
      jobTitle, 
      companyName, 
      interviewDate 
    });
  }, [sendNotification]);

  const notifyJobMatch = useCallback((
    jobTitle: string, 
    companyName: string, 
    matchScore: number
  ) => {
    return sendNotification('jobseeker_job_match', { 
      jobTitle, 
      companyName, 
      matchScore 
    });
  }, [sendNotification]);

  const notifyProfileIncomplete = useCallback((missingFields: string[]) => {
    return sendNotification('jobseeker_profile_incomplete', { missingFields });
  }, [sendNotification]);

  // Employer notification methods
  const notifyNewApplication = useCallback((
    applicantName: string, 
    jobTitle: string, 
    applicationId: string
  ) => {
    return sendNotification('employer_new_application', { 
      applicantName, 
      jobTitle, 
      applicationId 
    });
  }, [sendNotification]);

  const notifyJobExpiring = useCallback((jobTitle: string, daysLeft: number) => {
    return sendNotification('employer_job_expiring', { jobTitle, daysLeft });
  }, [sendNotification]);

  const notifyJobPerformance = useCallback((
    jobTitle: string, 
    views: number, 
    applications: number
  ) => {
    return sendNotification('employer_job_performance', { 
      jobTitle, 
      views, 
      applications 
    });
  }, [sendNotification]);

  const notifyCompanyVerification = useCallback((status: 'approved' | 'rejected') => {
    return sendNotification('employer_company_verification', { status });
  }, [sendNotification]);

  // Admin notification methods
  const notifyNewCompany = useCallback((companyName: string, companyId: string) => {
    return sendNotification('admin_new_company', { companyName, companyId });
  }, [sendNotification]);

  const notifySystemAlert = useCallback((alertType: string, message: string) => {
    return sendNotification('admin_system_alert', { alertType, message });
  }, [sendNotification]);

  const notifyUserActivity = useCallback((activity: string, count: number) => {
    return sendNotification('admin_user_activity', { activity, count });
  }, [sendNotification]);

  // Broadcast methods
  const broadcastJobAlert = useCallback((
    jobTitle: string, 
    location: string, 
    jobType: string
  ) => {
    return sendNotification('broadcast_job_alert', { jobTitle, location, jobType });
  }, [sendNotification]);

  const broadcastMaintenance = useCallback((message: string, scheduledTime: string) => {
    return sendNotification('broadcast_maintenance', { message, scheduledTime });
  }, [sendNotification]);

  // Utility methods
  const getNotificationStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications/comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_stats' }),
      });

      const data = await response.json();
      return data.success ? data.data : {};
    } catch (err) {
      console.error('Error getting notification stats:', err);
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markNotificationsReadByType = useCallback(async (type: string) => {
    return sendNotification('mark_read_by_type', { type });
  }, [sendNotification]);

  return {
    // State
    isLoading,
    error,
    
    // Jobseeker methods
    notifyApplicationSubmitted,
    notifyApplicationStatusChange,
    notifyInterviewScheduled,
    notifyJobMatch,
    notifyProfileIncomplete,
    
    // Employer methods
    notifyNewApplication,
    notifyJobExpiring,
    notifyJobPerformance,
    notifyCompanyVerification,
    
    // Admin methods
    notifyNewCompany,
    notifySystemAlert,
    notifyUserActivity,
    
    // Broadcast methods
    broadcastJobAlert,
    broadcastMaintenance,
    
    // Utility methods
    getNotificationStats,
    markNotificationsReadByType,
    
    // Generic method
    sendNotification
  };
}
