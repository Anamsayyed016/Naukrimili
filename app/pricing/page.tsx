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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to create order');
      }

      const { orderId, amount, keyId } = await response.json();

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

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
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const result = await verifyResponse.json();

            if (verifyResponse.ok) {
              toast.success('Payment successful! Plan activated.');
              router.push('/dashboard/jobseeker?tab=resumes');
            } else {
              throw new Error(result.error || 'Payment verification failed');
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed');
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
            setLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to create subscription');
      }

      const { subscriptionId, planId, amount, keyId } = await response.json();

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

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

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to initiate subscription');
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
        onLoad={() => {
          setRazorpayLoaded(true);
          setRazorpayLoadError(null);
        }}
        onError={() => {
          setRazorpayLoaded(false);
          setRazorpayLoadError('Failed to load Razorpay Checkout. Please disable ad-blocker/VPN or try another network/browser.');
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

