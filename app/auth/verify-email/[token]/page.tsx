"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type VerificationState = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = params.token as string;
      
      if (!token) {
        setState('error');
        setMessage('Invalid verification link. Please check the URL.');
        return;
      }

      try {
        console.log('🔍 Verifying email with token...');
        
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (data.success) {
          console.log('✅ Email verified successfully');
          setState('success');
          setMessage(data.message || 'Email verified successfully!');
          setEmail(data.data?.email || '');
          
          // Start countdown for auto-redirect
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                router.push('/auth/signin');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
        } else {
          console.log('❌ Email verification failed:', data.error);
          setState('error');
          setMessage(data.message || data.error || 'Verification failed');
        }
        
      } catch (error) {
        console.error('❌ Verification error:', error);
        setState('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [params.token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-6 pt-8 px-6">
            {state === 'loading' && (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            
            {state === 'success' && (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            )}
            
            {state === 'error' && (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-pink-600">
                <XCircle className="h-8 w-8 text-white" />
              </div>
            )}
            
            <CardTitle className="text-3xl font-bold font-heading text-gray-900 mb-2">
              {state === 'loading' && 'Verifying Your Email'}
              {state === 'success' && 'Email Verified!'}
              {state === 'error' && 'Verification Failed'}
            </CardTitle>
            
            <CardDescription className="text-gray-600 text-base">
              {state === 'loading' && 'Please wait while we verify your email address...'}
              {state === 'success' && 'Your email has been successfully verified'}
              {state === 'error' && 'We couldn\'t verify your email address'}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8 space-y-6">
            {state === 'success' && (
              <>
                {email && (
                  <Alert className="border-green-200 bg-green-50">
                    <Mail className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>{email}</strong> has been verified successfully!
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    You can now sign in to your account and access all features.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Redirecting to sign in page in <strong className="text-xl">{countdown}</strong> seconds...
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => router.push('/auth/signin')}
                    className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                  >
                    Sign In Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {state === 'error' && (
              <>
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {message}
                  </AlertDescription>
                </Alert>
                
                <div className="text-center space-y-4">
                  <p className="text-gray-600 text-sm">
                    Common reasons for verification failure:
                  </p>
                  <ul className="text-left text-sm text-gray-600 space-y-2 bg-gray-50 p-4 rounded-lg">
                    <li>• Link has expired (valid for 24 hours)</li>
                    <li>• Link has already been used</li>
                    <li>• Email has already been verified</li>
                  </ul>
                  
                  <div className="space-y-3 pt-4">
                    <Button 
                      onClick={() => router.push('/auth/signin')}
                      className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Go to Sign In
                    </Button>
                    
                    <Link 
                      href="/auth/register/employer"
                      className="block w-full text-center py-3 text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Register Again
                    </Link>
                  </div>
                </div>
              </>
            )}

            {state === 'loading' && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Verifying your email address...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 space-y-4">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-blue-600 hover:underline transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-blue-600 hover:underline transition-colors">
              Privacy Policy
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            © 2024 NaukriMili. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

