'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Template } from '@/lib/resume-builder/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Script from 'next/script';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import SectionOrderManager, { type SectionId } from '@/components/resume-builder/SectionOrderManager';
import { getDefaultSectionOrder } from '@/lib/resume-builder/section-reorder';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface FinalizeStepProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
  templateId: string;
  typeId: string;
  selectedColorId: string;
  template: Template | null;
  onSave?: () => void;
}

export default function FinalizeStep({
  formData,
  updateFormData,
  templateId,
  typeId,
  selectedColorId,
  template: _template,
  onSave,
}: FinalizeStepProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [atsScore, setAtsScore] = useState(0);
  const [exporting, setExporting] = useState<'pdf' | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState<'pdf' | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  // Section order state
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(() => {
    // Initialize from formData or use default
    if (Array.isArray(formData.sectionOrder) && formData.sectionOrder.length > 0) {
      return formData.sectionOrder as SectionId[];
    }
    return getDefaultSectionOrder();
  });

  // Individual plans for payment dialog
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
      },
      popular: true,
    },
  ];

  // Calculate ATS score
  useEffect(() => {
    const score = calculateATSScore(formData);
    setAtsScore(score);
  }, [formData]);

  const calculateATSScore = (data: Record<string, unknown>): number => {
    let score = 0;
    let maxScore = 100;

    // Personal Information (25 points)
    if (data.firstName || data.name) score += 5;
    if (data.email) score += 10;
    if (data.phone) score += 5;
    if (data.location) score += 5;

    // Professional Information (25 points)
    if (data.jobTitle || data.title) score += 10;
    if (data.summary || data.bio) score += 15;

    // Skills (15 points)
    if (Array.isArray(data.skills) && data.skills.length > 0) {
      score += Math.min(15, data.skills.length * 2);
    }

    // Experience (20 points)
    if (Array.isArray(data.experience) && data.experience.length > 0) {
      score += Math.min(20, data.experience.length * 5);
    }

    // Education (10 points)
    if (Array.isArray(data.education) && data.education.length > 0) {
      score += Math.min(10, data.education.length * 5);
    }

    // Additional Sections (5 points)
    if (Array.isArray(data.projects) && data.projects.length > 0) score += 2;
    if (Array.isArray(data.certifications) && data.certifications.length > 0) score += 2;
    if (Array.isArray(data.languages) && data.languages.length > 0) score += 1;

    return Math.min(Math.round(score), maxScore);
  };

  const getATSScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getATSScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getRecommendations = (score: number): string[] => {
    const recommendations: string[] = [];
    const data = formData;

    if (!data.firstName && !data.name) recommendations.push('Add your full name');
    if (!data.email) recommendations.push('Add your email address');
    if (!data.phone) recommendations.push('Add your phone number');
    if (!data.jobTitle && !data.title) recommendations.push('Add your professional title');
    if (!data.summary && !data.bio) recommendations.push('Add a professional summary');
    if (!Array.isArray(data.skills) || data.skills.length === 0) {
      recommendations.push('Add at least 3-5 key skills');
    }
    if (!Array.isArray(data.experience) || data.experience.length === 0) {
      recommendations.push('Add your work experience');
    }
    if (!Array.isArray(data.education) || data.education.length === 0) {
      recommendations.push('Add your education');
    }

    return recommendations;
  };

  const handleExport = async (format: 'pdf') => {
    setExporting(format);

    try {
      // Admin bypass: Admins can download without payment
      const isAdmin = session?.user?.role === 'admin';
      if (isAdmin) {
        console.log('🔑 [Export] Admin user detected - bypassing payment checks');
        // Skip all payment checks and proceed directly to export
      } else {
        // Check payment status FIRST before attempting download (skip for admins)
        console.log('🔍 [Export] Checking payment status...');
        try {
          const paymentStatusResponse = await fetch('/api/payments/status');
          if (paymentStatusResponse.ok) {
            const paymentStatus = await paymentStatusResponse.json();
            console.log('📊 [Export] Payment status:', paymentStatus);
            
            // Check if user has active plan
            if (!paymentStatus.isActive || !paymentStatus.planType) {
              console.log('💳 [Export] No active plan - showing payment dialog');
              setPendingExportFormat(format);
              setShowPaymentDialog(true);
              setExporting(null);
              return;
            }

            // For business plans, check if they have credits remaining
            if (paymentStatus.planType === 'business') {
              const creditsRemaining = paymentStatus.subscription?.creditsRemaining ?? 0;
              if (creditsRemaining <= 0) {
                console.log('💳 [Export] Business plan - no credits remaining - showing payment dialog');
                setPendingExportFormat(format);
                setShowPaymentDialog(true);
                setExporting(null);
                return;
              }
            } 
            // For individual plans, check PDF download credits
            else if (paymentStatus.planType === 'individual') {
              if (paymentStatus.credits?.pdfDownloads) {
                const pdfCredits = paymentStatus.credits.pdfDownloads;
                if (pdfCredits.remaining <= 0) {
                  console.log('💳 [Export] Individual plan - no PDF credits remaining - showing payment dialog');
                  setPendingExportFormat(format);
                  setShowPaymentDialog(true);
                  setExporting(null);
                  return;
                }
              }
            }
          } else {
            // If payment status API returns error, show payment dialog
            console.log('💳 [Export] Payment status check failed - showing payment dialog');
            setPendingExportFormat(format);
            setShowPaymentDialog(true);
            setExporting(null);
            return;
          }
        } catch (paymentCheckError) {
          console.warn('⚠️ [Export] Payment status check failed, showing payment dialog:', paymentCheckError);
          // Show payment dialog if check fails
          setPendingExportFormat(format);
          setShowPaymentDialog(true);
          setExporting(null);
          return;
        }
      }

      // Proceed with export - backend will also check payment (and bypass for admins)
      console.log('📄 [Export] Initiating download...');
      const response = await fetch(`/api/resume-builder/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          formData,
          selectedColorId,
        }),
      });

      // Check response status and content type
      const contentType = response.headers.get('content-type') || '';
      console.log('📊 [Export] Response status:', response.status, 'Content-Type:', contentType);

      if (!response.ok) {
        // Try to parse as JSON (backend returns JSON errors)
        let error: any = { error: 'Export failed' };
        try {
          const responseText = await response.text();
          try {
            error = JSON.parse(responseText);
          } catch {
            // If not JSON, treat as error text
            error = { error: responseText || 'Server returned an error' };
          }
        } catch (parseError) {
          console.error('❌ [Export] Failed to parse error response:', parseError);
        }
        
        // Check if payment is required (backend check)
        if (error.requiresPayment || response.status === 403) {
          console.log('💳 [Export] Backend requires payment - showing payment dialog', { 
            requiresPayment: error.requiresPayment, 
            status: response.status,
            error 
          });
          setPendingExportFormat(format);
          setShowPaymentDialog(true);
          setExporting(null);
          return;
        }
        
        // If server-side export failed and fallback is suggested, try client-side
        if (error.fallback && format === 'pdf') {
          console.log('📄 [Export] Server-side PDF export unavailable, using client-side fallback...');
          await handleClientSidePDFExport();
          return;
        }
        
        throw new Error(error.error || error.details || 'Export failed');
      }

      // Verify we received a PDF
      if (!contentType.includes('application/pdf')) {
        console.error('❌ [Export] Invalid content type received:', contentType);
        // Try to read as JSON to get error message
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || 'Invalid response from server');
        } catch (jsonError) {
          throw new Error('Server did not return a valid PDF. Please try again.');
        }
      }

      // Handle PDF download
      const blob = await response.blob();
      
      // Validate blob is not empty and appears to be a PDF
      if (blob.size === 0) {
        throw new Error('Received empty PDF file. Please try again.');
      }
      
      // Check if blob starts with PDF magic bytes (%PDF)
      const firstBytes = await blob.slice(0, 4).text();
      if (!firstBytes.startsWith('%PDF')) {
        console.error('❌ [Export] Blob does not appear to be a valid PDF');
        // Try to read as text to see error message
        const errorText = await blob.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.details || 'Invalid PDF received');
        } catch {
          throw new Error('Received invalid PDF file. Please try again.');
        }
      }
      
      console.log('✅ [Export] Valid PDF received, size:', blob.size, 'bytes');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${templateId}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export successful!',
        description: `Your resume has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error: unknown) {
      console.error(`Error exporting ${format}:`, error);
      
      // Try client-side PDF export as final fallback
      if (format === 'pdf') {
        console.log('📄 Attempting client-side PDF export fallback...');
        try {
          await handleClientSidePDFExport();
          return;
        } catch (fallbackError: unknown) {
          console.error('Client-side PDF export also failed:', fallbackError);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      toast({
        title: `Export failed`,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleClientSidePDFExport = async () => {
    try {
      // Use browser's print functionality for PDF export
      // This is the most reliable cross-browser method
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Please allow popups to export PDF');
      }

      // Get the current preview iframe content
      const previewFrame = document.querySelector('iframe[title*="preview" i], iframe') as HTMLIFrameElement;
      
      if (previewFrame && previewFrame.contentDocument) {
        const iframeDoc = previewFrame.contentDocument;
        const htmlContent = iframeDoc.documentElement.outerHTML;
        
        printWindow.document.write(htmlContent);
        
        // Add print-specific styles to ensure graphics/colors are preserved
        const printStyles = printWindow.document.createElement('style');
        printStyles.textContent = `
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              margin: 0;
              padding: 0;
            }
            
            /* CRITICAL: Maintain exact container dimensions */
            .resume-container {
              width: 794px !important; /* Fixed width to match screen preview */
              max-width: 794px !important;
              box-shadow: none !important;
              margin: 0 auto !important; /* Center on page */
              padding: 0 !important;
              page-break-inside: avoid;
            }
            
            /* CRITICAL: Preserve layout structure */
            .resume-wrapper {
              display: flex !important;
              min-height: auto !important;
              width: 100% !important;
              height: auto !important;
            }
            
            .sidebar {
              width: 280px !important;
              min-width: 280px !important;
              max-width: 280px !important;
              flex-shrink: 0 !important;
              flex-grow: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              page-break-inside: avoid;
            }
            
            .main-content {
              flex: 1 !important;
              flex-grow: 1 !important;
              flex-shrink: 1 !important;
              width: auto !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              page-break-inside: avoid;
            }
            
            /* Preserve all background colors and images - DO NOT reset */
            [style*="background"],
            [class*="bg-"],
            [class*="background"],
            .sidebar,
            .profile-image-wrapper,
            .profile-placeholder,
            .sidebar-section,
            .section-title,
            .psp-skill-bar-fill,
            .psp-language-bar-fill,
            .skill-progress,
            .language-progress {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Preserve borders and decorative elements */
            [style*="border"],
            [class*="border"] {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Ensure images are visible */
            img {
              display: block !important;
              max-width: 100% !important;
              height: auto !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Preserve SVG graphics */
            svg {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          
          @page {
            size: letter;
            margin: 0;
          }
          
          body {
            width: 100%;
            overflow: visible;
          }
        `;
        printWindow.document.head.appendChild(printStyles);
        printWindow.document.close();
        
        // Wait for content and images to load
        printWindow.onload = () => {
          // Additional wait for images and fonts
          setTimeout(() => {
            printWindow.print();
            toast({
              title: 'PDF Export Ready',
              description: 'Use your browser\'s print dialog to save as PDF. Make sure "Background graphics" is enabled.',
            });
          }, 1000);
        };
      } else {
        throw new Error('Could not access resume preview');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Client-side export failed: ${errorMessage}`);
    }
  };

  // Handle payment for individual plan
  const handleIndividualPlan = async (planKey: string) => {
    if (!session?.user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to purchase a plan.',
        variant: 'destructive',
      });
      return;
    }

    setLoadingPlan(planKey);
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
        
        const errorMsg = typeof errorData === 'string' 
          ? errorData 
          : errorData?.details || errorData?.error || errorData?.message || 'Failed to create order';
        
        throw new Error(errorMsg);
      } else {
        data = await response.json();
      }
      const { orderId, amount, keyId } = data;

      if (!keyId) {
        throw new Error('Payment gateway not configured. Please contact support.');
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
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

            // CRITICAL: Only show success if backend explicitly confirms with success: true
            // AND HTTP status is 200-299
            // Do NOT trust frontend Razorpay response alone
            if (verifyResponse.ok && result.success === true) {
              console.log('✅ [Payment Handler] Payment verified successfully by backend');
              toast({
                title: 'Payment successful!',
                description: 'Plan activated. Downloading your resume...',
              });
              
              // Close payment dialog
              setShowPaymentDialog(false);
              setLoadingPlan(null);
              
              // Retry the download after successful payment
              if (pendingExportFormat) {
                setTimeout(() => {
                  handleExport(pendingExportFormat);
                }, 1000);
              }
            } else {
              // Backend verification failed - mark as failed
              const errorMsg = result.error || result.details || result.message || 'Payment verification failed';
              console.error('❌ [Payment Handler] Payment verification FAILED:', {
                status: verifyResponse.status,
                httpOk: verifyResponse.ok,
                resultSuccess: result.success,
                error: errorMsg,
                result,
              });
              throw new Error(errorMsg);
            }
          } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
            console.error('❌ [Payment Handler] Payment verification error:', {
              error,
              errorMessage,
              errorType: typeof error,
              stack: error?.stack,
            });
            toast({
              title: 'Payment verification failed',
              description: errorMessage || 'Please contact support if payment was deducted.',
              variant: 'destructive',
            });
            setLoadingPlan(null);
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
            setLoadingPlan(null);
          },
        },
        // Handle payment errors
        handler_error: function(error: any) {
          console.error('❌ [Payment Handler] Razorpay error:', error);
          setLoadingPlan(null);
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
          
          toast({
            title: 'Payment failed',
            description: errorMessage,
            variant: 'destructive',
          });
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
      toast({
        title: 'Payment error',
        description: errorMessage,
        variant: 'destructive',
      });
      setLoadingPlan(null);
    }
  };

  const recommendations = getRecommendations(atsScore);

  // Handle section order change
  const handleSectionOrderChange = (newOrder: SectionId[]) => {
    setSectionOrder(newOrder);
    updateFormData({ sectionOrder: newOrder });
  };

  return (
    <>
      {/* Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.Razorpay) {
            setRazorpayLoaded(true);
          }
        }}
        onError={() => {
          console.error('Failed to load Razorpay SDK');
        }}
      />

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Choose a Plan to Download Resume</DialogTitle>
            <DialogDescription>
              Select a plan to unlock resume downloads and other premium features.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {INDIVIDUAL_PLANS.map((plan) => (
              <div
                key={plan.key}
                className={`relative rounded-lg border-2 p-6 ${
                  plan.popular
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                    <Star className="w-3 h-3 mr-1" />
                    Best Value
                  </Badge>
                )}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-600 ml-1">/{plan.validity}</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    {plan.features.resumeDownloads} Resume Downloads
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    {plan.features.templateAccess}
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    {plan.features.aiResumeUsage} AI Resume Uses
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    ATS Optimization
                  </li>
                </ul>
                <Button
                  onClick={() => handleIndividualPlan(plan.key)}
                  disabled={loadingPlan !== null || !razorpayLoaded}
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {loadingPlan === plan.key ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    `Buy Now - ₹${plan.price}`
                  )}
                </Button>
              </div>
            ))}
          </div>
          
          {!razorpayLoaded && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Loading payment gateway... Please wait.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Finalize & Export</h2>
        <p className="text-sm text-gray-600">
          Review your resume, check your ATS score, and export in your preferred format.
        </p>
      </div>

      {/* ATS Score */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">ATS Compatibility Score</h3>
            <p className="text-sm text-gray-600">
              How well your resume will perform with Applicant Tracking Systems
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getATSScoreColor(atsScore)}`}>
              {atsScore}
            </div>
            <div className="text-sm font-medium text-gray-600">
              {getATSScoreLabel(atsScore)}
            </div>
          </div>
        </div>
        <Progress value={atsScore} className="h-3 mb-4" />
        {recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">Recommendations:</p>
            <ul className="space-y-1">
              {recommendations.slice(0, 5).map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Section Order Manager */}
      <SectionOrderManager
        sectionOrder={sectionOrder}
        formData={formData}
        onOrderChange={handleSectionOrderChange}
      />

      {/* Export Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Resume</h3>
        <p className="text-sm text-gray-600 mb-6">
          Download your resume as PDF.
        </p>
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className="inline-flex flex-row items-center justify-center gap-2 h-11 px-6 min-w-[200px]"
          >
            {exporting === 'pdf' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Export as PDF</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Completion Message */}
      <div className="bg-green-50 rounded-lg border border-green-200 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">
              Resume Complete!
            </h3>
            <p className="text-sm text-green-700">
              Your resume is ready to use. You can export it as PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

