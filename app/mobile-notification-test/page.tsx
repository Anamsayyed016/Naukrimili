'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMobileNotifications } from '@/hooks/useMobileNotifications';
import { useSocket } from '@/hooks/useSocket';
import { Bell, Smartphone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function MobileNotificationTestPage() {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    timestamp: string;
  }>>([]);

  const {
    isMobile,
    isSupported,
    permission,
    canRequest,
    isConnected,
    showMobileNotification,
    testNotification,
    requestPermission,
    showWelcomeNotification,
    showJobApplicationNotification,
    showNewMessageNotification,
    showJobRecommendationNotification
  } = useMobileNotifications();

  const { notifications, unreadCount } = useSocket();

  const addTestResult = (test: string, status: 'success' | 'error' | 'pending', message: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTest = async (testName: string, testFn: () => Promise<boolean> | boolean) => {
    addTestResult(testName, 'pending', 'Running test...');
    
    try {
      const result = await testFn();
      addTestResult(testName, result ? 'success' : 'error', result ? 'Test passed' : 'Test failed');
    } catch (_error) {
      addTestResult(testName, 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testBasicNotification = () => {
    return showMobileNotification({
      title: 'Test Notification',
      body: 'This is a test notification to verify mobile functionality',
      tag: 'test-basic'
    });
  };

  const testWelcomeNotification = () => {
    return showWelcomeNotification('Test User');
  };

  const testJobApplicationNotification = () => {
    return showJobApplicationNotification('Software Engineer', 'Tech Corp');
  };

  const testNewMessageNotification = () => {
    return showNewMessageNotification('John Doe', 'Hello! I saw your application and would like to schedule an interview.');
  };

  const testJobRecommendationNotification = () => {
    return showJobRecommendationNotification('Senior Developer', 'Innovation Labs');
  };

  const testPermissionRequest = async () => {
    return await requestPermission();
  };

  const testNotificationSystem = async () => {
    return await testNotification();
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mobile Notification Test</h1>
          <p className="text-gray-600">Test mobile notification functionality and debug issues</p>
        </div>

        {/* Device Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Device Type:</span>
                  <Badge variant={isMobile ? 'default' : 'secondary'}>
                    {isMobile ? 'Mobile' : 'Desktop'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Notifications Supported:</span>
                  <Badge variant={isSupported ? 'default' : 'destructive'}>
                    {isSupported ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Permission:</span>
                  <Badge variant={permission === 'granted' ? 'default' : permission === 'denied' ? 'destructive' : 'secondary'}>
                    {permission}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Can Request:</span>
                  <Badge variant={canRequest ? 'default' : 'secondary'}>
                    {canRequest ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Socket Connected:</span>
                  <Badge variant={isConnected ? 'default' : 'destructive'}>
                    {isConnected ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Notifications:</span>
                  <Badge variant="outline">{notifications.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Unread Count:</span>
                  <Badge variant={unreadCount > 0 ? 'destructive' : 'outline'}>
                    {unreadCount}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Test Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => runTest('Basic Notification', testBasicNotification)}
                className="w-full"
                variant="outline"
              >
                Test Basic Notification
              </Button>
              
              <Button
                onClick={() => runTest('Welcome Notification', testWelcomeNotification)}
                className="w-full"
                variant="outline"
              >
                Test Welcome Notification
              </Button>
              
              <Button
                onClick={() => runTest('Job Application', testJobApplicationNotification)}
                className="w-full"
                variant="outline"
              >
                Test Job Application
              </Button>
              
              <Button
                onClick={() => runTest('New Message', testNewMessageNotification)}
                className="w-full"
                variant="outline"
              >
                Test New Message
              </Button>
              
              <Button
                onClick={() => runTest('Job Recommendation', testJobRecommendationNotification)}
                className="w-full"
                variant="outline"
              >
                Test Job Recommendation
              </Button>
              
              <Button
                onClick={() => runTest('Permission Request', testPermissionRequest)}
                className="w-full"
                variant="outline"
                disabled={!canRequest}
              >
                Request Permission
              </Button>
              
              <Button
                onClick={() => runTest('Notification System', testNotificationSystem)}
                className="w-full"
                variant="outline"
              >
                Test System
              </Button>
              
              <Button
                onClick={clearTestResults}
                className="w-full"
                variant="destructive"
              >
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tests run yet. Click a test button above to start.</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {result.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                      {result.status === 'pending' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                      <div>
                        <p className="font-medium">{result.test}</p>
                        <p className="text-sm text-gray-600">{result.message}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Notifications */}
        {notifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Current Notifications ({notifications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
