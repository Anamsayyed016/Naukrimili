'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Bell, 
  MapPin, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Download
} from 'lucide-react';
import { 
  checkNotificationCapabilities, 
  testNotifications, 
  showNotification,
  initializeNotifications 
} from '@/lib/mobile-notifications';
import { mobileDebugger } from '@/lib/mobile-debug-utils';

export default function MobileTestPage() {
  const [testResults, setTestResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [notificationCapabilities, setNotificationCapabilities] = useState<any>(null);

  useEffect(() => {
    // Initialize notification capabilities
    const capabilities = checkNotificationCapabilities();
    setNotificationCapabilities(capabilities);
  }, []);

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    const results: any = {};

    try {
      // Test 1: Device Detection
      results.device = {
        isMobile: mobileDebugger.isMobileDevice(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server-side',
        screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown'
      };

      // Test 2: Notification Capabilities
      const capabilities = checkNotificationCapabilities();
      results.notifications = capabilities;

      // Test 3: Notification Functionality
      const notificationTest = await testNotifications();
      results.notificationTest = notificationTest;

      // Test 4: Mobile Environment Analysis
      const envAnalysis = await mobileDebugger.analyzeEnvironment();
      results.environment = envAnalysis;

      // Test 5: Browser Capabilities
      results.browser = mobileDebugger.getBrowserInfo();

      setTestResults(results);
      console.log('🧪 Comprehensive mobile test completed:', results);

    } catch (_error) {
      console.error('Test failed:', error);
      results.error = error;
      setTestResults(results);
    } finally {
      setIsRunning(false);
    }
  };

  const testNotification = async () => {
    const success = showNotification({
      title: 'Test Notification',
      body: 'This is a test notification to verify mobile compatibility',
      tag: 'mobile-test'
    });
    
    if (success) {
      console.log('✅ Test notification sent successfully');
    } else {
      console.warn('❌ Test notification failed');
    }
  };

  const testServerNotification = async () => {
    try {
      console.log('🧪 Testing server notification...');
      
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'SYSTEM',
          title: '🔔 Server Test Notification',
          message: 'This notification was sent from the server to test the complete notification flow!'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Server notification test successful:', result);
        alert('✅ Server notification sent successfully! Check your notifications.');
      } else {
        console.error('❌ Server notification test failed:', result);
        alert('❌ Server notification test failed: ' + result.error);
      }
    } catch (_error) {
      console.error('❌ Server notification test error:', error);
      alert('❌ Server notification test error: ' + error.message);
    }
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={condition ? "default" : "destructive"}>
        {condition ? trueText : falseText}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📱 Mobile Compatibility Test
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive testing for mobile notifications and device compatibility
          </p>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
              Run Mobile Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runComprehensiveTest} 
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? 'Running Tests...' : '🚀 Run Comprehensive Test'}
            </Button>
            
            <Button 
              onClick={testNotification} 
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Bell className="w-4 h-4 mr-2" />
              Test Browser Notification
            </Button>
            
            <Button 
              onClick={testServerNotification} 
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Bell className="w-4 h-4 mr-2" />
              Test Server Notification
            </Button>
          </CardContent>
        </Card>

        {/* Notification Capabilities */}
        {notificationCapabilities && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Supported:</span>
                  {getStatusBadge(notificationCapabilities.supported, 'Yes', 'No')}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Permission:</span>
                  <Badge variant="outline">{notificationCapabilities.permission}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Can Request:</span>
                  {getStatusBadge(notificationCapabilities.canRequest, 'Yes', 'No')}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Mobile Device:</span>
                  {getStatusBadge(notificationCapabilities.isMobile, 'Yes', 'No')}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Fallback Available:</span>
                  {getStatusBadge(notificationCapabilities.fallbackAvailable, 'Yes', 'No')}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="space-y-6">
            {/* Device Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Device Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Device Type:</span>
                    {getStatusBadge(testResults.device?.isMobile, '📱 Mobile', '💻 Desktop')}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Screen Size:</span>
                    <span className="text-sm">{testResults.device?.screenSize}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Test Results */}
            {testResults.notificationTest && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Test Status:</span>
                    {getStatusBadge(testResults.notificationTest.success, 'Success', 'Failed')}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Method Used:</span>
                    <Badge variant="outline">{testResults.notificationTest.method}</Badge>
                  </div>
                  {testResults.notificationTest.error && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {testResults.notificationTest.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Environment Analysis */}
            {testResults.environment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Environment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Protocol:</span>
                      <Badge variant={testResults.environment.isHTTPS ? 'default' : 'destructive'}>
                        {testResults.environment.protocol}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Geolocation:</span>
                      {getStatusBadge(testResults.environment.capabilities.geolocation, 'Supported', 'Not Supported')}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Local Storage:</span>
                      {getStatusBadge(testResults.environment.capabilities.localStorage, 'Supported', 'Not Supported')}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">OAuth Popup:</span>
                      {getStatusBadge(testResults.environment.capabilities.popupSupport, 'Supported', 'Not Supported')}
                    </div>
                  </div>

                  {/* Errors and Warnings */}
                  {(testResults.environment.errors?.length > 0 || testResults.environment.warnings?.length > 0) && (
                    <div className="space-y-2">
                      {testResults.environment.errors?.length > 0 && (
                        <Alert className="bg-red-50 border-red-200">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <strong>Errors Detected:</strong> {testResults.environment.errors.length} JavaScript errors found
                          </AlertDescription>
                        </Alert>
                      )}
                      {testResults.environment.warnings?.length > 0 && (
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <strong>Warnings Detected:</strong> {testResults.environment.warnings.length} console warnings found
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💡 Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!testResults.environment?.isHTTPS && testResults.environment?.isProduction && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>🚨 CRITICAL:</strong> Enable HTTPS for mobile geolocation and OAuth to work properly
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {!testResults.notifications?.supported && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>⚠️ Notification Issue:</strong> Browser notifications are not supported. Using in-app notifications as fallback.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {testResults.notificationTest?.success && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>✅ All Systems Working:</strong> Mobile notifications are working perfectly!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
