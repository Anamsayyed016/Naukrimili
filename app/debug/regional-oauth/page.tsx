'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Globe, Smartphone, Monitor, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface RegionalOAuthDebug {
  timestamp: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  isMobile: boolean;
  browser: string;
  oauthFlow: 'popup' | 'redirect';
  timezone: string;
}

interface OAuthIssue {
  type: 'DNS' | 'NETWORK' | 'BROWSER' | 'GEOGRAPHIC' | 'CONFIGURATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  solution: string;
}

export default function RegionalOAuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<RegionalOAuthDebug | null>(null);
  const [issues, setIssues] = useState<OAuthIssue[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeRegionalOAuth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/regional-oauth');
      const data = await response.json();
      
      if (data.success) {
        setDebugInfo(data.debug);
        setIssues(data.issues);
        setRecommendations(data.recommendations);
      } else {
        setError(data.error || 'Failed to analyze regional OAuth');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const testOAuthFromRegion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/regional-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          ip: 'test-ip',
          country: debugInfo?.country || 'unknown',
          region: debugInfo?.region || 'unknown',
          success: false,
          error: 'Test OAuth attempt'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Regional OAuth test logged:', data.debug);
        alert('Regional OAuth test logged successfully!');
      } else {
        setError(data.error || 'Failed to log regional OAuth test');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'GEOGRAPHIC': return <Globe className="h-4 w-4" />;
      case 'BROWSER': return <Monitor className="h-4 w-4" />;
      case 'NETWORK': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    analyzeRegionalOAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Regional OAuth Debug Tool</h1>
          <p className="text-gray-600">Analyze OAuth issues by region, device, and browser</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Debug Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Regional Information</span>
              </CardTitle>
              <CardDescription>
                Current location and device information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {debugInfo ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Country</label>
                      <p className="text-lg font-semibold">{debugInfo.country}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Region</label>
                      <p className="text-lg font-semibold">{debugInfo.region}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">City</label>
                      <p className="text-lg font-semibold">{debugInfo.city}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">IP</label>
                      <p className="text-lg font-semibold font-mono text-sm">{debugInfo.ip}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      <Badge variant={debugInfo.isMobile ? "default" : "secondary"}>
                        {debugInfo.isMobile ? <Smartphone className="h-3 w-3 mr-1" /> : <Monitor className="h-3 w-3 mr-1" />}
                        {debugInfo.isMobile ? 'Mobile' : 'Desktop'}
                      </Badge>
                      <Badge variant="outline">{debugInfo.browser}</Badge>
                      <Badge variant="outline">{debugInfo.oauthFlow} flow</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No debug information available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issues and Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Issues & Recommendations</span>
              </CardTitle>
              <CardDescription>
                Potential OAuth issues and solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issues.length > 0 ? (
                  <div className="space-y-3">
                    {issues.map((issue, index) => (
                      <Alert key={index} className="border-l-4 border-l-orange-500">
                        <div className="flex items-start space-x-2">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge className={getSeverityColor(issue.severity)}>
                                {issue.severity}
                              </Badge>
                              <Badge variant="outline">{issue.type}</Badge>
                            </div>
                            <p className="text-sm font-medium">{issue.description}</p>
                            <p className="text-xs text-gray-600 mt-1">{issue.solution}</p>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">No issues detected</p>
                  </div>
                )}

                {recommendations.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Recommendations:</h4>
                    <ul className="space-y-1">
                      {recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={analyzeRegionalOAuth}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span>Analyze Regional OAuth</span>
          </Button>

          <Button
            onClick={testOAuthFromRegion}
            disabled={loading || !debugInfo}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Test OAuth from Region</span>
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Tool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p><strong>1. Analyze Regional OAuth:</strong> Click the button to analyze your current location and device for OAuth compatibility.</p>
              <p><strong>2. Review Issues:</strong> Check the detected issues and recommendations for your region/device.</p>
              <p><strong>3. Test OAuth:</strong> Use the test button to simulate an OAuth attempt from your current location.</p>
              <p><strong>4. Check Logs:</strong> Review the server logs to see detailed OAuth debugging information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
