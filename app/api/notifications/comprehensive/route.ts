/**
 * Comprehensive Notifications API
 * Handles role-based notifications for jobseeker, employer, and admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { comprehensiveNotificationService } from '@/lib/comprehensive-notification-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'jobseeker_application_submitted':
        const { jobTitle, companyName } = params;
        await comprehensiveNotificationService.notifyJobseekerApplicationSubmitted(
          session.user.id, jobTitle, companyName
        );
        break;

      case 'jobseeker_application_status_change':
        const { status } = params;
        await comprehensiveNotificationService.notifyJobseekerApplicationStatusChange(
          session.user.id, params.jobTitle, params.companyName, status
        );
        break;

      case 'jobseeker_interview_scheduled':
        await comprehensiveNotificationService.notifyJobseekerInterviewScheduled(
          session.user.id, params.jobTitle, params.companyName, params.interviewDate
        );
        break;

      case 'jobseeker_job_match':
        await comprehensiveNotificationService.notifyJobseekerJobMatch(
          session.user.id, params.jobTitle, params.companyName, params.matchScore
        );
        break;

      case 'jobseeker_profile_incomplete':
        await comprehensiveNotificationService.notifyJobseekerProfileIncomplete(
          session.user.id, params.missingFields
        );
        break;

      case 'employer_new_application':
        await comprehensiveNotificationService.notifyEmployerNewApplication(
          session.user.id, params.applicantName, params.jobTitle, params.applicationId
        );
        break;

      case 'employer_job_expiring':
        await comprehensiveNotificationService.notifyEmployerJobExpiring(
          session.user.id, params.jobTitle, params.daysLeft
        );
        break;

      case 'employer_job_performance':
        await comprehensiveNotificationService.notifyEmployerJobPerformance(
          session.user.id, params.jobTitle, params.views, params.applications
        );
        break;

      case 'employer_company_verification':
        await comprehensiveNotificationService.notifyEmployerCompanyVerification(
          session.user.id, params.status
        );
        break;

      case 'admin_new_company':
        await comprehensiveNotificationService.notifyAdminNewCompanyRegistration(
          session.user.id, params.companyName, params.companyId
        );
        break;

      case 'admin_system_alert':
        await comprehensiveNotificationService.notifyAdminSystemAlert(
          session.user.id, params.alertType, params.message
        );
        break;

      case 'admin_user_activity':
        await comprehensiveNotificationService.notifyAdminUserActivity(
          session.user.id, params.activity, params.count
        );
        break;

      case 'broadcast_job_alert':
        await comprehensiveNotificationService.broadcastJobAlert(
          params.jobTitle, params.location, params.jobType
        );
        break;

      case 'broadcast_maintenance':
        await comprehensiveNotificationService.broadcastSystemMaintenance(
          params.message, params.scheduledTime
        );
        break;

      case 'get_stats':
        const stats = await comprehensiveNotificationService.getNotificationStats(session.user.id);
        return NextResponse.json({ success: true, data: stats });

      case 'mark_read_by_type':
        await comprehensiveNotificationService.markNotificationsAsReadByType(
          session.user.id, params.type
        );
        return NextResponse.json({ success: true, message: 'Notifications marked as read' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (_error) {
    console.error('Error in comprehensive notifications API:', error);
    return NextResponse.json(
      { error: 'Failed to process notification request' },
      { status: 500 }
    );
  }
}
