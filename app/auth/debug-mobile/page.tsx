'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Globe,
  Shield,
  Zap,
  Bug,
  Download
} from 'lucide-react';
import { 
  analyzeMobileEnvironment, 
  generateDebugReport,
  MobileDebugInfo 
} from '@/lib/mobile-debug';

export default function MobileDebugPage() {
  const [debugInfo, setDebugInfo] = useState<MobileDebugInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugReport, setDebugReport] = useState<string>('');

  useEffect(() => {
    // Auto-analyze on page load
    runAnalysis();
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
                    <p className="text-sm text-gray-600">This may take a few seconds</p>
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
            Comprehensive analysis of mobile environment and issues
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
                  <span className="font-medium">Mobile Device:</span>
                  {getStatusBadge(debugInfo.device.isMobile, debugInfo.device.isMobile ? 'Yes' : 'No')}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Touch Support:</span>
                  {getStatusBadge(debugInfo.device.touchSupport, debugInfo.device.touchSupport ? 'Yes' : 'No')}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Screen Size:</span>
                  <span className="text-sm font-mono">{debugInfo.device.screenSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Device Pixel Ratio:</span>
                  <span className="text-sm font-mono">{debugInfo.device.devicePixelRatio}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">User Agent:</span>
                  <span className="text-xs text-gray-600 max-w-xs truncate" title={debugInfo.device.userAgent}>
                    {debugInfo.device.userAgent}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Viewport:</span>
                  <span className="text-sm font-mono">{debugInfo.device.viewport}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Orientation:</span>
                  <span className="text-sm font-mono">{debugInfo.device.orientation}</span>
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
                  <Badge variant={debugInfo.environment.isHTTPS ? 'default' : 'destructive'}>
                    {debugInfo.environment.protocol}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Hostname:</span>
                  <span className="text-sm font-mono">{debugInfo.environment.hostname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Production:</span>
                  {getStatusBadge(debugInfo.environment.isProduction, debugInfo.environment.isProduction ? 'Yes' : 'No')}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">HTTPS Required:</span>
                  {getStatusBadge(debugInfo.issues.httpsRequired, debugInfo.issues.httpsRequired ? 'Yes' : 'No')}
                </div>
                {debugInfo.issues.httpsRequired && (
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

        {/* Issues and Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Issues & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Critical Issues */}
              {debugInfo.issues.httpsRequired && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>CRITICAL ISSUE:</strong> HTTPS is required for mobile geolocation and OAuth to work properly. 
                    Your site is currently running on HTTP, which will prevent mobile users from using these features.
                  </AlertDescription>
                </Alert>
              )}

              {/* Other Issues */}
              {Object.entries(debugInfo.issues).map(([key, value]) => {
                if (key === 'httpsRequired') return null; // Already shown above
                if (!value) return null;
                
                return (
                  <Alert key={key} className="bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> This issue may affect mobile functionality.
                    </AlertDescription>
                  </Alert>
                );
              })}

              {/* Recommendations */}
              {debugInfo.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">💡 Recommendations:</h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    {debugInfo.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                {debugReport}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
