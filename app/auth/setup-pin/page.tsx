"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function SetupPinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinStatus, setPinStatus] = useState<'idle' | 'checking' | 'needed' | 'complete'>('idle');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    // Check if user needs PIN setup
    checkPinSetup();
  }, [status, session]);

  const checkPinSetup = async () => {
    try {
      const response = await fetch('/api/auth/setup-pin');
      const data = await response.json();

      if (data.success) {
        if (data.needsPinSetup) {
          setPinStatus('needed');
        } else if (data.hasPin) {
          setPinStatus('complete');
        } else {
          setPinStatus('idle');
        }
      }
    } catch (_error) {
      console.error('Error checking PIN setup:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/setup-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin, confirmPin }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success!',
          description: 'Security PIN has been set up successfully.',
        });
        
        setPinStatus('complete');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to set up PIN');
      }
    } catch (_error) {
      setError('An error occurred while setting up your PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePin = (pinValue: string) => {
    if (pinValue.length < 4) return 'PIN must be at least 4 digits';
    if (pinValue.length > 6) return 'PIN must be no more than 6 digits';
    if (!/^\d+$/.test(pinValue)) return 'PIN must contain only numbers';
    if (/(.)\1{2,}/.test(pinValue)) return 'PIN cannot have 3 or more repeated digits';
    if (/123|234|345|456|567|678|789|012/.test(pinValue)) return 'PIN cannot be a sequential pattern';
    if (/0000|1111|2222|3333|4444|5555|6666|7777|8888|9999/.test(pinValue)) return 'PIN cannot be all the same digit';
    return '';
  };

  const handlePinChange = (value: string, field: 'pin' | 'confirmPin') => {
    const validationError = validatePin(value);
    
    if (field === 'pin') {
      setPin(value);
      if (validationError) {
        setError(validationError);
      } else {
        setError('');
      }
    } else {
      setConfirmPin(value);
      if (value !== pin) {
        setError('PINs do not match');
      } else {
        setError('');
      }
    }
  };

  if (status === 'loading' || pinStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your account...</p>
        </div>
      </div>
    );
  }

  if (pinStatus === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">PIN Already Set!</CardTitle>
            <CardDescription>
              Your security PIN is already configured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pinStatus !== 'needed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Set Up Security PIN</CardTitle>
          <CardDescription>
            Welcome! To secure your account, please set up a 4-6 digit security PIN.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  Security PIN
                </label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter 4-6 digit PIN"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value, 'pin')}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a PIN that's easy to remember but hard to guess
                </p>
              </div>

              <div>
                <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm PIN
                </label>
                <Input
                  id="confirmPin"
                  type="password"
                  placeholder="Confirm your PIN"
                  value={confirmPin}
                  onChange={(e) => handlePinChange(e.target.value, 'confirmPin')}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <Lock className="h-5 w-5 text-blue-400 mr-2" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Security Note:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Your PIN is encrypted and never stored in plain text</li>
                    <li>• This PIN will be required for future sign-ins</li>
                    <li>• You can change it later in your account settings</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !pin || !confirmPin || pin !== confirmPin || !!error}
              className="w-full"
            >
              {isLoading ? 'Setting up PIN...' : 'Set Up Security PIN'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="text-sm"
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
