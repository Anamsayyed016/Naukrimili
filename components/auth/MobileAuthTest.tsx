'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Smartphone, Monitor, Shield, Globe } from 'lucide-react';
import { 
  isMobileDevice, 
  supportsOAuthPopup, 
  getPreferredAuthMethod,
  validateMobileAuthEnvironment,
  isHTTPSRequired 
} from '@/lib/mobile-auth';

export default function MobileAuthTest() {
  const [testResults, setTestResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [environment, setEnvironment] = useState<any>(null);

  useEffect(() => {
    // Run initial environment check
    const env = validateMobileAuthEnvironment();
    setEnvironment(env);
  }, []);

  const runFullTest = async () => {
    setIsRunning(true);
    const results: any = {};

    try {
      // Test 1: Device Detection
      results.deviceDetection = {
        isMobile: isMobileDevice(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
        screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
        status: 'completed'
      };

      // Test 2: HTTPS Check
      results.httpsCheck = {
        isHTTPS: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false,
        isLocalhost: typeof window !== 'undefined' ? window.location.hostname === 'localhost' : false,
        isRequired: isHTTPSRequired(),
        status: 'completed'
      };

      // Test 3: OAuth Popup Support
      results.popupSupport = {
        supportsPopup: supportsOAuthPopup(),
        preferredMethod: getPreferredAuthMethod(),
        status: 'completed'
      };

      // Test 4: Browser Capabilities
      results.browserCapabilities = {
        hasGeolocation: typeof window !== 'undefined' ? 'geolocation' in navigator : false,
        hasPermissions: typeof window !== 'undefined' ? 'permissions' in navigator : false,
        hasServiceWorker: typeof window !== 'undefined' ? 'serviceWorker' in navigator : false,
        status: 'completed'
      };

      // Test 5: Environment Validation
      results.environmentValidation = environment;

      setTestResults(results);
    } catch (error) {
      console.error('Mobile auth test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-6 w-6" />
            <span>Mobile Authentication Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button 
              onClick={runFullTest} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? 'Running Tests...' : 'Run Full Test'}
            </Button>
          </div>

          {/* Environment Summary */}
          {environment && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Smartphone className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium">Device Type</p>
                  <p className="text-xs text-gray-600">
                    {environment.isMobile ? 'Mobile' : 'Desktop'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium">Environment</p>
                  <p className="text-xs text-gray-600">
                    {environment.isValid ? 'Valid' : 'Issues Found'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Globe className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium">HTTPS</p>
                  <p className="text-xs text-gray-600">
                    {isHTTPSRequired() ? 'Required' : 'Optional'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results</h3>
              
              {Object.entries(testResults).map(([testName, result]: [string, any]) => (
                <Card key={testName} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base capitalize">
                      {testName.replace(/([A-Z])/g, ' $1').trim()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(result).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <div className="flex items-center space-x-2">
                            {key === 'status' ? (
                              <Badge className={getStatusColor(value)}>
                                <span className="flex items-center space-x-1">
                                  {getStatusIcon(value)}
                                  <span>{value}</span>
                                </span>
                              </Badge>
                            ) : (
                              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Warnings and Errors */}
          {environment && (environment.warnings.length > 0 || environment.errors.length > 0) && (
            <div className="space-y-3">
              {environment.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Errors Found:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {environment.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {environment.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {environment.warnings.map((warning: string, index: number) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
