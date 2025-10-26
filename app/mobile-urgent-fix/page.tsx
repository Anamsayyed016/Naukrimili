'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Smartphone, Monitor, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useLocationDetection } from '@/hooks/useLocationDetection';

export default function MobileUrgentFixPage() {
  const [testResults, setTestResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  
  const { 
    location, 
    isLoading, 
    hasPermission, 
    permissionState,
    detectLocation, 
    error,
    isMobileDevice,
    isSecureConnection
  } = useLocationDetection({ autoDetect: false });

  // Run comprehensive mobile tests
  const runMobileTests = async () => {
    setIsRunning(true);
    const results: any = {};

    try {
      // Test 1: Device Detection
      results.device = {
        isMobile: isMobileDevice,
        isSecure: isSecureConnection,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server-side',
        screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown'
      };

      // Test 2: Geolocation Support
      results.geolocation = {
        supported: typeof window !== 'undefined' && 'geolocation' in navigator,
        permission: permissionState,
        hasPermission: hasPermission
      };

      // Test 3: HTTPS Status
      results.https = {
        protocol: typeof window !== 'undefined' ? window.location.protocol : 'Unknown',
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'Unknown',
        isSecure: isSecureConnection
      };

      // Test 4: Location Detection
      console.log('📍 Testing location detection...');
      const locationResult = await detectLocation();
      results.location = {
        success: !!locationResult,
        data: locationResult,
        error: error
      };

      setTestResults(results);
    } catch (_error) {
      console.error('Test failed:', error);
      results.error = error;
      setTestResults(results);
    } finally {
      setIsRunning(false);
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
            Comprehensive testing for mobile geolocation and authentication
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
          <CardContent>
            <Button 
              onClick={runMobileTests} 
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? 'Running Tests...' : '🚀 Run All Tests'}
            </Button>
          </CardContent>
        </Card>

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
                    <span className="font-medium">Connection:</span>
                    {getStatusBadge(testResults.device?.isSecure, '🔒 HTTPS', '⚠️ HTTP')}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Screen Size:</span>
                    <span className="text-sm">{testResults.device?.screenSize}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">User Agent:</span>
                    <span className="text-xs text-gray-600 truncate max-w-32">
                      {testResults.device?.userAgent}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Geolocation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Geolocation Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Supported:</span>
                    {getStatusIcon(testResults.geolocation?.supported)}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Permission:</span>
                    <Badge variant="outline">{testResults.geolocation?.permission || 'Unknown'}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Has Access:</span>
                    {getStatusIcon(testResults.geolocation?.hasPermission)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* HTTPS Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  HTTPS Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Protocol:</span>
                    <span className="font-mono">{testResults.https?.protocol}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Hostname:</span>
                    <span className="font-mono">{testResults.https?.hostname}</span>
                  </div>
                </div>
                
                {!testResults.https?.isSecure && testResults.device?.isMobile && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">⚠️ HTTPS Required for Mobile</p>
                        <p className="text-sm">
                          Mobile browsers require HTTPS for geolocation to work properly. 
                          Your site is currently running on HTTP.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Detection Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location Detection Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Detection Status:</span>
                  {getStatusIcon(testResults.location?.success)}
                </div>
                
                {testResults.location?.success && testResults.location?.data && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="space-y-2">
                      <p className="font-medium text-green-800">✅ Location Detected Successfully</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">City:</span> {testResults.location.data.city || 'Unknown'}
                        </div>
                        <div>
                          <span className="font-medium">State:</span> {testResults.location.data.state || 'Unknown'}
                        </div>
                        <div>
                          <span className="font-medium">Country:</span> {testResults.location.data.countryName || 'Unknown'}
                        </div>
                        {testResults.location.data.coordinates && (
                          <div>
                            <span className="font-medium">Coordinates:</span> 
                            <br />
                            <span className="font-mono text-xs">
                              {testResults.location.data.coordinates.lat.toFixed(4)}, {testResults.location.data.coordinates.lng.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {testResults.location?.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <XCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">❌ Location Detection Failed</p>
                        <p className="text-sm">{testResults.location.error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💡 Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!testResults.https?.isSecure && testResults.device?.isMobile && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 font-medium">🚨 CRITICAL: Enable HTTPS</p>
                      <p className="text-red-700 text-sm">
                        Mobile geolocation will not work without HTTPS. This is a browser security requirement.
                      </p>
                    </div>
                  )}
                  
                  {testResults.geolocation?.permission === 'denied' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium">⚠️ Location Permission Denied</p>
                      <p className="text-yellow-700 text-sm">
                        Users have denied location access. They can re-enable it in browser settings.
                      </p>
                    </div>
                  )}
                  
                  {testResults.location?.success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">✅ All Systems Working</p>
                      <p className="text-green-700 text-sm">
                        Your mobile geolocation is working perfectly! Users can detect their location.
                      </p>
                    </div>
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
