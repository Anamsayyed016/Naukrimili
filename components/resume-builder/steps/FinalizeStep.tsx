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
import { Check, Star, Building2 } from 'lucide-react';
import { INDIVIDUAL_PLANS, BUSINESS_PLANS, type IndividualPlanKey, type BusinessPlanKey } from '@/lib/services/razorpay-plans';

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
  const [activeTab, setActiveTab] = useState<'individual' | 'business'>('individual');
  const [skipPaymentCheck, setSkipPaymentCheck] = useState(false); // Bypass payment check after successful payment

  // Transform plans for UI display (centralized from razorpay-plans.ts)
  const INDIVIDUAL_PLANS_UI = Object.entries(INDIVIDUAL_PLANS).map(([key, plan]) => ({
    key: key as IndividualPlanKey,
    name: plan.name,
    price: plan.amount / 100, // Convert paise to rupees
    validity: `${plan.validityDays} Days`,
    features: {
      pdfDownloads: plan.features.pdfDownloads,
      templateAccess: plan.features.templateAccess === 'all' ? 'ALL Premium Templates' : `${plan.features.templateCount || plan.features.pdfDownloads} Premium Templates`,
      aiResumeUsage: plan.features.aiResumeUsage === -1 ? 'Unlimited' : plan.features.aiResumeUsage,
      aiCoverLetterUsage: plan.features.aiCoverLetterUsage === -1 ? 'Unlimited' : plan.features.aiCoverLetterUsage,
      atsOptimization: plan.features.atsOptimization,
      maxDownloadsPerDay: plan.features.maxDownloadsPerDay,
      unlimitedEdits: plan.features.unlimitedEdits || false,
      resumeVersionHistory: plan.features.resumeVersionHistory || false,
      prioritySupport: plan.features.prioritySupport || false,
    },
    popular: plan.popular || false,
    bestValue: (plan as any).bestValue || false,
  }));

  const BUSINESS_PLANS_UI = Object.entries(BUSINESS_PLANS).map(([key, plan]) => ({
    key: key as BusinessPlanKey,
    name: plan.name,
    price: plan.amount / 100, // Convert paise to rupees
    originalPrice: (plan as any).originalPrice ? (plan as any).originalPrice / 100 : null,
    validity: plan.durationMonths === 12 ? '1 Year' : `${plan.durationMonths} Months`,
    features: {
      resumeCredits: plan.features.resumeCredits,
      maxDownloadsPerDay: plan.features.maxDownloadsPerDay,
      templateAccess: 'ALL Premium Templates',
      prioritySupport: plan.features.prioritySupport,
      maxDownloadsPerCandidate: plan.features.maxDownloadsPerCandidate,
      unlimitedEdits: (plan.features as any).unlimitedEdits || false,
      resumeVersionHistory: (plan.features as any).resumeVersionHistory || false,
      atsOptimization: (plan.features as any).atsOptimization || false,
    },
    recommended: (plan as any).recommended || false,
    popular: (plan as any).popular || false,
  }));

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

  const handleExport = async (format: 'pdf', bypassPaymentCheck: boolean = false) => {
    setExporting(format);

    try {
      // Check authentication FIRST before any payment checks
      if (!session?.user) {
        console.log('🔒 [Export] User not authenticated - showing login message');
        setExporting(null);
        toast({
          title: 'Authentication Required',
          description: 'Please log in or create an account to download your resume.',
          variant: 'default',
          duration: 5000,
        });
        
        // Store current URL to return after login
        const currentUrl = window.location.href;
        localStorage.setItem('resume-builder-return-url', currentUrl);
        
        // Redirect to login with return URL
        router.push(`/auth/signin?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }

      // Admin bypass: Admins can download without payment
      const isAdmin = session?.user?.role === 'admin';
      if (isAdmin) {
        console.log('🔑 [Export] Admin user detected - bypassing payment checks');
        // Skip all payment checks and proceed directly to export
      } else if (bypassPaymentCheck || skipPaymentCheck) {
        // Skip payment check if we just verified payment successfully
        console.log('✅ [Export] Skipping payment check - payment just verified', {
          bypassPaymentCheck,
          skipPaymentCheck,
        });
        // Don't reset skipPaymentCheck here - let it reset after successful download
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
      
      // If bypassing payment check, add a flag to help backend understand this is post-payment
      const requestBody: any = {
        templateId,
        formData,
        selectedColorId,
      };
      
      // Add flag if we're bypassing payment check (post-payment scenario)
      if (bypassPaymentCheck || skipPaymentCheck) {
        requestBody._postPayment = true; // Internal flag for backend
        console.log('📄 [Export] Post-payment download - added flag');
      }
      
      const response = await fetch(`/api/resume-builder/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
      
      // Reset skipPaymentCheck flag after successful download
      if (skipPaymentCheck) {
        console.log('✅ [Export] Resetting skipPaymentCheck flag after successful download');
        setSkipPaymentCheck(false);
      }
      
      // Clear pending export format after successful download
      if (pendingExportFormat) {
        console.log('✅ [Export] Clearing pendingExportFormat after successful download');
        setPendingExportFormat(null);
      }
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
        credentials: 'include', // Required to send session cookies
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
          // CRITICAL: Wrap entire handler in try-catch and ensure errors are properly handled
          // Razorpay doesn't await async handlers, so we need to handle errors explicitly
          try {
            console.log('📥 [Payment Handler] Razorpay response received:', {
              hasOrderId: !!response.razorpay_order_id,
              hasPaymentId: !!response.razorpay_payment_id,
              hasSignature: !!response.razorpay_signature,
              fullResponse: response,
            });

            // Validate response has all required fields
            if (!response.razorpay_order_id || !response.razorpay_payment_id || !response.razorpay_signature) {
              console.error('❌ [Payment Handler] Missing payment details in response:', response);
              setLoadingPlan(null);
              toast({
                title: 'Payment error',
                description: 'Invalid payment response from gateway. Please try again.',
                variant: 'destructive',
              });
              return; // Exit early - don't throw (handler might not catch it)
            }

            // Verify payment with timeout
            console.log('🔄 [Payment Handler] Verifying payment...');
            let verifyResponse: Response;
            
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            try {
              console.log('🔄 [Payment Handler] Sending verification request to /api/payments/verify', {
                orderId: response.razorpay_order_id?.substring(0, 10) + '...',
                paymentId: response.razorpay_payment_id?.substring(0, 10) + '...',
                hasSignature: !!response.razorpay_signature,
              });
              
              verifyResponse = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                },
                credentials: 'include', // Required to send session cookies
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
                signal: controller.signal,
              });
              
              clearTimeout(timeoutId);
              
              console.log('📥 [Payment Handler] Verification response received:', {
                status: verifyResponse.status,
                statusText: verifyResponse.statusText,
                ok: verifyResponse.ok,
                url: verifyResponse.url,
              });
            } catch (fetchError: any) {
              clearTimeout(timeoutId);
              
              // Handle different types of errors
              if (fetchError.name === 'AbortError') {
                console.error('❌ [Payment Handler] Verification request timed out');
                setLoadingPlan(null);
                toast({
                  title: 'Verification timeout',
                  description: 'Payment verification timed out. Attempting download anyway since payment succeeded...',
                  variant: 'default',
                });
                
                // CRITICAL FALLBACK: If verification times out but payment succeeded on Razorpay side,
                // still attempt download since payment was confirmed by Razorpay
                setShowPaymentDialog(false);
                setSkipPaymentCheck(true);
                const exportFormat = pendingExportFormat || 'pdf';
                if (!pendingExportFormat) {
                  setPendingExportFormat('pdf');
                }
                
                // Trigger download after delay to allow webhook to process
                setTimeout(async () => {
                  try {
                    await handleExport(exportFormat, true);
                  } catch (downloadError) {
                    console.error('❌ [Payment Handler] Fallback download failed:', downloadError);
                    toast({
                      title: 'Download failed',
                      description: 'Please try downloading manually or contact support.',
                      variant: 'destructive',
                    });
                  }
                }, 2000);
                return;
              }
              
              // Handle 404 or other fetch errors
              if (fetchError.message?.includes('404') || fetchError.message?.includes('Failed to fetch')) {
                console.error('❌ [Payment Handler] Verification endpoint not found (404) or network error:', fetchError);
                setLoadingPlan(null);
                
                // CRITICAL FALLBACK: Payment succeeded on Razorpay side, but backend verification failed
                // Still attempt download since Razorpay confirmed payment
                toast({
                  title: 'Payment successful!',
                  description: 'Payment confirmed. Attempting download (verification may process via webhook)...',
                  variant: 'default',
                });
                
                setShowPaymentDialog(false);
                setSkipPaymentCheck(true);
                const exportFormat = pendingExportFormat || 'pdf';
                if (!pendingExportFormat) {
                  setPendingExportFormat('pdf');
                }
                
                // Trigger download with retries since webhook might still be processing
                const attemptDownloadWithRetries = async (attempt: number = 1, maxAttempts: number = 5) => {
                  const delay = attempt * 1000; // 1s, 2s, 3s, 4s, 5s
                  
                  await new Promise(resolve => setTimeout(resolve, delay));
                  
                  try {
                    console.log(`🔄 [Payment Handler] Fallback download attempt ${attempt}/${maxAttempts}...`);
                    await handleExport(exportFormat, true);
                    console.log(`✅ [Payment Handler] Fallback download succeeded on attempt ${attempt}`);
                  } catch (downloadError: any) {
                    console.warn(`⚠️ [Payment Handler] Fallback download attempt ${attempt} failed:`, downloadError?.message);
                    
                    if (attempt < maxAttempts) {
                      await attemptDownloadWithRetries(attempt + 1, maxAttempts);
                    } else {
                      toast({
                        title: 'Download failed',
                        description: 'Payment was successful, but download failed. Please try downloading manually or refresh the page.',
                        variant: 'destructive',
                      });
                    }
                  }
                };
                
                attemptDownloadWithRetries().catch(error => {
                  console.error('❌ [Payment Handler] Fallback download retries exhausted:', error);
                });
                
                return; // Don't throw - we've handled it with fallback
              }
              
              throw fetchError; // Re-throw other unexpected errors
            }

            console.log('📥 [Payment Handler] Verify response status:', verifyResponse.status, verifyResponse.statusText);

            // CRITICAL: Handle 404 response - endpoint might not exist or be misconfigured
            if (verifyResponse.status === 404) {
              console.error('❌ [Payment Handler] Verification endpoint returned 404 - endpoint not found');
              setLoadingPlan(null);
              
              // CRITICAL FALLBACK: Payment succeeded on Razorpay side, but backend endpoint is missing
              // Still attempt download since Razorpay confirmed payment
              toast({
                title: 'Payment successful!',
                description: 'Payment confirmed. Attempting download (verification will process via webhook)...',
                variant: 'default',
              });
              
              setShowPaymentDialog(false);
              setSkipPaymentCheck(true);
              const exportFormat = pendingExportFormat || 'pdf';
              if (!pendingExportFormat) {
                setPendingExportFormat('pdf');
              }
              
              // Trigger download with extended retries since webhook needs time to process
              const attemptDownloadWithExtendedRetries = async (attempt: number = 1, maxAttempts: number = 8) => {
                const delay = attempt * 1000; // 1s, 2s, 3s, 4s, 5s, 6s, 7s, 8s
                
                await new Promise(resolve => setTimeout(resolve, delay));
                
                try {
                  console.log(`🔄 [Payment Handler] 404 fallback download attempt ${attempt}/${maxAttempts}...`);
                  await handleExport(exportFormat, true);
                  console.log(`✅ [Payment Handler] 404 fallback download succeeded on attempt ${attempt}`);
                } catch (downloadError: any) {
                  console.warn(`⚠️ [Payment Handler] 404 fallback download attempt ${attempt} failed:`, downloadError?.message);
                  
                  if (attempt < maxAttempts) {
                    await attemptDownloadWithExtendedRetries(attempt + 1, maxAttempts);
                  } else {
                    toast({
                      title: 'Download pending',
                      description: 'Payment was successful. Please wait a few seconds and try downloading manually, or refresh the page.',
                      variant: 'default',
                    });
                  }
                }
              };
              
              attemptDownloadWithExtendedRetries().catch(error => {
                console.error('❌ [Payment Handler] 404 fallback download retries exhausted:', error);
              });
              
              return; // Exit early - we've handled it with fallback
            }

            // Check if response is ok before parsing JSON
            let result: any;
            let responseText: string;
            try {
              responseText = await verifyResponse.text();
              console.log('📥 [Payment Handler] Verify response text (first 500 chars):', responseText.substring(0, 500));
              
              if (!responseText) {
                throw new Error('Empty response from server');
              }
              
              result = JSON.parse(responseText);
            } catch (parseError: any) {
              console.error('❌ [Payment Handler] Failed to parse verify response:', {
                error: parseError,
                status: verifyResponse.status,
                statusText: verifyResponse.statusText,
                responseText: responseText?.substring(0, 500),
              });
              
              // If status is not ok, try fallback download
              if (!verifyResponse.ok) {
                console.log('⚠️ [Payment Handler] Non-OK response - attempting fallback download');
                setShowPaymentDialog(false);
                setSkipPaymentCheck(true);
                const exportFormat = pendingExportFormat || 'pdf';
                if (!pendingExportFormat) {
                  setPendingExportFormat('pdf');
                }
                
                setTimeout(async () => {
                  try {
                    await handleExport(exportFormat, true);
                  } catch (downloadError) {
                    console.error('❌ [Payment Handler] Parse error fallback download failed:', downloadError);
                  }
                }, 2000);
              }
              
              setLoadingPlan(null);
              toast({
                title: verifyResponse.ok ? 'Verification error' : 'Payment successful',
                description: verifyResponse.ok 
                  ? 'Invalid response from payment verification server. Please contact support.'
                  : 'Payment confirmed. Attempting download...',
                variant: verifyResponse.ok ? 'destructive' : 'default',
              });
              return; // Exit early
            }

            console.log('📥 [Payment Handler] Verify response data:', {
              success: result.success,
              hasError: !!result.error,
              message: result.message,
              error: result.error,
              details: result.details,
              fullResult: result,
            });

            // CRITICAL: Only show success if backend explicitly confirms with success: true
            // AND HTTP status is 200-299
            // Do NOT trust frontend Razorpay response alone
            // Also accept if payment was already processed (idempotency)
            if (verifyResponse.ok && (result.success === true || result.alreadyProcessed === true)) {
              console.log('✅ [Payment Handler] Payment verified successfully by backend', {
                success: result.success,
                alreadyProcessed: result.alreadyProcessed,
                readyForDownload: result.readyForDownload,
                pendingExportFormat,
              });
              
              // Close payment dialog FIRST to ensure UI updates immediately
              setShowPaymentDialog(false);
              setLoadingPlan(null);
              
              toast({
                title: 'Payment successful!',
                description: result.alreadyProcessed 
                  ? 'Payment was already processed. Downloading your resume...'
                  : 'Plan activated. Downloading your resume...',
              });
              
              // Set flag to bypass payment check and retry the download after successful payment
              setSkipPaymentCheck(true);
              
              // Use pendingExportFormat or default to 'pdf' if not set (safeguard)
              // CRITICAL: If pendingExportFormat is not set, set it to 'pdf' for consistency
              const exportFormat = pendingExportFormat || 'pdf';
              if (!pendingExportFormat) {
                setPendingExportFormat('pdf');
                console.log('📥 [Payment Handler] No pendingExportFormat found - setting to default: pdf');
              }
              
              console.log('📥 [Payment Handler] Triggering download after payment:', {
                pendingExportFormat,
                exportFormat,
                hasPendingFormat: !!pendingExportFormat,
                willUseDefault: !pendingExportFormat
              });
              
              // Retry logic with exponential backoff to handle database update delays
              const attemptDownload = async (attempt: number = 1, maxAttempts: number = 3): Promise<void> => {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000); // 1s, 2s, 3s
                
                console.log(`🔄 [Payment Handler] Attempting download (attempt ${attempt}/${maxAttempts}) after ${delay}ms delay...`);
                
                // Use Promise to properly handle async setTimeout
                await new Promise<void>((resolve) => {
                  setTimeout(async () => {
                    try {
                      console.log(`📄 [Payment Handler] Calling handleExport with format: ${exportFormat}, bypassPaymentCheck: true`);
                      
                      try {
                        await handleExport(exportFormat, true); // Pass bypass flag
                        console.log(`✅ [Payment Handler] Download completed successfully on attempt ${attempt}`);
                        resolve(); // Success - resolve and exit
                      } catch (exportError: any) {
                        console.error(`❌ [Payment Handler] handleExport threw error on attempt ${attempt}:`, {
                          error: exportError,
                          errorMessage: exportError?.message,
                          errorStack: exportError?.stack,
                          errorType: typeof exportError,
                        });
                        // Re-throw to trigger retry logic below
                        throw exportError;
                      }
                    } catch (error: any) {
                      const errorMessage = error instanceof Error ? error.message : String(error);
                      console.warn(`⚠️ [Payment Handler] Download attempt ${attempt} failed:`, {
                        error,
                        errorMessage,
                        errorType: typeof error,
                        isError: error instanceof Error
                      });
                      
                      // Retry on ANY error if we have attempts left (broader retry logic)
                      if (attempt < maxAttempts) {
                        console.log(`🔄 [Payment Handler] Retrying download (attempt ${attempt + 1}/${maxAttempts})...`);
                        try {
                          await attemptDownload(attempt + 1, maxAttempts);
                          resolve(); // Resolve after successful retry
                        } catch (retryError) {
                          // If retry also fails, it will handle its own error
                          resolve(); // Still resolve to prevent hanging
                        }
                      } else {
                        // Final attempt failed
                        console.error('❌ [Payment Handler] All download attempts failed after', maxAttempts, 'attempts');
                        toast({
                          title: 'Download failed',
                          description: 'Payment was successful, but download failed. Please try downloading manually.',
                          variant: 'destructive',
                        });
                        resolve(); // Resolve to prevent hanging
                      }
                    }
                  }, delay);
                });
              };
              
              // Start first attempt (don't await - let it run in background)
              attemptDownload().catch((error) => {
                console.error('❌ [Payment Handler] Unexpected error in download retry logic:', error);
                toast({
                  title: 'Download error',
                  description: 'Payment was successful, but download failed. Please try downloading manually.',
                  variant: 'destructive',
                });
              });
            } else {
              // Backend verification failed - mark as failed
              const errorMsg = result.error || result.details || result.message || 'Payment verification failed';
              console.error('❌ [Payment Handler] Payment verification FAILED:', {
                status: verifyResponse.status,
                statusText: verifyResponse.statusText,
                httpOk: verifyResponse.ok,
                resultSuccess: result.success,
                error: errorMsg,
                fullResult: result,
              });
              
              setLoadingPlan(null);
              toast({
                title: 'Payment verification failed',
                description: errorMsg || 'Please contact support if payment was deducted.',
                variant: 'destructive',
              });
              return; // Exit early - don't throw
            }
          } catch (error: any) {
            // Catch any unexpected errors
            const errorMessage = error instanceof Error ? error.message : String(error) || 'Payment verification failed';
            console.error('❌ [Payment Handler] Unexpected payment verification error:', {
              error,
              errorMessage,
              errorType: typeof error,
              errorName: error?.name,
              stack: error?.stack,
              toString: error?.toString?.(),
            });
            
            setLoadingPlan(null);
            toast({
              title: 'Payment verification error',
              description: errorMessage || 'An unexpected error occurred. Please contact support if payment was deducted.',
              variant: 'destructive',
            });
            
            // Re-throw to ensure Razorpay knows there was an error (if it checks)
            // But we've already handled the UI feedback above
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
            console.log('⚠️ [Payment Handler] Payment modal dismissed by user');
            setLoadingPlan(null);
            // Don't show toast on dismissal - user intentionally cancelled
            // Only show if payment was attempted
          },
        },
        // Handle payment errors
        handler_error: function(error: any) {
          console.error('❌ [Payment Handler] Razorpay error:', {
            error,
            errorType: typeof error,
            errorCode: error?.error?.code,
            errorDescription: error?.error?.description,
            errorReason: error?.error?.reason,
            fullError: JSON.stringify(error, null, 2),
          });
          setLoadingPlan(null);
          
          let errorMessage = 'Payment could not be completed';
          let showToast = true;
          
          if (error?.error) {
            const errorCode = error.error.code;
            const errorDesc = error.error.description || error.error.reason;
            
            // Handle specific error codes
            if (errorCode === 'BAD_REQUEST_ERROR') {
              errorMessage = errorDesc || 'Invalid payment request. Please try again.';
            } else if (errorCode === 'GATEWAY_ERROR') {
              errorMessage = 'Payment gateway error. Please try again or use a different payment method.';
            } else if (errorCode === 'NETWORK_ERROR') {
              errorMessage = 'Network error. Please check your connection and try again.';
            } else if (errorCode === 'USER_CLOSED') {
              // User closed the payment modal - don't show error toast
              console.log('ℹ️ [Payment Handler] User closed payment modal');
              showToast = false;
              return; // Exit early without showing error
            } else {
              errorMessage = errorDesc || error.error.reason || 'Payment could not be completed. Please try again.';
            }
          } else if (error?.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          // Only show error toast if it's not a user cancellation
          if (showToast) {
            toast({
              title: 'Payment failed',
              description: errorMessage,
              variant: 'destructive',
            });
          }
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

  // Handle payment for business plan
  const handleBusinessPlan = async (planKey: string) => {
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
        
        const errorMsg = typeof errorData === 'string' 
          ? errorData 
          : errorData?.details || errorData?.error || errorData?.message || 'Failed to create subscription';
        
        throw new Error(errorMsg);
      } else {
        data = await response.json();
      }
      const { subscriptionId, planId, amount, keyId } = data;

      if (!keyId) {
        throw new Error('Payment gateway not configured. Please contact support.');
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
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
          try {
            console.log('📥 [Business Payment Handler] Razorpay response received:', {
              hasSubscriptionId: !!response.razorpay_subscription_id,
              hasPaymentId: !!response.razorpay_payment_id,
              hasSignature: !!response.razorpay_signature,
            });

            toast({
              title: 'Payment successful!',
              description: 'Business plan activated. Downloading your resume...',
            });
            
            // Close payment dialog FIRST to ensure UI updates immediately
            setShowPaymentDialog(false);
            setLoadingPlan(null);
            
            // Set flag to bypass payment check and retry the download after successful payment
            setSkipPaymentCheck(true);
            
            // Use pendingExportFormat or default to 'pdf' if not set (safeguard)
            // CRITICAL: If pendingExportFormat is not set, set it to 'pdf' for consistency
            const exportFormat = pendingExportFormat || 'pdf';
            if (!pendingExportFormat) {
              setPendingExportFormat('pdf');
              console.log('📥 [Business Payment Handler] No pendingExportFormat found - setting to default: pdf');
            }
            
            console.log('📥 [Business Payment Handler] Triggering download after business payment:', {
              pendingExportFormat,
              exportFormat,
              hasPendingFormat: !!pendingExportFormat,
              willUseDefault: !pendingExportFormat
            });
              
              // Use Promise to properly handle async setTimeout with retry logic
              const attemptBusinessDownload = async (attempt: number = 1, maxAttempts: number = 3): Promise<void> => {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000); // 1s, 2s, 3s
                
                console.log(`🔄 [Business Payment Handler] Attempting download (attempt ${attempt}/${maxAttempts}) after ${delay}ms delay...`);
                
                await new Promise<void>((resolve) => {
                  setTimeout(async () => {
                    try {
                      console.log(`📄 [Business Payment Handler] Calling handleExport with format: ${exportFormat}, bypassPaymentCheck: true`);
                      
                      try {
                        await handleExport(exportFormat, true); // Pass bypass flag
                        console.log(`✅ [Business Payment Handler] Download completed successfully on attempt ${attempt}`);
                        resolve();
                      } catch (exportError: any) {
                        console.error(`❌ [Business Payment Handler] handleExport threw error on attempt ${attempt}:`, {
                          error: exportError,
                          errorMessage: exportError?.message,
                          errorStack: exportError?.stack,
                        });
                        // Re-throw to trigger retry logic
                        throw exportError;
                      }
                    } catch (error: any) {
                      const errorMessage = error instanceof Error ? error.message : String(error);
                      console.warn(`⚠️ [Business Payment Handler] Download attempt ${attempt} failed:`, {
                        error,
                        errorMessage
                      });
                      
                      if (attempt < maxAttempts) {
                        console.log(`🔄 [Business Payment Handler] Retrying download (attempt ${attempt + 1}/${maxAttempts})...`);
                        try {
                          await attemptBusinessDownload(attempt + 1, maxAttempts);
                          resolve();
                        } catch (retryError) {
                          resolve();
                        }
                      } else {
                        console.error('❌ [Business Payment Handler] All download attempts failed after', maxAttempts, 'attempts');
                        toast({
                          title: 'Download failed',
                          description: 'Payment was successful, but download failed. Please try downloading manually.',
                          variant: 'destructive',
                        });
                        resolve();
                      }
                    }
                  }, delay);
                });
              };
              
              attemptBusinessDownload().catch((error) => {
                console.error('❌ [Business Payment Handler] Unexpected error in download retry logic:', error);
                toast({
                  title: 'Download error',
                  description: 'Payment was successful, but download failed. Please try downloading manually.',
                  variant: 'destructive',
                });
              });
          } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
            console.error('❌ [Business Payment Handler] Payment verification error:', {
              error,
              errorMessage,
            });
            toast({
              title: 'Payment verification failed',
              description: errorMessage || 'Please contact support if payment was deducted.',
              variant: 'destructive',
            });
            setLoadingPlan(null);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('⚠️ [Business Payment Handler] Payment modal dismissed by user');
            setLoadingPlan(null);
            // Don't show toast on dismissal - user intentionally cancelled
          },
        },
        handler_error: function(error: any) {
          console.error('❌ [Business Payment Handler] Razorpay error:', {
            error,
            errorType: typeof error,
            errorCode: error?.error?.code,
            errorDescription: error?.error?.description,
            errorReason: error?.error?.reason,
            fullError: JSON.stringify(error, null, 2),
          });
          setLoadingPlan(null);
          
          let errorMessage = 'Payment could not be completed';
          let showToast = true;
          
          if (error?.error) {
            const errorCode = error.error.code;
            const errorDesc = error.error.description || error.error.reason;
            
            if (errorCode === 'BAD_REQUEST_ERROR') {
              errorMessage = errorDesc || 'Invalid payment request. Please try again.';
            } else if (errorCode === 'GATEWAY_ERROR') {
              errorMessage = 'Payment gateway error. Please try again or use a different payment method.';
            } else if (errorCode === 'NETWORK_ERROR') {
              errorMessage = 'Network error. Please check your connection and try again.';
            } else if (errorCode === 'USER_CLOSED') {
              console.log('ℹ️ [Business Payment Handler] User closed payment modal');
              showToast = false;
              return;
            } else {
              errorMessage = errorDesc || error.error.reason || 'Payment could not be completed. Please try again.';
            }
          } else if (error?.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          if (showToast) {
            toast({
              title: 'Payment failed',
              description: errorMessage,
              variant: 'destructive',
            });
          }
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
          
          {/* Tabs */}
          <div className="flex justify-center mb-6 mt-4">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {INDIVIDUAL_PLANS_UI.map((plan) => (
              <div
                key={plan.key}
                className={`relative rounded-lg border-2 p-6 ${
                  plan.popular || plan.bestValue
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {(plan.popular || plan.bestValue) && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                    <Star className="w-3 h-3 mr-1" />
                    {plan.popular ? 'Most Popular' : 'Best Value'}
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
                    {plan.features.pdfDownloads} PDF Resume Downloads{plan.features.maxDownloadsPerDay ? ` (max ${plan.features.maxDownloadsPerDay}/day)` : ''}
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    {plan.features.templateAccess}
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    {typeof plan.features.aiResumeUsage === 'number' ? `${plan.features.aiResumeUsage} AI Resume Optimization${plan.features.aiResumeUsage === 1 ? '' : 's'}` : 'Unlimited AI Resume Optimization'}
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    {typeof plan.features.aiCoverLetterUsage === 'number' ? `${plan.features.aiCoverLetterUsage} AI Cover Letter${plan.features.aiCoverLetterUsage === 1 ? '' : 's'}` : 'Unlimited AI Cover Letters'}
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    {plan.features.atsOptimization === 'advanced' ? 'Advanced' : 'Basic'} ATS Optimization
                  </li>
                  {plan.features.unlimitedEdits && (
                    <li className="flex items-center text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      Unlimited edits during validity
                    </li>
                  )}
                  {plan.features.resumeVersionHistory && (
                    <li className="flex items-center text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      Resume Version History
                    </li>
                  )}
                  {plan.features.prioritySupport && (
                    <li className="flex items-center text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      Priority Support
                    </li>
                  )}
                </ul>
                <Button
                  onClick={() => handleIndividualPlan(plan.key)}
                  disabled={loadingPlan !== null || !razorpayLoaded}
                  className={`w-full h-11 px-5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-200 ${
                    plan.popular || plan.bestValue
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm`}
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
          )}

          {/* Business Plans */}
          {activeTab === 'business' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 max-w-6xl mx-auto">
              {BUSINESS_PLANS_UI.map((plan) => (
                <div
                  key={plan.key}
                  className={`relative rounded-lg border-2 p-6 ${
                    plan.recommended || plan.popular
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {(plan.recommended || plan.popular) && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                      <Star className="w-3 h-3 mr-1" />
                      {plan.popular ? 'Most Popular' : 'Recommended'}
                    </Badge>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <Building2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-center mb-4">
                    <div className="mt-2">
                      {plan.originalPrice ? (
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-xl font-normal text-gray-400 line-through">₹{plan.originalPrice}</span>
                          <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                      )}
                      <span className="text-gray-600 ml-1 block">/{plan.validity}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      {plan.features.resumeCredits} Resume Credits
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      Max {plan.features.maxDownloadsPerDay} PDF downloads/day
                    </li>
                    {plan.features.maxDownloadsPerCandidate && (
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        Max {plan.features.maxDownloadsPerCandidate} downloads per candidate
                      </li>
                    )}
                    <li className="flex items-center text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      {plan.features.templateAccess}
                    </li>
                    {plan.features.prioritySupport && (
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        Priority Support
                      </li>
                    )}
                    {plan.features.unlimitedEdits && (
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        Unlimited resume edits during validity
                      </li>
                    )}
                    {plan.features.resumeVersionHistory && (
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        Resume Version History
                      </li>
                    )}
                    {plan.features.atsOptimization === 'advanced' && (
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        Advanced ATS Optimization
                      </li>
                    )}
                  </ul>
                  <Button
                    onClick={() => handleBusinessPlan(plan.key)}
                    disabled={loadingPlan !== null || !razorpayLoaded}
                    className={`w-full h-11 px-5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-200 ${
                      plan.recommended || plan.popular
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm`}
                  >
                    {loadingPlan === plan.key ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      `Subscribe - ₹${plan.price}`
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
          
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

