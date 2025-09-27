/**
 * Test Notifications Page
 * Demo page to test comprehensive notification system
 */

'use client';

import React, { useState } from 'react';
import { useComprehensiveNotifications } from '@/hooks/useComprehensiveNotifications';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Star, 
  Calendar, 
  Briefcase, 
  User, 
  Building, 
  Settings 
} from 'lucide-react';

export default function TestNotificationsPage() {
  const { data: session } = useSession();
  const {
    notifyApplicationSubmitted,
    notifyApplicationStatusChange,
    notifyInterviewScheduled,
    notifyJobMatch,
    notifyProfileIncomplete,
    notifyNewApplication,
    notifyJobExpiring,
    notifyJobPerformance,
    notifyCompanyVerification,
    notifyNewCompany,
    notifySystemAlert,
    notifyUserActivity,
    broadcastJobAlert,
    broadcastMaintenance,
    getNotificationStats,
    markNotificationsReadByType,
    isLoading,
    error
  } = useComprehensiveNotifications();

  const [testData, setTestData] = useState({
    jobTitle: 'Senior Software Engineer',
    companyName: 'TechCorp India',
    applicantName: 'John Doe',
    applicationId: 'app_123',
    interviewDate: '2024-01-15T10:00:00Z',
    matchScore: 95,
    missingFields: ['Skills', 'Experience', 'Education'],
    daysLeft: 3,
    views: 150,
    applications: 25,
    companyId: 'comp_456',
    alertType: 'Security Alert',
    message: 'Suspicious activity detected',
    activity: 'New User Registrations',
    count: 12,
    location: 'Bangalore, India',
    jobType: 'Full-time',
    scheduledTime: '2024-01-20 02:00 AM'
  });

  const handleTestNotification = async (type: string) => {
    try {
      let success = false;
      
      switch (type) {
        case 'jobseeker_application_submitted':
          success = await notifyApplicationSubmitted(testData.jobTitle, testData.companyName);
          break;
        case 'jobseeker_application_status_change':
          success = await notifyApplicationStatusChange(testData.jobTitle, testData.companyName, 'shortlisted');
          break;
        case 'jobseeker_interview_scheduled':
          success = await notifyInterviewScheduled(testData.jobTitle, testData.companyName, testData.interviewDate);
          break;
        case 'jobseeker_job_match':
          success = await notifyJobMatch(testData.jobTitle, testData.companyName, testData.matchScore);
          break;
        case 'jobseeker_profile_incomplete':
          success = await notifyProfileIncomplete(testData.missingFields);
          break;
        case 'employer_new_application':
          success = await notifyNewApplication(testData.applicantName, testData.jobTitle, testData.applicationId);
          break;
        case 'employer_job_expiring':
          success = await notifyJobExpiring(testData.jobTitle, testData.daysLeft);
          break;
        case 'employer_job_performance':
          success = await notifyJobPerformance(testData.jobTitle, testData.views, testData.applications);
          break;
        case 'employer_company_verification':
          success = await notifyCompanyVerification('approved');
          break;
        case 'admin_new_company':
          success = await notifyNewCompany(testData.companyName, testData.companyId);
          break;
        case 'admin_system_alert':
          success = await notifySystemAlert(testData.alertType, testData.message);
          break;
        case 'admin_user_activity':
          success = await notifyUserActivity(testData.activity, testData.count);
          break;
        case 'broadcast_job_alert':
          success = await broadcastJobAlert(testData.jobTitle, testData.location, testData.jobType);
          break;
        case 'broadcast_maintenance':
          success = await broadcastMaintenance(testData.message, testData.scheduledTime);
          break;
        default:
          console.error('Unknown notification type:', type);
      }

      if (success) {
        alert('✅ Notification sent successfully!');
      } else {
        alert('❌ Failed to send notification');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('❌ Error sending notification');
    }
  };

  const handleGetStats = async () => {
    try {
      const stats = await getNotificationStats();
      console.log('Notification Stats:', stats);
      alert('Stats logged to console');
    } catch (err) {
      console.error('Error getting stats:', err);
      alert('❌ Error getting stats');
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to test notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Notifications</h1>
          <p className="text-gray-600">Test the comprehensive notification system</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Data Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Test Data Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={testData.jobTitle}
                  onChange={(e) => setTestData(prev => ({ ...prev, jobTitle: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={testData.companyName}
                  onChange={(e) => setTestData(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="applicantName">Applicant Name</Label>
                <Input
                  id="applicantName"
                  value={testData.applicantName}
                  onChange={(e) => setTestData(prev => ({ ...prev, applicantName: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="matchScore">Match Score (%)</Label>
                <Input
                  id="matchScore"
                  type="number"
                  value={testData.matchScore}
                  onChange={(e) => setTestData(prev => ({ ...prev, matchScore: parseInt(e.target.value) }))}
                />
              </div>
              
              <div>
                <Label htmlFor="views">Job Views</Label>
                <Input
                  id="views"
                  type="number"
                  value={testData.views}
                  onChange={(e) => setTestData(prev => ({ ...prev, views: parseInt(e.target.value) }))}
                />
              </div>
              
              <div>
                <Label htmlFor="applications">Applications Count</Label>
                <Input
                  id="applications"
                  type="number"
                  value={testData.applications}
                  onChange={(e) => setTestData(prev => ({ ...prev, applications: parseInt(e.target.value) }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Jobseeker Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Jobseeker Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleTestNotification('jobseeker_application_submitted')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Application Submitted
              </Button>
              
              <Button
                onClick={() => handleTestNotification('jobseeker_application_status_change')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Application Status Change
              </Button>
              
              <Button
                onClick={() => handleTestNotification('jobseeker_interview_scheduled')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Interview Scheduled
              </Button>
              
              <Button
                onClick={() => handleTestNotification('jobseeker_job_match')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Star className="w-4 h-4 mr-2" />
                Job Match Found
              </Button>
              
              <Button
                onClick={() => handleTestNotification('jobseeker_profile_incomplete')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Profile Incomplete
              </Button>
            </CardContent>
          </Card>

          {/* Employer Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Employer Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleTestNotification('employer_new_application')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Bell className="w-4 h-4 mr-2" />
                New Application Received
              </Button>
              
              <Button
                onClick={() => handleTestNotification('employer_job_expiring')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Job Expiring Soon
              </Button>
              
              <Button
                onClick={() => handleTestNotification('employer_job_performance')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Info className="w-4 h-4 mr-2" />
                Job Performance Update
              </Button>
              
              <Button
                onClick={() => handleTestNotification('employer_company_verification')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Company Verification
              </Button>
            </CardContent>
          </Card>

          {/* Admin Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Admin Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleTestNotification('admin_new_company')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Building className="w-4 h-4 mr-2" />
                New Company Registration
              </Button>
              
              <Button
                onClick={() => handleTestNotification('admin_system_alert')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                System Alert
              </Button>
              
              <Button
                onClick={() => handleTestNotification('admin_user_activity')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Info className="w-4 h-4 mr-2" />
                User Activity Report
              </Button>
            </CardContent>
          </Card>

          {/* Broadcast Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Broadcast Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleTestNotification('broadcast_job_alert')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Star className="w-4 h-4 mr-2" />
                Broadcast Job Alert
              </Button>
              
              <Button
                onClick={() => handleTestNotification('broadcast_maintenance')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Broadcast Maintenance
              </Button>
            </CardContent>
          </Card>

          {/* Utility Functions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Utility Functions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleGetStats}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Info className="w-4 h-4 mr-2" />
                Get Notification Stats
              </Button>
              
              <Button
                onClick={() => markNotificationsReadByType('APPLICATION_UPDATE')}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Application Notifications as Read
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How to Test:</h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-1">
            <li>Configure the test data in the left panel</li>
            <li>Click any notification button to send a test notification</li>
            <li>Check the notification bell in the navigation bar</li>
            <li>Visit <code>/dashboard/notifications</code> to see all notifications</li>
            <li>Use utility functions to manage notifications</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
