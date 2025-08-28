'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function GoogleCSETest() {
  const [testResults, setTestResults] = React.useState<{
    scriptLoaded: boolean;
    cseAvailable: boolean;
    environmentSet: boolean;
    overallStatus: 'loading' | 'success' | 'error' | 'partial';
  }>({
    scriptLoaded: false,
    cseAvailable: false,
    environmentSet: false,
    overallStatus: 'loading'
  });

  React.useEffect(() => {
    const runTests = async () => {
      const results = {
        scriptLoaded: false,
        cseAvailable: false,
        environmentSet: false,
        overallStatus: 'loading' as const
      };

      // Test 1: Check if environment variable is set
      results.environmentSet = !!(process.env.NEXT_PUBLIC_GOOGLE_CSE_ID);

      // Test 2: Check if Google CSE script is loaded
      const scriptElement = document.querySelector('script[src*="cse.google.com"]');
      results.scriptLoaded = !!scriptElement;

      // Test 3: Check if Google CSE API is available
      results.cseAvailable = !!(window.google?.search?.cse?.element);

      // Determine overall status
      if (results.environmentSet && results.scriptLoaded && results.cseAvailable) {
        results.overallStatus = 'success';
      } else if (results.environmentSet && (results.scriptLoaded || results.cseAvailable)) {
        results.overallStatus = 'partial';
      } else if (!results.environmentSet) {
        results.overallStatus = 'error';
      } else {
        results.overallStatus = 'partial';
      }

      setTestResults(results);
    };

    // Run tests after a short delay to allow scripts to load
    const timer = setTimeout(runTests, 2000);
    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (status: 'loading' | 'success' | 'error' | 'partial') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusText = (status: 'loading' | 'success' | 'error' | 'partial') => {
    switch (status) {
      case 'success':
        return 'All systems operational';
      case 'error':
        return 'Configuration required';
      case 'partial':
        return 'Partially working';
      default:
        return 'Testing...';
    }
  };

  const getStatusColor = (status: 'loading' | 'success' | 'error' | 'partial') => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Google CSE Integration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className={`p-4 rounded-lg border ${getStatusColor(testResults.overallStatus)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(testResults.overallStatus)}
            <div>
              <h3 className="font-semibold">Overall Status</h3>
              <p className="text-sm opacity-90">{getStatusText(testResults.overallStatus)}</p>
            </div>
          </div>
        </div>

        {/* Individual Tests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Environment Variable</span>
            <Badge variant={testResults.environmentSet ? 'default' : 'destructive'}>
              {testResults.environmentSet ? 'Set' : 'Missing'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Script Loaded</span>
            <Badge variant={testResults.scriptLoaded ? 'default' : 'secondary'}>
              {testResults.scriptLoaded ? 'Loaded' : 'Not Loaded'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">CSE API Available</span>
            <Badge variant={testResults.cseAvailable ? 'default' : 'secondary'}>
              {testResults.cseAvailable ? 'Available' : 'Not Available'}
            </Badge>
          </div>
        </div>

        {/* Environment Variable Display */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Environment Variable Check:</h4>
          <code className="text-sm bg-gray-100 p-2 rounded block">
            NEXT_PUBLIC_GOOGLE_CSE_ID: {process.env.NEXT_PUBLIC_GOOGLE_CSE_ID || 'undefined'}
          </code>
        </div>

        {/* Instructions */}
        {testResults.overallStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Setup Required:</h4>
            <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
              <li>Add NEXT_PUBLIC_GOOGLE_CSE_ID to your .env.local file</li>
              <li>Get your CSE ID from Google Programmable Search Engine</li>
              <li>Restart your development server</li>
            </ol>
          </div>
        )}

        {/* Test Button */}
        <Button 
          onClick={() => window.location.reload()} 
          className="w-full"
          variant="outline"
        >
          Re-run Tests
        </Button>
      </CardContent>
    </Card>
  );
}
