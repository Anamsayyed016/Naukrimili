/**
 * Notification Test Panel Component
 * For testing role-based real-time notifications
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  Send, 
  TestTube, 
  Users, 
  Building2, 
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationTest {
  id: string;
  role: string;
  title: string;
  message: string;
  type: string;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
}

export function NotificationTestPanel() {
  const [selectedRole, setSelectedRole] = useState('jobseeker');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('JOB_ALERT');
  const [isLoading, setIsLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<NotificationTest[]>([]);

  const roles = [
    { value: 'jobseeker', label: 'Jobseekers', icon: Users, color: 'bg-blue-500' },
    { value: 'employer', label: 'Employers', icon: Building2, color: 'bg-green-500' },
    { value: 'admin', label: 'Admins', icon: Shield, color: 'bg-purple-500' }
  ];

  const notificationTypes = [
    'JOB_CREATED',
    'JOB_ALERT_MATCH',
    'APPLICATION_RECEIVED',
    'INTERVIEW_SCHEDULED',
    'SYSTEM_ANNOUNCEMENT',
    'JOB_RECOMMENDATION',
    'APPLICATION_UPDATE'
  ];

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    setIsLoading(true);
    const testId = `test_${Date.now()}`;
    
    // Add to test history
    const newTest: NotificationTest = {
      id: testId,
      role: selectedRole,
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      timestamp: new Date(),
      status: 'pending'
    };
    
    setTestHistory(prev => [newTest, ...prev]);

    try {
      const response = await fetch('/api/notifications/role-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole,
          notification: {
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            data: {
              testId,
              timestamp: new Date().toISOString(),
              source: 'test_panel'
            }
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update test status
        setTestHistory(prev => 
          prev.map(test => 
            test.id === testId 
              ? { ...test, status: 'success' as const }
              : test
          )
        );

        toast.success(`✅ Notification sent to ${selectedRole}s!`, {
          description: `"${notificationTitle}" delivered successfully`,
          duration: 3000
        });

        // Clear form
        setNotificationTitle('');
        setNotificationMessage('');
      } else {
        throw new Error(data.error || 'Failed to send notification');
      }
    } catch (error: unknown) {
      // Update test status
      setTestHistory(prev => 
        prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error' as const }
            : test
        )
      );

      toast.error(`❌ Failed to send notification to ${selectedRole}s`, {
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleIcon = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig ? <roleConfig.icon className="h-4 w-4" /> : <Bell className="h-4 w-4" />;
  };

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.color || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Test Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Real-time Notification Test Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <role.icon className="h-4 w-4" />
                      {role.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notification Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notification Type</label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              placeholder="Enter notification title..."
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Enter notification message..."
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendNotification}
            disabled={isLoading || !notificationTitle.trim() || !notificationMessage.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Notification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test History */}
      {testHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Test History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testHistory.slice(0, 10).map((test) => (
                <div
                  key={test.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <Badge 
                      variant="outline" 
                      className={`${getRoleColor(test.role)} text-white border-0`}
                    >
                      {getRoleIcon(test.role)}
                      <span className="ml-1">{test.role}</span>
                    </Badge>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{test.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {test.type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {test.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            How to Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1. Select Role:</strong> Choose which user role to send notifications to</p>
            <p><strong>2. Fill Details:</strong> Enter title and message for the notification</p>
            <p><strong>3. Send Test:</strong> Click the button to send a real-time notification</p>
            <p><strong>4. Check Results:</strong> 
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Desktop notification should appear (if browser permissions allowed)</li>
                <li>Notification bell should show unread count</li>
                <li>Real-time updates should be visible instantly</li>
              </ul>
            </p>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Open multiple browser tabs with different user roles to see 
              role-based notifications in action!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}