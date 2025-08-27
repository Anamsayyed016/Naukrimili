'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Smartphone, 
  Globe, 
  Shield,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';
import { 
  checkMobileUrgentFix,
  forceIPLocationForMobile,
  forceRedirectOAuthForMobile,
  showUrgentMobileWarning,
  testMobileFunctionality,
  getMobileDeviceInfo
} from '@/lib/mobile-urgent-fix';

export default function MobileUrgentFixPage() {
  const [mobileFix, setMobileFix] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Run immediate check on page load
    const fix = checkMobileUrgentFix();
    setMobileFix(fix);
    
    // Get device info
    const deviceInfo = getMobileDeviceInfo();
    console.log('📱 Mobile Device Info:', deviceInfo);
    console.log('🚨 Mobile Fix Status:', fix);
  }, []);

  const runFullTest = async () => {
    setIsTesting(true);
    try {
      const results = await testMobileFunctionality();
      setTestResults(results);
      console.log('🧪 Mobile Test Results:', results);
    } catch (error) {
      console.error('❌ Mobile test failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = () => {
    const report = `
🚨 MOBILE URGENT FIX REPORT
Generated: ${new Date().toISOString()}

${mobileFix ? showUrgentMobileWarning() : 'No mobile fix data available'}

${testResults ? `
TEST RESULTS:
${JSON.stringify(testResults, null, 2)}
` : ''}

DEVICE INFO:
${JSON.stringify(getMobileDeviceInfo(), null, 2)}
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-urgent-fix-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!mobileFix) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                Mobile Fix Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-lg font-medium mt-4">Analyzing Mobile Issues...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isCritical = mobileFix.errorMessage.includes('CRITICAL');
  const isWorking = mobileFix.canUseGeolocation && mobileFix.canUseOAuth;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Critical Warning Banner */}
        {isCritical && (
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">
              <strong>🚨 CRITICAL ISSUE DETECTED:</strong> Your mobile users cannot use geolocation or OAuth authentication. 
              This affects ALL mobile visitors to your site.
            </AlertDescription>
          </Alert>
        )}

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  {mobileFix.canUseGeolocation ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <p className="font-medium">Geolocation</p>
                <Badge variant={mobileFix.canUseGeolocation ? 'default' : 'destructive'}>
                  {mobileFix.canUseGeolocation ? 'Working' : 'Blocked'}
                </Badge>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  {mobileFix.canUseOAuth ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <p className="font-medium">OAuth Authentication</p>
                <Badge variant={mobileFix.canUseOAuth ? 'default' : 'destructive'}>
                  {mobileFix.canUseOAuth ? 'Working' : 'Blocked'}
                </Badge>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <Globe className="h-8 w-8 text-blue-600" />
                </div>
                <p className="font-medium">Fallback Method</p>
                <Badge variant="outline">
                  {mobileFix.fallbackMethod === 'ip' ? 'IP Location' : 'None'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issue Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Issue Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-lg mb-2">{mobileFix.errorMessage}</h4>
                <p className="text-gray-700">{mobileFix.solution}</p>
              </div>
              
              {isCritical && (
                <Alert className="border-red-300 bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Root Cause:</strong> Your website is running on HTTP instead of HTTPS. 
                    Mobile browsers require HTTPS for geolocation and OAuth to work properly.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Immediate Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Immediate Actions Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">🔒 Enable HTTPS (URGENT)</h4>
                <p className="text-yellow-700 mb-3">
                  This is the ONLY solution that will fix mobile functionality completely.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Option 1:</strong> Let's Encrypt (Free)</p>
                  <code className="bg-yellow-100 px-2 py-1 rounded text-xs">
                    certbot --nginx -d yourdomain.com
                  </code>
                  
                  <p><strong>Option 2:</strong> Hostinger SSL (Paid)</p>
                  <p><strong>Option 3:</strong> Cloudflare (Quick fix)</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📱 Temporary Mobile Fixes</h4>
                <p className="text-blue-700 mb-3">
                  These will provide limited functionality while you fix HTTPS:
                </p>
                <div className="space-y-2 text-sm">
                  <p>• IP-based location detection (working)</p>
                  <p>• Redirect-based OAuth (limited)</p>
                  <p>• Clear user warnings about limitations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Functionality Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={runFullTest} 
                  disabled={isTesting}
                  variant="outline"
                >
                  {isTesting ? 'Testing...' : 'Run Full Test'}
                </Button>
                
                <Button onClick={downloadReport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>

              {testResults && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Test Results:</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Geolocation:</strong> {testResults.geolocationTest}</p>
                    <p><strong>OAuth:</strong> {testResults.oauthTest}</p>
                    {testResults.recommendations.length > 0 && (
                      <div>
                        <strong>Recommendations:</strong>
                        <ul className="ml-4 list-disc">
                          {testResults.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Technical Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs">
                  {showUrgentMobileWarning()}
                </pre>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => copyToClipboard(showUrgentMobileWarning())}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Report'}
                </Button>
                
                <Button 
                  onClick={() => window.open('/auth/debug-mobile', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Full Debug Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Enable HTTPS immediately</p>
                  <p className="text-sm text-gray-600">This is critical for mobile functionality</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Test mobile functionality</p>
                  <p className="text-sm text-gray-600">Verify geolocation and OAuth work on mobile</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Monitor mobile user experience</p>
                  <p className="text-sm text-gray-600">Check for any remaining issues</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
