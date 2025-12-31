'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, Building2 } from 'lucide-react';
import Script from 'next/script';
import { toast } from 'sonner';

// Plan configurations (matching backend)
const INDIVIDUAL_PLANS = [
  {
    key: 'starter_premium',
    name: 'Starter Premium',
    price: 99,
    validity: '3 Days',
    features: {
      resumeDownloads: 5,
      templateAccess: 'Premium Templates',
      aiResumeUsage: 3,
      aiCoverLetterUsage: 2,
      atsOptimization: true,
      pdfDownloads: 5,
      docxDownloads: 5,
    },
    popular: false,
  },
  {
    key: 'professional_plus',
    name: 'Professional Plus',
    price: 399,
    validity: '7 Days',
    features: {
      resumeDownloads: 15,
      templateAccess: 'Premium Templates',
      aiResumeUsage: 10,
      aiCoverLetterUsage: 5,
      atsOptimization: true,
      pdfDownloads: 15,
      docxDownloads: 15,
    },
    popular: false,
  },
  {
    key: 'best_value',
    name: 'Best Value Plan',
    price: 999,
    validity: '30 Days',
    features: {
      resumeDownloads: 100,
      templateAccess: 'All Templates',
      aiResumeUsage: 50,
      aiCoverLetterUsage: 25,
      atsOptimization: true,
      pdfDownloads: 100,
      docxDownloads: 100,
    },
    popular: true,
  },
];

const BUSINESS_PLANS = [
  {
    key: 'business_partner',
    name: 'Business Partner',
    price: 4999,
    validity: '6 Months',
    features: {
      resumeCredits: 500,
      whiteLabelBranding: true,
      clientDashboard: true,
      prioritySupport: true,
    },
  },
  {
    key: 'business_partner_pro',
    name: 'Business Partner Pro',
    price: 8999,
    validity: '1 Year',
    features: {
      resumeCredits: 1200,
      whiteLabelBranding: true,
      clientDashboard: true,
      prioritySupport: true,
    },
  },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayLoadError, setRazorpayLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'individual' | 'business'>('individual');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/pricing');
    }
  }, [status, router]);

  const handleIndividualPlan = async (planKey: string) => {
    if (!session?.user) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    setLoading(planKey);
    try {
      // Create order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      });

      let data;
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: `Server error (${response.status})` };
        }
        
        // Extract error message properly
        const errorMsg = typeof errorData === 'string' 
          ? errorData 
          : errorData?.details || errorData?.error || errorData?.message || 'Failed to create order';
        
        console.error('Create order error:', { 
          status: response.status, 
          error: errorData,
          errorMessage: errorMsg 
        });
        throw new Error(errorMsg);
      } else {
        data = await response.json();
      }
      const { orderId, amount, keyId } = data;

      if (!keyId) {
        console.error('Missing keyId in response:', data);
        throw new Error('Payment gateway not configured. Please contact support.');
      }

      if (!window.Razorpay) {
        console.error('Razorpay SDK not available. Current state:', {
          razorpayLoaded,
          razorpayLoadError,
          windowRazorpay: typeof window.Razorpay,
          scriptLoaded: document.querySelector('script[src*="checkout.razorpay.com"]') !== null
        });
        throw new Error('Razorpay SDK not loaded. Please disable ad-blockers or VPN and refresh.');
      }

      console.log('Opening Razorpay checkout with:', {
        keyId,
        orderId,
        amount,
        hasRazorpay: !!window.Razorpay
      });

      // Open Razorpay checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: 'INR',
        name: 'Naukrimili Resume Builder',
        description: `Resume Builder Plan`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            console.log('📥 [Payment Handler] Razorpay response received:', {
              hasOrderId: !!response.razorpay_order_id,
              hasPaymentId: !!response.razorpay_payment_id,
              hasSignature: !!response.razorpay_signature,
            });

            // Validate response has all required fields
            if (!response.razorpay_order_id || !response.razorpay_payment_id || !response.razorpay_signature) {
              console.error('❌ [Payment Handler] Missing payment details in response:', response);
              throw new Error('Invalid payment response from gateway');
            }

            // Verify payment
            console.log('🔄 [Payment Handler] Verifying payment...');
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            console.log('📥 [Payment Handler] Verify response status:', verifyResponse.status);

            // Check if response is ok before parsing JSON
            let result;
            try {
              result = await verifyResponse.json();
            } catch (parseError) {
              console.error('❌ [Payment Handler] Failed to parse verify response:', parseError);
              throw new Error('Invalid response from payment verification server');
            }

            console.log('📥 [Payment Handler] Verify response data:', {
              success: result.success,
              hasError: !!result.error,
              message: result.message,
            });

            if (verifyResponse.ok && result.success) {
              console.log('✅ [Payment Handler] Payment verified successfully');
              toast.success('Payment successful! Plan activated.');
              router.push('/dashboard/jobseeker?tab=resumes');
            } else {
              const errorMsg = result.error || result.details || result.message || 'Payment verification failed';
              console.error('❌ [Payment Handler] Payment verification failed:', {
                status: verifyResponse.status,
                error: errorMsg,
                result,
              });
              throw new Error(errorMsg);
            }
          } catch (error: any) {
            // Extract error message properly
            let errorMessage = 'Payment verification failed';
            
            if (typeof error === 'string') {
              errorMessage = error;
            } else if (error?.message) {
              errorMessage = error.message;
            } else if (error?.details) {
              errorMessage = error.details;
            } else if (error?.error) {
              errorMessage = error.error;
            }
            
            console.error('❌ [Payment Handler] Payment verification error:', {
              error,
              errorMessage,
              errorType: typeof error,
              stack: error?.stack,
            });
            
            toast.error(errorMessage || 'Payment verification failed. Please contact support if payment was deducted.');
          } finally {
            setLoading(null);
          }
        },
        prefill: {
          name: session.user?.name || '',
          email: session.user?.email || '',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function() {
            console.log('⚠️ [Payment Handler] Payment modal dismissed');
            setLoading(null);
          },
        },
        // Handle payment errors
        handler_error: function(error: any) {
          console.error('❌ [Payment Handler] Razorpay error:', error);
          setLoading(null);
          let errorMessage = 'Payment failed';
          
          if (error?.error) {
            if (error.error.code === 'BAD_REQUEST_ERROR') {
              errorMessage = error.error.description || 'Invalid payment request';
            } else if (error.error.code === 'GATEWAY_ERROR') {
              errorMessage = 'Payment gateway error. Please try again.';
            } else if (error.error.code === 'NETWORK_ERROR') {
              errorMessage = 'Network error. Please check your connection.';
            } else {
              errorMessage = error.error.description || error.error.reason || 'Payment failed';
            }
          } else if (error?.message) {
            errorMessage = error.message;
          }
          
          toast.error(errorMessage);
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      // Extract error message properly
      let errorMessage = 'Failed to initiate payment';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error) {
        // Try to stringify if it's an object
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = String(error);
        }
      }
      
      console.error('Payment error:', {
        error,
        errorMessage,
        errorType: typeof error,
        hasMessage: !!error?.message
      });
      
      toast.error(errorMessage);
      setLoading(null);
    }
  };

  const handleBusinessPlan = async (planKey: string) => {
    if (!session?.user) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    setLoading(planKey);
    try {
      // Create subscription
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      });

      let data;
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: `Server error (${response.status})` };
        }
        
        // Extract error message properly
        const errorMsg = typeof errorData === 'string' 
          ? errorData 
          : errorData?.details || errorData?.error || errorData?.message || 'Failed to create subscription';
        
        console.error('Create subscription error:', { 
          status: response.status, 
          error: errorData,
          errorMessage: errorMsg 
        });
        throw new Error(errorMsg);
      } else {
        data = await response.json();
      }
      const { subscriptionId, planId, amount, keyId } = data;

      if (!keyId) {
        console.error('Missing keyId in response:', data);
        throw new Error('Payment gateway not configured. Please contact support.');
      }

      if (!window.Razorpay) {
        console.error('Razorpay SDK not available. Current state:', {
          razorpayLoaded,
          razorpayLoadError,
          windowRazorpay: typeof window.Razorpay,
          scriptLoaded: document.querySelector('script[src*="checkout.razorpay.com"]') !== null
        });
        throw new Error('Razorpay SDK not loaded. Please disable ad-blockers or VPN and refresh.');
      }

      console.log('Opening Razorpay subscription checkout with:', {
        keyId,
        subscriptionId,
        planId,
        amount,
        hasRazorpay: !!window.Razorpay
      });

      // Open Razorpay checkout for subscription
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: 'Naukrimili Resume Builder',
        description: `Business Plan Subscription`,
        prefill: {
          name: session.user?.name || '',
          email: session.user?.email || '',
        },
        theme: {
          color: '#6366f1',
        },
        handler: async function (response: any) {
          toast.success('Subscription activated!');
          router.push('/dashboard/jobseeker?tab=resumes');
          setLoading(null);
        },
        modal: {
          ondismiss: function() {
            setLoading(null);
          },
        },
      };

      try {
        const razorpay = new window.Razorpay(options);
        console.log('Razorpay subscription instance created, opening checkout...');
        razorpay.open();
        console.log('Razorpay subscription checkout opened successfully');
      } catch (razorpayError: any) {
        console.error('Error creating/opening Razorpay subscription checkout:', razorpayError);
        throw new Error(razorpayError?.message || 'Failed to open payment gateway. Please try again.');
      }
    } catch (error: any) {
      // Extract error message properly
      let errorMessage = 'Failed to initiate subscription';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error) {
        // Try to stringify if it's an object
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = String(error);
        }
      }
      
      console.error('Subscription error:', {
        error,
        errorMessage,
        errorType: typeof error,
        hasMessage: !!error?.message
      });
      
      toast.error(errorMessage);
      setLoading(null);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('✅ Razorpay SDK script loaded');
          if (typeof window !== 'undefined' && window.Razorpay) {
            console.log('✅ Razorpay SDK available on window');
            setRazorpayLoaded(true);
            setRazorpayLoadError(null);
          } else {
            console.warn('⚠️ Razorpay script loaded but window.Razorpay not available yet');
            // Wait a bit for Razorpay to initialize
            setTimeout(() => {
              if (window.Razorpay) {
                console.log('✅ Razorpay SDK available after delay');
                setRazorpayLoaded(true);
                setRazorpayLoadError(null);
              } else {
                console.error('❌ Razorpay SDK still not available after delay');
                setRazorpayLoaded(false);
                setRazorpayLoadError('Razorpay SDK loaded but not initialized. Please refresh the page.');
              }
            }, 500);
          }
        }}
        onError={(e) => {
          console.error('❌ Failed to load Razorpay SDK:', e);
          setRazorpayLoaded(false);
          setRazorpayLoadError('Failed to load Razorpay Checkout. Please disable ad-blocker/VPN or try another network/browser.');
        }}
        onReady={() => {
          // Double-check Razorpay is available after script is ready
          if (typeof window !== 'undefined' && window.Razorpay) {
            console.log('✅ Razorpay SDK ready and available');
            setRazorpayLoaded(true);
          }
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {!razorpayLoaded && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <div className="font-medium">Payment system is loading…</div>
              <div className="text-sm opacity-90">
                {razorpayLoadError || 'If this takes long, refresh the page. Ad blockers can block Razorpay.'}
              </div>
            </div>
          )}
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unlock premium features and build professional resumes with AI-powered tools
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setActiveTab('individual')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'individual'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Individual Plans
              </button>
              <button
                onClick={() => setActiveTab('business')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'business'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Business Plans
              </button>
            </div>
          </div>

          {/* Individual Plans */}
          {activeTab === 'individual' && (
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {INDIVIDUAL_PLANS.map((plan) => (
                <Card
                  key={plan.key}
                  className={`relative ${
                    plan.popular
                      ? 'border-2 border-indigo-600 shadow-xl scale-105'
                      : 'border border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-indigo-600 text-white px-4 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        Best Value
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.validity} Access</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">₹{plan.price}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{plan.features.resumeDownloads} Resume Downloads</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{plan.features.templateAccess}</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{plan.features.aiResumeUsage} AI Resume Uses</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{plan.features.aiCoverLetterUsage} AI Cover Letter Uses</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>ATS Optimization</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{plan.features.pdfDownloads} PDF Downloads</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{plan.features.docxDownloads} DOCX Downloads</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleIndividualPlan(plan.key)}
                      disabled={loading !== null || !razorpayLoaded}
                    >
                      {loading === plan.key ? 'Processing...' : `Buy Now - ₹${plan.price}`}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Business Plans */}
          {activeTab === 'business' && (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {BUSINESS_PLANS.map((plan) => (
                <Card key={plan.key} className="border-2 border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <CardDescription>{plan.validity} Subscription</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">₹{plan.price}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{plan.features.resumeCredits} Resume Credits</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>White-Label Branding</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Client Dashboard</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Priority Support</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      size="lg"
                      variant="outline"
                      onClick={() => handleBusinessPlan(plan.key)}
                      disabled={loading !== null || !razorpayLoaded}
                    >
                      {loading === plan.key ? 'Processing...' : `Subscribe - ₹${plan.price}`}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

