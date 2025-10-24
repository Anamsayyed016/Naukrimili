'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  getSmartLocation, 
  getGeolocationErrorMessage, 
  isMobileDevice, 
  getMobileGeolocationOptions,
  checkGeolocationPermission,
  requestGeolocationPermission,
  isHTTPSRequired
} from '@/lib/mobile-geolocation';

export default function MobileGeolocationTest() {
  const [testResults, setTestResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  useEffect(() => {
    // Check initial permission status
    checkGeolocationPermission().then(setPermissionStatus);
  }, []);

  const runFullTest = async () => {
    setIsRunning(true);
    const results: any = {};

    try {
      // 1. Environment Check
      results.environment = {
        isMobile: isMobileDevice(),
        isHTTPS: !isHTTPSRequired(),
        protocol: typeof window !== 'undefined' ? location.protocol : 'unknown',
        hostname: typeof window !== 'undefined' ? location.hostname : 'unknown',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
        geolocationSupported: 'geolocation' in navigator,
        permissionsSupported: 'permissions' in navigator
      };

      // 2. Permission Check
      const permission = await checkGeolocationPermission();
      results.permission = {
        status: permission,
        canRequest: permission === 'prompt' || permission === null
      };

      // 3. GPS Test
      if (permission !== 'denied') {
        const gpsResult = await getSmartLocation(getMobileGeolocationOptions());
        results.gps = gpsResult;
      } else {
        results.gps = { success: false, error: 'Permission denied' };
      }

      // 4. IP Fallback Test
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          results.ipFallback = {
            success: true,
            city: data.city,
            country: data.country_code,
            region: data.region
          };
        } else {
          results.ipFallback = { success: false, error: `HTTP ${response.status}` };
        }
      } catch (error) {
        results.ipFallback = { success: false, error: error.message };
      }

      // 5. Reverse Geocoding Test
      if (results.gps.success && results.gps.coordinates) {
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${results.gps.coordinates.lat}&longitude=${results.gps.coordinates.lng}&localityLanguage=en`
          );
          if (response.ok) {
            const data = await response.json();
            results.reverseGeocoding = {
              success: true,
              city: data.city,
              country: data.countryCode,
              state: data.principalSubdivision
            };
          } else {
            results.reverseGeocoding = { success: false, error: `HTTP ${response.status}` };
          }
        } catch (error) {
          results.reverseGeocoding = { success: false, error: error.message };
        }
      }

      setTestResults(results);
    } catch (error) {
      results.error = error.message;
      setTestResults(results);
    } finally {
      setIsRunning(false);
    }
  };

  const requestPermission = async () => {
    const granted = await requestGeolocationPermission();
    if (granted) {
      setPermissionStatus('granted');
    } else {
      setPermissionStatus('denied');
    }
    // Re-run permission check
    const newPermission = await checkGeolocationPermission();
    setPermissionStatus(newPermission || 'unknown');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'prompt': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 Mobile Geolocation Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runFullTest} 
              disabled={isRunning}
              variant="default"
            >
              {isRunning ? 'Running Tests...' : 'Run Full Test'}
            </Button>
            
            {permissionStatus === 'prompt' && (
              <Button 
                onClick={requestPermission}
                variant="outline"
              >
                Request Permission
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Permission Status:</span>
              <Badge className={getStatusColor(permissionStatus)}>
                {permissionStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Environment */}
              {testResults.environment && (
                <div>
                  <h4 className="font-medium mb-2">🌍 Environment</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Mobile Device: <Badge variant={testResults.environment.isMobile ? 'default' : 'secondary'}>{testResults.environment.isMobile ? 'Yes' : 'No'}</Badge></div>
                    <div>HTTPS: <Badge variant={testResults.environment.isHTTPS ? 'default' : 'destructive'}>{testResults.environment.isHTTPS ? 'Yes' : 'No'}</Badge></div>
                    <div>Protocol: {testResults.environment.protocol}</div>
                    <div>Hostname: {testResults.environment.hostname}</div>
                    <div className="col-span-2">Geolocation Supported: <Badge variant={testResults.environment.geolocationSupported ? 'default' : 'destructive'}>{testResults.environment.geolocationSupported ? 'Yes' : 'No'}</Badge></div>
                    <div className="col-span-2">Permissions API: <Badge variant={testResults.environment.permissionsSupported ? 'default' : 'secondary'}>{testResults.environment.permissionsSupported ? 'Yes' : 'No'}</Badge></div>
                  </div>
                </div>
              )}

              {/* Permission */}
              {testResults.permission && (
                <div>
                  <h4 className="font-medium mb-2">🔐 Permission</h4>
                  <div className="space-y-1 text-sm">
                    <div>Status: <Badge className={getStatusColor(testResults.permission.status)}>{testResults.permission.status}</Badge></div>
                    <div>Can Request: <Badge variant={testResults.permission.canRequest ? 'default' : 'secondary'}>{testResults.permission.canRequest ? 'Yes' : 'No'}</Badge></div>
                  </div>
                </div>
              )}

              {/* GPS */}
              {testResults.gps && (
                <div>
                  <h4 className="font-medium mb-2">📍 GPS Location</h4>
                  <div className="space-y-1 text-sm">
                    <div>Success: <Badge variant={testResults.gps.success ? 'default' : 'destructive'}>{testResults.gps.success ? 'Yes' : 'No'}</Badge></div>
                    {testResults.gps.success ? (
                      <>
                        <div>Source: {testResults.gps.source}</div>
                        {testResults.gps.coordinates && (
                          <div>Coordinates: {testResults.gps.coordinates.lat.toFixed(6)}, {testResults.gps.coordinates.lng.toFixed(6)}</div>
                        )}
                        {testResults.gps.city && <div>City: {testResults.gps.city}</div>}
                        {testResults.gps.country && <div>Country: {testResults.gps.country}</div>}
                        {testResults.gps.state && <div>State: {testResults.gps.state}</div>}
                      </>
                    ) : (
                      <div>Error: {testResults.gps.error}</div>
                    )}
                  </div>
                </div>
              )}

              {/* IP Fallback */}
              {testResults.ipFallback && (
                <div>
                  <h4 className="font-medium mb-2">🌐 IP Fallback</h4>
                  <div className="space-y-1 text-sm">
                    <div>Success: <Badge variant={testResults.ipFallback.success ? 'default' : 'destructive'}>{testResults.ipFallback.success ? 'Yes' : 'No'}</Badge></div>
                    {testResults.ipFallback.success ? (
                      <>
                        <div>City: {testResults.ipFallback.city}</div>
                        <div>Country: {testResults.ipFallback.country}</div>
                        <div>Region: {testResults.ipFallback.region}</div>
                      </>
                    ) : (
                      <div>Error: {testResults.ipFallback.error}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Reverse Geocoding */}
              {testResults.reverseGeocoding && (
                <div>
                  <h4 className="font-medium mb-2">🔄 Reverse Geocoding</h4>
                  <div className="space-y-1 text-sm">
                    <div>Success: <Badge variant={testResults.reverseGeocoding.success ? 'default' : 'destructive'}>{testResults.reverseGeocoding.success ? 'Yes' : 'No'}</Badge></div>
                    {testResults.reverseGeocoding.success ? (
                      <>
                        <div>City: {testResults.reverseGeocoding.city}</div>
                        <div>Country: {testResults.reverseGeocoding.country}</div>
                        <div>State: {testResults.reverseGeocoding.state}</div>
                      </>
                    ) : (
                      <div>Error: {testResults.reverseGeocoding.error}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {testResults.error && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">❌ Test Error</h4>
                  <div className="text-sm text-red-600">{testResults.error}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
