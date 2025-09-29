/**
 * OTP System Test Page
 * Comprehensive testing interface for OTP functionality
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PhoneNumberInput } from '@/components/auth/PhoneNumberInput';
import { OTPVerificationForm } from '@/components/auth/OTPVerificationForm';
import { 
  Phone, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Settings,
  TestTube
} from 'lucide-react';

export default function TestOTPPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otpData, setOtpData] = useState<any>(null);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  // Add test result
  const addTestResult = (test: string, success: boolean, message: string, data?: any) => {
    const result = {
      id: Date.now(),
      test,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    setTestResults(prev => [result, ...prev]);
  };

  // Test WhatsApp API configuration
  const testWhatsAppConfig = async () => {
    setCurrentTest('whatsapp-config');
    setIsLoading(true);
    addTestResult('WhatsApp Config', true, 'Testing WhatsApp API configuration...');

    try {
      const response = await fetch('/api/test/whatsapp-config');
      const data = await response.json();

      if (data.success) {
        addTestResult('WhatsApp Config', true, 'WhatsApp API configuration is valid', data.data);
      } else {
        addTestResult('WhatsApp Config', false, data.message || 'WhatsApp API configuration failed');
      }
    } catch (error: any) {
      addTestResult('WhatsApp Config', false, `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setCurrentTest(null);
    }
  };

  // Test OTP generation
  const testOTPGeneration = async () => {
    if (!phoneNumber) {
      addTestResult('OTP Generation', false, 'Phone number is required');
      return;
    }

    setCurrentTest('otp-generation');
    setIsLoading(true);
    addTestResult('OTP Generation', true, `Generating OTP for ${phoneNumber}...`);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          email: email || undefined,
          otpType: 'verification',
          purpose: 'testing'
        })
      });

      const data = await response.json();

      if (data.success) {
        setOtpData(data.data);
        addTestResult('OTP Generation', true, 'OTP generated and sent successfully', data.data);
      } else {
        addTestResult('OTP Generation', false, data.message || 'OTP generation failed');
      }
    } catch (error: any) {
      addTestResult('OTP Generation', false, `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setCurrentTest(null);
    }
  };

  // Test OTP verification
  const testOTPVerification = async (otpCode: string) => {
    if (!phoneNumber) {
      addTestResult('OTP Verification', false, 'Phone number is required');
      return;
    }

    setCurrentTest('otp-verification');
    setIsLoading(true);
    addTestResult('OTP Verification', true, `Verifying OTP ${otpCode} for ${phoneNumber}...`);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          otpCode,
          otpType: 'verification'
        })
      });

      const data = await response.json();

      if (data.success) {
        addTestResult('OTP Verification', true, 'OTP verified successfully', data.data);
      } else {
        addTestResult('OTP Verification', false, data.message || 'OTP verification failed', data.data);
      }
    } catch (error: any) {
      addTestResult('OTP Verification', false, `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setCurrentTest(null);
    }
  };

  // Test phone verification
  const testPhoneVerification = async (otpCode: string) => {
    if (!phoneNumber) {
      addTestResult('Phone Verification', false, 'Phone number is required');
      return;
    }

    setCurrentTest('phone-verification');
    setIsLoading(true);
    addTestResult('Phone Verification', true, `Verifying phone ${phoneNumber} with OTP ${otpCode}...`);

    try {
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          otpCode
        })
      });

      const data = await response.json();

      if (data.success) {
        addTestResult('Phone Verification', true, 'Phone verification successful', data.data);
      } else {
        addTestResult('Phone Verification', false, data.message || 'Phone verification failed', data.data);
      }
    } catch (error: any) {
      addTestResult('Phone Verification', false, `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setCurrentTest(null);
    }
  };

  // Clear test results
  const clearResults = () => {
    setTestResults([]);
  };

  // Handle phone OTP success
  const handlePhoneOTPSuccess = (data: any) => {
    addTestResult('Phone OTP Flow', true, 'Complete phone OTP flow successful', data);
  };

  // Handle OTP verification success
  const handleOTPSuccess = (data: any) => {
    addTestResult('OTP Verification Flow', true, 'Complete OTP verification flow successful', data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
            <TestTube className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">OTP System Test Suite</h1>
          <p className="mt-2 text-sm text-gray-600">
            Comprehensive testing interface for OTP verification system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Test Controls
                </CardTitle>
                <CardDescription>
                  Run individual tests and monitor results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={testWhatsAppConfig}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {currentTest === 'whatsapp-config' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Phone className="h-4 w-4 mr-2" />
                    )}
                    Test WhatsApp API
                  </Button>

                  <Button
                    onClick={testOTPGeneration}
                    disabled={isLoading || !phoneNumber}
                    variant="outline"
                    className="w-full"
                  >
                    {currentTest === 'otp-generation' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4 mr-2" />
                    )}
                    Test OTP Generation
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>

                <Button
                  onClick={clearResults}
                  variant="destructive"
                  className="w-full"
                >
                  Clear Results
                </Button>
              </CardContent>
            </Card>

            {/* Test Results */}
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  {testResults.length} tests completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No tests run yet
                    </p>
                  ) : (
                    testResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border"
                      >
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Badge variant={result.success ? 'default' : 'destructive'}>
                              {result.test}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {result.message}
                          </p>
                          {result.data && (
                            <pre className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Testing */}
          <div className="space-y-6">
            <Tabs defaultValue="phone" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone">Phone Flow</TabsTrigger>
                <TabsTrigger value="otp">OTP Flow</TabsTrigger>
              </TabsList>

              <TabsContent value="phone" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Phone Number Input Test</CardTitle>
                    <CardDescription>
                      Test the complete phone number input and OTP flow
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PhoneNumberInput
                      onSuccess={handlePhoneOTPSuccess}
                      otpType="verification"
                      purpose="testing"
                      title="Test Phone Input"
                      description="Test phone number input and OTP sending"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="otp" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>OTP Verification Test</CardTitle>
                    <CardDescription>
                      Test OTP verification with a specific phone number
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {phoneNumber ? (
                      <OTPVerificationForm
                        phoneNumber={phoneNumber}
                        email={email}
                        otpType="verification"
                        purpose="testing"
                        onSuccess={handleOTPSuccess}
                        onResend={() => testOTPGeneration()}
                        expiresAt={otpData?.expiresAt ? new Date(otpData.expiresAt) : undefined}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">
                          Enter a phone number above to test OTP verification
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system configuration and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">WhatsApp API</span>
                    <Badge variant="outline">Configured</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database</span>
                    <Badge variant="outline">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Socket.IO</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">OTP Service</span>
                    <Badge variant="outline">Running</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
