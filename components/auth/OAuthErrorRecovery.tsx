'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Smartphone, Monitor, Globe } from 'lucide-react';

interface OAuthErrorRecoveryProps {
  error?: string;
}

export default function OAuthErrorRecovery({ error }: OAuthErrorRecoveryProps) {
  const searchParams = useSearchParams();
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isSafari: false,
    isEdge: false,
    userAgent: ''
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setDeviceInfo({
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isSafari: /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent),
      isEdge: /Edg/i.test(userAgent),
      userAgent: userAgent.substring(0, 100)
    });
  }, []);

  const getErrorRecommendations = () => {
    const recommendations = [];
    
    if (deviceInfo.isMobile) {
      recommendations.push('Mobile browsers require HTTPS for OAuth');
      recommendations.push('Try using Chrome or Firefox on mobile');
    }
    
    if (deviceInfo.isSafari) {
      recommendations.push('Safari has strict OAuth policies');
      recommendations.push('Try using Chrome or Firefox');
    }
    
    if (deviceInfo.isEdge) {
      recommendations.push('Edge browser may block OAuth popups');
      recommendations.push('Try using Chrome or Firefox');
    }
    
    if (error === 'OAuthAccountNotLinked') {
      recommendations.push('This email is already registered with a different account');
      recommendations.push('Try signing in with your existing account');
    }
    
    return recommendations;
  };

  const handleRetry = () => {
    window.location.href = '/auth/signin';
  };

  const handleAlternativeAuth = () => {
    window.location.href = '/auth/signin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600">OAuth Issue Detected</CardTitle>
          <CardDescription>
            We've detected a potential OAuth issue. Here are some solutions:
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {deviceInfo.isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              <span>
                {deviceInfo.isMobile ? 'Mobile Device' : 'Desktop Device'} 
                {deviceInfo.isSafari && ' (Safari)'}
                {deviceInfo.isEdge && ' (Edge)'}
              </span>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>Recommendations:</strong>
              <ul className="mt-2 space-y-1">
                {getErrorRecommendations().map((rec, index) => (
                  <li key={index} className="text-sm">• {rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              onClick={handleRetry}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try OAuth Again
            </Button>

            <Button
              onClick={handleAlternativeAuth}
              className="w-full"
              variant="outline"
            >
              Use Email/Password Instead
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>Device: {deviceInfo.userAgent}</p>
            <p>Error: {error || 'Unknown'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
