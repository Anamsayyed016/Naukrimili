'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bug, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Smartphone,
  Monitor,
  Globe,
  Shield,
  Zap,
  Download,
  RefreshCw
} from 'lucide-react';

interface MobileDebugInfo {
  timestamp: string;
  userAgent: string;
  screenSize: string;
  viewport: string;
  devicePixelRatio: number;
  touchSupport: boolean;
  orientation: string;
  protocol: string;
  hostname: string;
  isHTTPS: boolean;
  isLocalhost: boolean;
  isProduction: boolean;
  browser: {
    name: string;
    version: string;
    isChrome: boolean;
    isSafari: boolean;
    isFirefox: boolean;
    isEdge: boolean;
    isAndroid: boolean;
    isIOS: boolean;
  };
  capabilities: {
    geolocation: boolean;
    permissions: boolean;
    serviceWorker: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    cookies: boolean;
    popupSupport: boolean;
  };
  errors: Array<{
    type: string;
    message: string;
    stack?: string;
    timestamp: string;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function MobileDebugger() {
  const [debugInfo, setDebugInfo] = useState<MobileDebugInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugReport, setDebugReport] = useState<string>('');

  // Capture all errors and warnings
  useEffect(() => {
    const errors: Array<{ type: string; message: string; stack?: string; timestamp: string }> = [];
    const warnings: Array<{ type: string; message: string; timestamp: string }> = [];

    // Capture console errors
    const originalError = console.error;
    console.error = (...args) => {
      errors.push({
        type: 'console.error',
        message: args.join(' '),
        stack: new Error().stack,
        timestamp: new Date().toISOString()
      });
      originalError.apply(console, args);
    };

    // Capture console warnings
    const originalWarn = console.warn;
    console.warn = (...args) => {
      warnings.push({
        type: 'console.warn',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      });
      originalWarn.apply(console, args);
    };

    // Capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      errors.push({
        type: 'unhandledError',
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    };

    // Capture unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      errors.push({
        type: 'unhandledRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Store references for cleanup
    (window as any).__mobileDebugErrors = errors;
    (window as any).__mobileDebugWarnings = warnings;

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const analyzeMobileEnvironment = useCallback(async (): Promise<MobileDebugInfo> => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot analyze environment on server-side');
    }

    const errors = (window as any).__mobileDebugErrors || [];
    const warnings = (window as any).__mobileDebugWarnings || [];

    const userAgent = navigator.userAgent;
    let browserName = 'unknown';
    let browserVersion = 'unknown';

    // Detect browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserName = 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
    } else if (userAgent.includes('Edg')) {
      browserName = 'Edge';
    }

    // Extract version
    const versionMatch = userAgent.match(/(Chrome|Safari|Firefox|Edge)\/(\d+\.\d+)/);
    if (versionMatch) {
      browserVersion = versionMatch[2];
    }

    const browser = {
      name: browserName,
      version: browserVersion,
      isChrome: browserName === 'Chrome',
      isSafari: browserName === 'Safari',
      isFirefox: browserName === 'Firefox',
      isEdge: browserName === 'Edge',
      isAndroid: userAgent.includes('Android'),
      isIOS: /iPad|iPhone|iPod/.test(userAgent)
    };

    const capabilities = {
      geolocation: 'geolocation' in navigator,
      permissions: 'permissions' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          sessionStorage.setItem('test', 'test');
          sessionStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      cookies: navigator.cookieEnabled,
      popupSupport: (() => {
        try {
          const testPopup = window.open('', '_blank', 'width=1,height=1');
          if (testPopup) {
            testPopup.close();
            return true;
          }
          return false;
        } catch {
          return false;
        }
      })()
    };

    return {
      timestamp: new Date().toISOString(),
      userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      viewport: `${window.screen.width}x${window.screen.height}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      orientation: (window as any).orientation || 'unknown',
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isHTTPS: window.location.protocol === 'https:',
      isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
      browser,
      capabilities,
      errors,
      warnings
    };
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const info = await analyzeMobileEnvironment();
      setDebugInfo(info);
      
      // Generate debug report
      const report = generateDebugReport(info);
      setDebugReport(report);
      
      console.log('🔍 Mobile Debug Analysis Complete:', info);
      console.log('📋 Debug Report:', report);
      
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Mobile analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateDebugReport = (info: MobileDebugInfo): string => {
    let report = '🔍 MOBILE DEBUG REPORT\n';
    report += '='.repeat(50) + '\n\n';
    
    report += `📅 Timestamp: ${info.timestamp}\n`;
    report += `🌐 URL: ${info.protocol}//${info.hostname}\n\n`;
    
    report += '📱 DEVICE INFO:\n';
    report += `Screen: ${info.screenSize}\n`;
    report += `Viewport: ${info.viewport}\n`;
    report += `Touch: ${info.touchSupport ? 'Yes' : 'No'}\n`;
    report += `Orientation: ${info.orientation}\n`;
    report += `Pixel Ratio: ${info.devicePixelRatio}\n\n`;
    
    report += '🌐 BROWSER INFO:\n';
    report += `Browser: ${info.browser.name} ${info.browser.version}\n`;
    report += `Platform: ${info.browser.isAndroid ? 'Android' : info.browser.isIOS ? 'iOS' : 'Desktop'}\n\n`;
    
    report += '🔒 ENVIRONMENT:\n';
    report += `Protocol: ${info.protocol}\n`;
    report += `HTTPS: ${info.isHTTPS ? 'Yes' : 'No'}\n`;
    report += `Production: ${info.isProduction ? 'Yes' : 'No'}\n\n`;
    
    report += '⚡ CAPABILITIES:\n';
    report += `Geolocation: ${info.capabilities.geolocation ? 'Yes' : 'No'}\n`;
    report += `OAuth Popup: ${info.capabilities.popupSupport ? 'Yes' : 'No'}\n`;
    report += `Permissions: ${info.capabilities.permissions ? 'Yes' : 'No'}\n`;
    report += `Local Storage: ${info.capabilities.localStorage ? 'Yes' : 'No'}\n`;
    report += `Session Storage: ${info.capabilities.sessionStorage ? 'Yes' : 'No'}\n`;
    report += `Cookies: ${info.capabilities.cookies ? 'Yes' : 'No'}\n\n`;
    
    if (info.errors.length > 0) {
      report += '❌ ERRORS DETECTED:\n';
      info.errors.forEach((error, index) => {
        report += `${index + 1}. [${error.type}] ${error.message}\n`;
        if (error.stack) {
          report += `   Stack: ${error.stack.split('\n')[1]?.trim() || 'N/A'}\n`;
        }
        report += `   Time: ${error.timestamp}\n\n`;
      });
    }
    
    if (info.warnings.length > 0) {
      report += '⚠️ WARNINGS DETECTED:\n';
      info.warnings.forEach((warning, index) => {
        report += `${index + 1}. [${warning.type}] ${warning.message}\n`;
        report += `   Time: ${warning.timestamp}\n\n`;
      });
    }
    
    if (info.errors.length === 0 && info.warnings.length === 0) {
      report += '✅ NO ERRORS OR WARNINGS DETECTED\n\n';
    }
    
    // Add recommendations
    report += '💡 RECOMMENDATIONS:\n';
    if (!info.isHTTPS && info.isProduction) {
      report += '1. Enable HTTPS for mobile geolocation and OAuth\n';
    }
    if (!info.capabilities.popupSupport && info.browser.isAndroid) {
      report += '2. Use redirect-based OAuth on mobile devices\n';
    }
    if (info.errors.length > 0) {
      report += '3. Fix client-side JavaScript errors\n';
    }
    if (info.warnings.length > 0) {
      report += '4. Address console warnings\n';
    }
    
    return report;
  };

  const downloadReport = () => {
    const blob = new Blob([debugReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-debug-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (value: boolean) => {
    return value ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (value: boolean, label: string) => {
    return (
      <Badge variant={value ? 'default' : 'destructive'} className="flex items-center gap-1">
        {getStatusIcon(value)}
        {label}
      </Badge>
    );
  };

  useEffect(() => {
    // Auto-run analysis on mount
    runAnalysis();
  }, []);

  if (!debugInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-6 w-6" />
                Mobile Debug Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                {isAnalyzing ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-lg font-medium">Analyzing Mobile Environment...</p>
                    <p className="text-sm text-gray-600">Capturing errors and testing capabilities</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AlertTriangle className="h-16 w-16 text-yellow-600 mx-auto" />
                    <p className="text-lg font-medium">Analysis Failed</p>
                    {error && (
                      <Alert className="max-w-md mx-auto">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <Button onClick={runAnalysis} className="mt-4">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Mobile Debug Analysis
          </h1>
          <p className="text-gray-600">
            Comprehensive analysis of mobile environment and client-side exceptions
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={runAnalysis} disabled={isAnalyzing} variant="outline">
            {isAnalyzing ? 'Analyzing...' : 'Re-run Analysis'}
          </Button>
          <Button onClick={downloadReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>

        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Screen Size:</span>
                  <span className="text-sm font-mono">{debugInfo.screenSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Touch Support:</span>
                  {getStatusBadge(debugInfo.touchSupport, debugInfo.touchSupport ? 'Yes' : 'No')}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Device Pixel Ratio:</span>
                  <span className="text-sm font-mono">{debugInfo.devicePixelRatio}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">User Agent:</span>
                  <span className="text-xs text-gray-600 max-w-xs truncate" title={debugInfo.userAgent}>
                    {debugInfo.userAgent}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Viewport:</span>
                  <span className="text-sm font-mono">{debugInfo.viewport}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Orientation:</span>
                  <span className="text-sm font-mono">{debugInfo.orientation}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Browser Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Browser Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{debugInfo.browser.name}</p>
                <p className="text-sm text-gray-600">Browser</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{debugInfo.browser.version}</p>
                <p className="text-sm text-gray-600">Version</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {debugInfo.browser.isAndroid ? 'Android' : debugInfo.browser.isIOS ? 'iOS' : 'Desktop'}
                </p>
                <p className="text-sm text-gray-600">Platform</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Protocol:</span>
                  <Badge variant={debugInfo.isHTTPS ? 'default' : 'destructive'}>
                    {debugInfo.protocol}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Hostname:</span>
                  <span className="text-sm font-mono">{debugInfo.hostname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Production:</span>
                  {getStatusBadge(debugInfo.isProduction, debugInfo.isProduction ? 'Yes' : 'No')}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">HTTPS Required:</span>
                  {getStatusBadge(!debugInfo.isHTTPS && debugInfo.isProduction, !debugInfo.isHTTPS && debugInfo.isProduction ? 'Yes' : 'No')}
                </div>
                {!debugInfo.isHTTPS && debugInfo.isProduction && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Mobile browsers require HTTPS for geolocation and OAuth to work properly
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Browser Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Geolocation:</span>
                  {getStatusBadge(debugInfo.capabilities.geolocation, debugInfo.capabilities.geolocation ? 'Supported' : 'Not Supported')}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Permissions API:</span>
                  {getStatusBadge(debugInfo.capabilities.permissions, debugInfo.capabilities.permissions ? 'Supported' : 'Not Supported')}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Service Worker:</span>
                  {getStatusBadge(debugInfo.capabilities.serviceWorker, debugInfo.capabilities.serviceWorker ? 'Supported' : 'Not Supported')}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Local Storage:</span>
                  {getStatusBadge(debugInfo.capabilities.localStorage, debugInfo.capabilities.localStorage ? 'Supported' : 'Not Supported')}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">OAuth Popup:</span>
                  {getStatusBadge(debugInfo.capabilities.popupSupport, debugInfo.capabilities.popupSupport ? 'Supported' : 'Not Supported')}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cookies:</span>
                  {getStatusBadge(debugInfo.capabilities.cookies, debugInfo.capabilities.cookies ? 'Enabled' : 'Disabled')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Errors and Warnings */}
        {(debugInfo.errors.length > 0 || debugInfo.warnings.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Errors & Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debugInfo.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">❌ Errors ({debugInfo.errors.length}):</h4>
                    <div className="space-y-2">
                      {debugInfo.errors.map((error, index) => (
                        <Alert key={index} className="bg-red-50 border-red-200">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <div className="font-medium">[{error.type}] {error.message}</div>
                            {error.stack && (
                              <div className="text-xs mt-1 font-mono">
                                {error.stack.split('\n')[1]?.trim() || 'No stack trace'}
                              </div>
                            )}
                            <div className="text-xs mt-1 opacity-75">{error.timestamp}</div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {debugInfo.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Warnings ({debugInfo.warnings.length}):</h4>
                    <div className="space-y-2">
                      {debugInfo.warnings.map((warning, index) => (
                        <Alert key={index} className="bg-yellow-50 border-yellow-200">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <div className="font-medium">[{warning.type}] {warning.message}</div>
                            <div className="text-xs mt-1 opacity-75">{warning.timestamp}</div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Technical details for developers and support teams
                </p>
                <Button onClick={downloadReport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs max-h-96">
                {debugReport}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
