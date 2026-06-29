'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, CheckCircle2, AlertCircle, X, Download } from 'lucide-react';
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
import { INDIVIDUAL_PLANS, BUSINESS_PLANS, PLAN_DISPLAY_NAMES, isAdminPlanBypassResponse, type IndividualPlanKey, type BusinessPlanKey } from '@/lib/services/razorpay-plans';
import {
  getIndividualPlansForUI,
  getBusinessPlansForUI,
  getIndividualPlanFeatureBullets,
  getBusinessPlanFeatureBullets,
} from '@/lib/services/plan-display-ui';
import { CouponCheckoutBox, type CouponQuote } from '@/components/payments/CouponCheckoutBox';
import {
  triggerGoAffProConversionAfterSubscription,
  triggerGoAffProConversionAfterVerify,
} from '@/components/payments/GoAffProConversionTrigger';
import './finalize-payment-dialog.css';
import { PDF_PAGINATION_PRINT_CSS } from '@/lib/resume-builder/pdf-pagination-overrides';

const INDIVIDUAL_PLANS_UI = getIndividualPlansForUI();
const BUSINESS_PLANS_UI = getBusinessPlansForUI();

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PdfDeliveryMethod = 'share-files' | 'open-blob-tab' | 'anchor-download';

type PdfDeliveryDeviceType = 'ios' | 'android' | 'desktop';

interface PdfDeliveryDeviceInfo {
  deviceType: PdfDeliveryDeviceType;
  browser: string;
  userAgent: string;
}

interface PdfDeliveryResult {
  method: PdfDeliveryMethod;
  success: boolean;
  error?: string;
  device: PdfDeliveryDeviceInfo;
  /** Mobile only: share and anchor failed — present explicit download link. */
  showDownloadModal?: { url: string; filename: string };
}

interface PdfDeliveryOptions {
  /** @deprecated Mobile delivery no longer uses popup windows. */
  deliveryWindow?: Window | null;
}

const MOBILE_BLOB_REVOKE_MS = 60_000;

const MOBILE_PDF_GENERATION_FAILED = 'PDF generation failed. Please try again.';

function logExportDiagnostics(input: {
  status: number;
  contentType: string;
  blobType?: string;
  blobSize?: number;
}): void {
  console.log('📊 [Export] Diagnostics', {
    status: input.status,
    contentType: input.contentType,
    blobType: input.blobType ?? null,
    blobSize: input.blobSize ?? null,
  });
}

function logExportFailure(reason: string, details?: Record<string, unknown>): void {
  console.error('❌ [Export] Failure', { reason, ...(details ?? {}) });
}

async function tryMobilePdfShare(
  blob: Blob,
  filename: string
): Promise<PdfDeliveryResult | null> {
  const device = getPdfDeliveryDeviceInfo();
  const file = new File([blob], filename, { type: 'application/pdf' });
  const canShareFiles =
    typeof navigator.share === 'function' &&
    (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] }));

  if (!canShareFiles) return null;

  try {
    await navigator.share({
      files: [file],
      title: 'Resume PDF',
      text: filename,
    });
    return { method: 'share-files', success: true, device };
  } catch (shareError: unknown) {
    const err = shareError instanceof Error ? shareError : new Error(String(shareError));
    if (err.name === 'AbortError') {
      return { method: 'share-files', success: false, error: 'cancelled', device };
    }
    console.warn('⚠️ [PDF Delivery] navigator.share failed', err.message);
    return null;
  }
}

/** Mobile fallback — direct file download without in-browser PDF preview. */
function tryMobileAnchorDownload(blob: Blob, filename: string): boolean {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);

  let clicked = false;
  try {
    anchor.click();
    clicked = true;
  } catch (clickError: unknown) {
    console.error('❌ [PDF Delivery] Mobile anchor.click() failed:', clickError);
  }

  window.setTimeout(() => {
    if (anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
  }, 2000);
  scheduleBlobUrlRevoke(url, MOBILE_BLOB_REVOKE_MS);
  return clicked;
}

async function deliverMobilePdfBlob(
  blob: Blob,
  filename: string,
  _options?: PdfDeliveryOptions & { allowAnchorDownload?: boolean }
): Promise<PdfDeliveryResult> {
  const device = getPdfDeliveryDeviceInfo();

  if (blob.size === 0) {
    logExportFailure('mobile-delivery-empty-blob', { blobSize: 0 });
    return {
      method: 'share-files',
      success: false,
      device,
      error: 'empty-blob',
    };
  }

  // 1. Primary: native share sheet (Save to Files / Download) — iOS and Android.
  const shareOutcome = await tryMobilePdfShare(blob, filename);
  if (shareOutcome) {
    logPdfDeliveryDiagnostics({
      device,
      blobSize: blob.size,
      method: shareOutcome.method,
      success: shareOutcome.success,
      error: shareOutcome.error,
    });
    if (shareOutcome.success || shareOutcome.error === 'cancelled') {
      return shareOutcome;
    }
  }

  // 2. Fallback: anchor.download — never open HTML preview.
  const anchorClicked = tryMobileAnchorDownload(blob, filename);
  if (anchorClicked) {
    const result: PdfDeliveryResult = {
      method: 'anchor-download',
      success: true,
      device,
    };
    logPdfDeliveryDiagnostics({
      device,
      blobSize: blob.size,
      method: result.method,
      success: true,
      revokeDelayMs: MOBILE_BLOB_REVOKE_MS,
    });
    return result;
  }

  // 3. Last resort: explicit download link — never HTML preview.
  logExportFailure('mobile-delivery-exhausted', {
    blobSize: blob.size,
    deviceType: device.deviceType,
    browser: device.browser,
  });
  const url = URL.createObjectURL(blob);
  return {
    method: 'anchor-download',
    success: true,
    device,
    showDownloadModal: { url, filename },
  };
}

function getPdfDeliveryDeviceInfo(): PdfDeliveryDeviceInfo {
  if (typeof navigator === 'undefined') {
    return { deviceType: 'desktop', browser: 'unknown', userAgent: '' };
  }

  const ua = navigator.userAgent;
  const isIPad =
    /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIOS =
    /iPhone|iPod/i.test(ua) ||
    isIPad ||
    (/CriOS/i.test(ua) && /Mobile/i.test(ua));

  let deviceType: PdfDeliveryDeviceType = 'desktop';
  if (isIOS) deviceType = 'ios';
  else if (/Android/i.test(ua)) deviceType = 'android';

  let browser = 'unknown';
  if (/CriOS/i.test(ua)) browser = 'chrome-ios';
  else if (/FxiOS/i.test(ua)) browser = 'firefox-ios';
  else if (deviceType === 'ios' && /Safari/i.test(ua)) browser = 'safari-ios';
  else if (/SamsungBrowser/i.test(ua)) browser = 'samsung-internet';
  else if (/Chrome/i.test(ua)) browser = 'chrome';
  else if (/Safari/i.test(ua)) browser = 'safari';
  else if (/Firefox/i.test(ua)) browser = 'firefox';
  else if (/Edg/i.test(ua)) browser = 'edge';

  return { deviceType, browser, userAgent: ua };
}

function isMobilePdfDeliveryDevice(): boolean {
  const { deviceType } = getPdfDeliveryDeviceInfo();
  return deviceType === 'ios' || deviceType === 'android';
}

function scheduleBlobUrlRevoke(url: string, delayMs: number): void {
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, delayMs);
}

function logPdfDeliveryDiagnostics(input: {
  device: PdfDeliveryDeviceInfo;
  blobSize: number;
  method: PdfDeliveryMethod;
  success: boolean;
  error?: string;
  revokeDelayMs?: number;
}): void {
  console.log('📱 [PDF Delivery]', {
    deviceType: input.device.deviceType,
    browser: input.device.browser,
    userAgent: input.device.userAgent,
    blobSize: input.blobSize,
    method: input.method,
    success: input.success,
    error: input.error ?? null,
    revokeDelayMs: input.revokeDelayMs ?? null,
  });
}

function getPdfDeliveryFeedback(
  device: PdfDeliveryDeviceInfo,
  result: PdfDeliveryResult
): { title: string; description: string } {
  if (result.error === 'cancelled') {
    return {
      title: 'Share cancelled',
      description: 'Tap Download PDF again when you are ready to save your file.',
    };
  }

  if (device.deviceType === 'ios') {
    return {
      title: 'PDF ready',
      description: 'Choose Save to Files in the share sheet to keep your resume PDF.',
    };
  }

  if (device.deviceType === 'android') {
    return {
      title: 'PDF ready',
      description: 'Your resume PDF file was shared or saved to your device.',
    };
  }

  return {
    title: 'Download started',
    description: 'Your resume PDF is downloading.',
  };
}

async function deliverPdfBlob(
  blob: Blob,
  filename: string,
  options?: PdfDeliveryOptions & { allowAnchorDownload?: boolean }
): Promise<PdfDeliveryResult> {
  const device = getPdfDeliveryDeviceInfo();

  if (device.deviceType === 'ios' || device.deviceType === 'android') {
    return deliverMobilePdfBlob(blob, filename, options);
  }

  // Desktop — unchanged anchor download flow
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);

  let clickSuccess = true;
  try {
    anchor.click();
  } catch (clickError: unknown) {
    clickSuccess = false;
    console.error('❌ [PDF Delivery] anchor.click() failed:', clickError);
  }

  document.body.removeChild(anchor);
  scheduleBlobUrlRevoke(url, 1000);

  const result: PdfDeliveryResult = {
    method: 'anchor-download',
    success: clickSuccess,
    device,
    error: clickSuccess ? undefined : 'anchor-click-failed',
  };
  logPdfDeliveryDiagnostics({
    device,
    blobSize: blob.size,
    method: result.method,
    success: result.success,
    error: result.error,
    revokeDelayMs: 1000,
  });
  return result;
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
  const [showDownloadLimitDialog, setShowDownloadLimitDialog] = useState(false);
  const [downloadLimitInfo, setDownloadLimitInfo] = useState<{
    downloadsUsed: number;
    downloadsAllowed: number;
    planName: string;
  } | null>(null);
  const [pendingExportFormat, setPendingExportFormat] = useState<'pdf' | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'individual' | 'business'>('individual');
  const [couponQuotes, setCouponQuotes] = useState<Record<string, CouponQuote | null>>({});
  const [skipPaymentCheck, setSkipPaymentCheck] = useState(false); // Bypass payment check after successful payment
  const [mobilePdfReadyAfterPayment, setMobilePdfReadyAfterPayment] = useState(false);
  const [mobileDownloadFallback, setMobileDownloadFallback] = useState<{
    url: string;
    filename: string;
  } | null>(null);

  const closeMobileDownloadFallback = (): void => {
    setMobileDownloadFallback((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  };

  const showMobilePdfGenerationFailed = (): void => {
    toast({
      title: 'PDF generation failed',
      description: MOBILE_PDF_GENERATION_FAILED,
      variant: 'destructive',
    });
  };

  const openPdfDownloadLimitDialog = (info: {
    downloadsUsed?: number;
    downloadsAllowed?: number;
    planName?: string;
    planKey?: string;
  }) => {
    const planKey = info.planKey;
    const resolvedPlanName =
      info.planName ||
      (planKey ? PLAN_DISPLAY_NAMES[planKey as IndividualPlanKey] ?? planKey.replace(/_/g, ' ') : 'Current plan');
    setDownloadLimitInfo({
      downloadsUsed: info.downloadsUsed ?? 0,
      downloadsAllowed: info.downloadsAllowed ?? 0,
      planName: resolvedPlanName,
    });
    setShowDownloadLimitDialog(true);
    setExporting(null);
  };

  /** Same in-app plan picker used when export requires a new purchase or upgrade. */
  const openPlanSelectionDialog = (format: 'pdf' = 'pdf') => {
    setShowDownloadLimitDialog(false);
    setPendingExportFormat(format);
    setShowPaymentDialog(true);
    setExporting(null);
  };

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

  const handleExport = async (
    format: 'pdf',
    bypassPaymentCheck: boolean = false
  ) => {
    setExporting(format);

    try {
      // Check authentication FIRST before any payment checks
      if (!session?.user) {
        console.log('🔒 [Export] User not authenticated - saving resume data and redirecting to login');
        setExporting(null);
        toast({
          title: 'Authentication Required',
          description: 'Please log in or create an account to download your resume.',
          variant: 'default',
          duration: 5000,
        });
        
        // CRITICAL: Save complete resume data to sessionStorage AND localStorage before redirecting
        // This ensures user doesn't lose their work after payment
        // sessionStorage: for immediate restoration after auth
        // localStorage: as backup in case sessionStorage is cleared
        const resumeDataToSave = {
          formData: formData,
          templateId: templateId,
          typeId: typeId,
          selectedColorId: selectedColorId,
          currentStep: 'finalize', // User is on finalize step
          timestamp: Date.now(),
        };
        
        // Save to sessionStorage (primary)
        sessionStorage.setItem('resume-builder-payment-flow', JSON.stringify(resumeDataToSave));
        
        // Also save to localStorage as backup (using same key pattern as auto-save)
        if (templateId) {
          localStorage.setItem(`resume-${templateId}`, JSON.stringify(formData));
          console.log('💾 [Export] Also saved form data to localStorage as backup');
        }
        
        console.log('💾 [Export] Saved resume data for payment flow:', {
          hasFormData: !!formData && Object.keys(formData).length > 0,
          templateId,
          step: 'finalize',
          savedToSessionStorage: true,
          savedToLocalStorage: !!templateId
        });
        
        // Store current URL to return after login/payment
        // Ensure URL includes templateId and typeId for proper restoration
        const currentUrl = window.location.pathname + window.location.search;
        let returnUrl = currentUrl;
        
        // Ensure templateId and typeId are in the URL for proper restoration
        const urlObj = new URL(currentUrl, window.location.origin);
        if (templateId && !urlObj.searchParams.has('template')) {
          urlObj.searchParams.set('template', templateId);
        }
        if (typeId && !urlObj.searchParams.has('type')) {
          urlObj.searchParams.set('type', typeId);
        }
        returnUrl = urlObj.pathname + urlObj.search;
        
        sessionStorage.setItem('resume-builder-return-url', returnUrl);
        console.log('💾 [Export] Stored return URL:', returnUrl);
        // Mark that user needs payment after login
        sessionStorage.setItem('resume-builder-needs-payment', 'true');
        // Preserve source if coming from jobseeker dashboard
        const source = sessionStorage.getItem('resume-builder-source');
        if (source) {
          sessionStorage.setItem('resume-builder-source', source);
        }
        
        // Redirect to login with return URL
        router.push(`/auth/signin?redirect=${encodeURIComponent(currentUrl)}`);
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
          // Mini Starter: editor edits live in localStorage — sync edit entitlement before quota check
          try {
            const syncResponse = await fetch('/api/resume-builder/sync-edit-entitlement', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ formData, templateId }),
            });
            if (!syncResponse.ok) {
              console.warn(
                '⚠️ [Export] Edit entitlement sync failed:',
                syncResponse.status,
                await syncResponse.text().catch(() => '')
              );
            } else {
              const syncResult = await syncResponse.json().catch(() => ({}));
              if (syncResult.editRecorded) {
                console.log('✅ [Export] Mini Starter post-download edit entitlement recorded');
              }
            }
          } catch (syncError) {
            console.warn('⚠️ [Export] Edit entitlement sync failed (non-fatal):', syncError);
          }

          const paymentStatusResponse = await fetch('/api/payments/status');
          
          // If API returns 401 (Unauthorized), user needs to login
          if (paymentStatusResponse.status === 401) {
            console.log('🔒 [Export] User not authenticated (401) - redirecting to login');
            setExporting(null);
            toast({
              title: 'Authentication Required',
              description: 'Please log in to download your resume.',
              variant: 'default',
              duration: 5000,
            });
            
            // Store resume data and redirect to login
            const resumeDataToSave = {
              formData: formData,
              templateId: templateId,
              typeId: typeId,
              selectedColorId: selectedColorId,
              currentStep: 'finalize',
              timestamp: Date.now(),
            };
            sessionStorage.setItem('resume-builder-payment-flow', JSON.stringify(resumeDataToSave));
            const currentUrl = window.location.pathname + window.location.search;
            sessionStorage.setItem('resume-builder-return-url', currentUrl);
            sessionStorage.setItem('resume-builder-needs-payment', 'true');
            
            router.push(`/auth/signin?redirect=${encodeURIComponent(currentUrl)}`);
            return;
          }
          
          if (paymentStatusResponse.ok) {
            const paymentStatus = await paymentStatusResponse.json();
            console.log('📊 [Export] Payment status response:', JSON.stringify(paymentStatus, null, 2));
            
            // CRITICAL: Check if user has active plan FIRST
            // This catches new users with no plan
            if (!paymentStatus.isActive || !paymentStatus.planType) {
              console.log('💳 [Export] No active plan detected:', {
                isActive: paymentStatus.isActive,
                planType: paymentStatus.planType,
                message: paymentStatus.message
              });
              setPendingExportFormat(format);
              openPlanSelectionDialog(format);
              return;
            }

            // For business plans, check if they have credits remaining
            if (paymentStatus.planType === 'business') {
              const creditsRemaining = paymentStatus.subscription?.creditsRemaining ?? 0;
              console.log('💼 [Export] Business plan check - credits remaining:', creditsRemaining);
              if (creditsRemaining <= 0) {
                console.log('💳 [Export] Business plan - no credits remaining - showing payment dialog');
                openPlanSelectionDialog(format);
                return;
              }
            } 
            // For individual plans, check PDF download credits
            else if (paymentStatus.planType === 'individual') {
              // CRITICAL FIX: Check if credits object exists, if not, show payment dialog
              if (!paymentStatus.credits || !paymentStatus.credits.pdfDownloads) {
                console.log('💳 [Export] Individual plan - missing credits data - showing payment dialog', {
                  hasCredits: !!paymentStatus.credits,
                  hasPdfDownloads: !!paymentStatus.credits?.pdfDownloads
                });
                openPlanSelectionDialog(format);
                return;
              }
              
              const pdfCredits = paymentStatus.credits.pdfDownloads;
              console.log('📄 [Export] Individual plan - PDF credits:', {
                remaining: pdfCredits.remaining,
                used: pdfCredits.used,
                limit: pdfCredits.limit
              });
              
              // Check if credits are exhausted
              if (!pdfCredits.remaining || pdfCredits.remaining <= 0) {
                console.log('🚫 [Export] Individual plan - PDF download limit reached');
                openPdfDownloadLimitDialog({
                  downloadsUsed: pdfCredits.used,
                  downloadsAllowed: pdfCredits.limit,
                  planKey: paymentStatus.planName,
                });
                return;
              }
            } else {
              // Unknown plan type - show payment dialog for safety
              console.warn('⚠️ [Export] Unknown plan type:', paymentStatus.planType);
              openPlanSelectionDialog(format);
              return;
            }
          } else {
            // If payment status API returns error (non-401), show payment dialog
            console.log('💳 [Export] Payment status check failed (non-401) - showing payment dialog', {
              status: paymentStatusResponse.status,
              statusText: paymentStatusResponse.statusText
            });
            openPlanSelectionDialog(format);
            return;
          }
        } catch (paymentCheckError) {
          console.error('❌ [Export] Payment status check exception:', paymentCheckError);
          // Show payment dialog if check fails
          openPlanSelectionDialog(format);
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
        // IMPORTANT: Read response once and clone if needed, or use text() and parse
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
        
        // Download quota exhausted on an active plan — not a new purchase flow
        if (error.downloadLimitReached) {
          console.log('🚫 [Export] PDF download limit reached', error);
          openPdfDownloadLimitDialog({
            downloadsUsed: error.downloadsUsed,
            downloadsAllowed: error.downloadsAllowed,
            planName: error.planName,
            planKey: error.planKey,
          });
          return;
        }

        // Check if payment is required (backend check) - ALWAYS handle this first
        if (error.requiresPayment || response.status === 403 || response.status === 401) {
          console.log('💳 [Export] Backend requires payment - showing payment dialog', { 
            requiresPayment: error.requiresPayment, 
            status: response.status,
            error 
          });
          openPlanSelectionDialog(format);
          return;
        }
        
        // If server-side export failed and fallback is suggested, try client-side (desktop only)
        if (error.fallback && format === 'pdf' && response.status !== 403 && response.status !== 401) {
          logExportFailure('api-fallback-suggested', {
            status: response.status,
            contentType,
            error,
          });
          if (isMobilePdfDeliveryDevice()) {
            showMobilePdfGenerationFailed();
            return;
          }
          console.log('📄 [Export] Server-side PDF export unavailable, using client-side fallback...');
          await handleClientSidePDFExport();
          return;
        }
        
        throw new Error(error.error || error.details || 'Export failed');
      }

      // Verify we received a PDF
      if (!contentType.includes('application/pdf')) {
        logExportFailure('invalid-content-type', { status: response.status, contentType });
        console.error('❌ [Export] Invalid content type received:', contentType);
        // For non-PDF responses, read as text first to check if it's an error
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          // Check if it's a download limit error
          if (errorData.downloadLimitReached) {
            console.log('🚫 [Export] Download limit in non-PDF response');
            openPdfDownloadLimitDialog({
              downloadsUsed: errorData.downloadsUsed,
              downloadsAllowed: errorData.downloadsAllowed,
              planName: errorData.planName,
              planKey: errorData.planKey,
            });
            return;
          }
          // Check if it's a payment error
          if (errorData.requiresPayment || errorData.error === 'Unauthorized') {
            console.log('💳 [Export] Invalid content type but payment error detected - showing payment dialog');
            openPlanSelectionDialog(format);
            return;
          }
          throw new Error(errorData.error || errorData.details || 'Invalid response from server');
        } catch (jsonError) {
          if (isMobilePdfDeliveryDevice()) {
            showMobilePdfGenerationFailed();
            return;
          }
          throw new Error('Server did not return a valid PDF. Please try again.');
        }
      }

      // Handle PDF download
      const blob = await response.blob();
      
      // Validate blob is not empty and appears to be a PDF
      if (blob.size === 0) {
        throw new Error('Received empty PDF file. Please try again.');
      }
      
      logExportDiagnostics({
        status: response.status,
        contentType,
        blobType: blob.type,
        blobSize: blob.size,
      });

      // Check if blob starts with PDF magic bytes (%PDF)
      const firstBytes = await blob.slice(0, 4).text();
      if (!firstBytes.startsWith('%PDF')) {
        logExportFailure('invalid-pdf-magic-bytes', {
          status: response.status,
          contentType,
          blobType: blob.type,
          blobSize: blob.size,
        });
        console.error('❌ [Export] Blob does not appear to be a valid PDF');
        const errorText = await blob.text();
        let parsedError: { error?: string; details?: string } | null = null;
        try {
          parsedError = JSON.parse(errorText);
        } catch {
          parsedError = null;
        }
        if (isMobilePdfDeliveryDevice()) {
          showMobilePdfGenerationFailed();
          return;
        }
        throw new Error(
          parsedError?.error || parsedError?.details || 'Received invalid PDF file. Please try again.'
        );
      }

      const filename = `resume-${templateId}-${Date.now()}.pdf`;

      // Mobile and desktop: deliver immediately after successful generation (one tap on mobile).
      const delivery = await deliverPdfBlob(blob, filename);

      if (delivery.showDownloadModal) {
        setMobileDownloadFallback(delivery.showDownloadModal);
        toast({
          title: 'PDF ready',
          description: 'Tap the download link to save your resume PDF.',
        });
      } else if (!delivery.success) {
        if (delivery.error === 'cancelled') {
          toast(getPdfDeliveryFeedback(delivery.device, delivery));
          return;
        }
        logExportFailure('pdf-delivery-failed', {
          error: delivery.error,
          deviceType: delivery.device.deviceType,
        });
        if (isMobilePdfDeliveryDevice()) {
          showMobilePdfGenerationFailed();
          return;
        }
        throw new Error('PDF delivery failed');
      } else {
        toast(getPdfDeliveryFeedback(delivery.device, delivery));
      }

      setMobilePdfReadyAfterPayment(false);

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
      
      // Check if error is related to payment/authentication - don't trigger client-side fallback
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      const isPaymentError = errorMessage.toLowerCase().includes('payment') || 
                            errorMessage.toLowerCase().includes('unauthorized') ||
                            errorMessage.toLowerCase().includes('forbidden') ||
                            errorMessage.toLowerCase().includes('requires payment');
      
      if (isPaymentError) {
        // Payment-related error - show payment dialog instead of fallback
        console.log('💳 [Export] Payment error detected in catch block - showing payment dialog');
        openPlanSelectionDialog(format);
        return;
      }
      
      // Client-side HTML fallback — desktop only; never open HTML preview on mobile
      if (format === 'pdf' && !isPaymentError) {
        logExportFailure('export-catch', { errorMessage });
        if (isMobilePdfDeliveryDevice()) {
          showMobilePdfGenerationFailed();
          return;
        }
        console.log('📄 Attempting client-side PDF export fallback...');
        try {
          await handleClientSidePDFExport();
          return;
        } catch (fallbackError: unknown) {
          console.error('Client-side PDF export also failed:', fallbackError);
        }
      }
      
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
          ${PDF_PAGINATION_PRINT_CSS}

          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              margin: 0;
              padding: 0;
              width: 100%;
              overflow: visible;
            }

            .resume-container {
              width: 794px !important;
              max-width: 794px !important;
              box-shadow: none !important;
              margin: 0 !important;
            }

            [style*="background"],
            [class*="bg-"],
            [class*="background"],
            .profile-image-wrapper,
            .profile-placeholder,
            .psp-skill-bar-fill,
            .psp-language-bar-fill,
            .skill-progress,
            .language-progress {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            [style*="border"],
            [class*="border"] {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            img {
              display: block !important;
              max-width: 100% !important;
              height: auto !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            svg {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
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

  const runDesktopPostPaymentExportWithRetries = (
    exportFormat: 'pdf',
    maxAttempts = 3
  ): void => {
    const attemptDownload = async (attempt: number = 1): Promise<void> => {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);

      console.log(
        `🔄 [Post-Payment Export] Desktop download attempt ${attempt}/${maxAttempts} after ${delay}ms`
      );

      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            await handleExport(exportFormat, true);
            console.log(`✅ [Post-Payment Export] Download succeeded on attempt ${attempt}`);
            resolve();
          } catch (exportError: unknown) {
            const errorMessage =
              exportError instanceof Error ? exportError.message : String(exportError);
            console.warn(`⚠️ [Post-Payment Export] Attempt ${attempt} failed:`, errorMessage);

            if (attempt < maxAttempts) {
              try {
                await attemptDownload(attempt + 1);
              } catch {
                // handled on final attempt
              }
              resolve();
              return;
            }

            toast({
              title: 'Download failed',
              description:
                'Payment was successful, but download failed. Please try downloading manually.',
              variant: 'destructive',
            });
            resolve();
          }
        }, delay);
      });
    };

    attemptDownload().catch((error) => {
      console.error('❌ [Post-Payment Export] Unexpected error in retry logic:', error);
    });
  };

  const offerPostPaymentPdfDownload = (toastOptions?: {
    title: string;
    description?: string;
    maxAttempts?: number;
  }): void => {
    setShowPaymentDialog(false);
    setLoadingPlan(null);
    setSkipPaymentCheck(true);

    const exportFormat: 'pdf' = pendingExportFormat || 'pdf';
    if (!pendingExportFormat) {
      setPendingExportFormat('pdf');
    }

    if (isMobilePdfDeliveryDevice()) {
      toast({
        title: toastOptions?.title ?? 'Payment successful!',
        description: toastOptions?.description ?? 'Downloading your resume...',
      });
      console.log('📱 [Post-Payment Export] One-tap mobile PDF download', {
        exportFormat,
        device: getPdfDeliveryDeviceInfo(),
      });
      void handleExport(exportFormat, true);
      return;
    }

    if (toastOptions?.title) {
      toast({
        title: toastOptions.title,
        description: toastOptions?.description ?? 'Downloading your resume...',
      });
    }

    runDesktopPostPaymentExportWithRetries(exportFormat, toastOptions?.maxAttempts ?? 3);
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
      // Detect mobile device for mobile-specific handling
      const isMobile = typeof window !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768)
      );

      // Create order
      const appliedCoupon = couponQuotes[planKey];
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Required to send session cookies
        body: JSON.stringify({
          planKey,
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        }),
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

      if (isAdminPlanBypassResponse(data)) {
        setLoadingPlan(null);
        offerPostPaymentPdfDownload({
          title: 'Admin plan activated',
          description: `${INDIVIDUAL_PLANS[data.planKey as IndividualPlanKey]?.name ?? data.planKey} activated for testing.`,
        });
        return;
      }

      const { orderId, amount, keyId } = data;

      if (!keyId) {
        console.error('❌ [Payment] Missing keyId in API response:', data);
        throw new Error('Payment gateway not configured. Please contact support.');
      }

      if (!window.Razorpay) {
        console.error('❌ [Payment] Razorpay SDK not available. Current state:', {
          razorpayLoaded,
          windowRazorpay: typeof window.Razorpay,
          scriptLoaded: document.querySelector('script[src*="checkout.razorpay.com"]') !== null,
          scriptSrc: document.querySelector('script[src*="checkout.razorpay.com"]')?.getAttribute('src')
        });
        throw new Error('Razorpay SDK not loaded. Please refresh the page or disable ad blockers.');
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
                offerPostPaymentPdfDownload({
                  title: 'Verification timeout',
                  description:
                    'Payment verified on Razorpay. PDF ready — tap Download PDF below.',
                });
                return;
              }
              
              // Handle 404 or other fetch errors
              if (fetchError.message?.includes('404') || fetchError.message?.includes('Failed to fetch')) {
                console.error('❌ [Payment Handler] Verification endpoint not found (404) or network error:', fetchError);
                offerPostPaymentPdfDownload({
                  title: 'Payment successful!',
                  description: 'Payment confirmed. PDF ready — tap Download PDF below.',
                  maxAttempts: 5,
                });
                return; // Don't throw - we've handled it with fallback
              }
              
              throw fetchError; // Re-throw other unexpected errors
            }

            console.log('📥 [Payment Handler] Verify response status:', verifyResponse.status, verifyResponse.statusText);

            // CRITICAL: Handle 404 response - endpoint might not exist or be misconfigured
            if (verifyResponse.status === 404) {
              console.error('❌ [Payment Handler] Verification endpoint returned 404 - endpoint not found');
              offerPostPaymentPdfDownload({
                title: 'Payment successful!',
                description: 'Payment confirmed. PDF ready — tap Download PDF below.',
                maxAttempts: 8,
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
                offerPostPaymentPdfDownload({
                  title: 'Payment successful',
                  description: 'Payment confirmed. PDF ready — tap Download PDF below.',
                });
              } else {
                setLoadingPlan(null);
                toast({
                  title: 'Verification error',
                  description:
                    'Invalid response from payment verification server. Please contact support.',
                  variant: 'destructive',
                });
              }
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

              if (result.conversion) {
                await triggerGoAffProConversionAfterVerify(result);
              }

              offerPostPaymentPdfDownload({
                title: 'Payment successful!',
                description: result.alreadyProcessed
                  ? 'Payment was already processed. PDF ready — tap Download PDF below.'
                  : 'Plan activated. PDF ready — tap Download PDF below.',
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
          escape: true,
          backdropclose: true,
          animation: true,
          // Mobile-specific options to ensure proper rendering
          ...(isMobile && {
            position: 'center',
            backdrop: true,
            keyboard: true,
          }),
        },
        // Mobile-specific configuration
        ...(isMobile && {
          config: {
            display: {
              blocks: {
                banks: {
                  name: 'All payment methods',
                  instruments: [
                    {
                      method: 'card',
                    },
                    {
                      method: 'netbanking',
                    },
                    {
                      method: 'wallet',
                    },
                    {
                      method: 'upi',
                    },
                  ],
                },
              },
              sequence: ['block.banks'],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
        }),
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

      // Open Razorpay checkout
      // CRITICAL for mobile: Open immediately and synchronously to preserve user gesture
      const razorpay = new window.Razorpay(options);
      
      // Open immediately - mobile browsers require this to be synchronous with user gesture
      try {
        razorpay.open();
        console.log('✅ [Payment] Razorpay checkout opened', { isMobile });
      } catch (openError) {
        console.error('❌ [Payment] Failed to open Razorpay:', openError);
        setLoadingPlan(null);
        toast({
          title: 'Payment error',
          description: 'Failed to open payment gateway. Please try again.',
          variant: 'destructive',
        });
        throw openError;
      }
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
      // Detect mobile device for mobile-specific handling
      const isMobile = typeof window !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768)
      );

      // Create subscription
      const appliedCoupon = couponQuotes[planKey];
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey,
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        }),
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

            await triggerGoAffProConversionAfterSubscription(subscriptionId);

            offerPostPaymentPdfDownload({
              title: 'Payment successful!',
              description: 'Business plan activated. PDF ready — tap Download PDF below.',
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
          escape: true,
          backdropclose: true,
          animation: true,
          // Mobile-specific options to ensure proper rendering
          ...(isMobile && {
            position: 'center',
            backdrop: true,
            keyboard: true,
          }),
        },
        // Mobile-specific configuration
        ...(isMobile && {
          config: {
            display: {
              blocks: {
                banks: {
                  name: 'All payment methods',
                  instruments: [
                    {
                      method: 'card',
                    },
                    {
                      method: 'netbanking',
                    },
                    {
                      method: 'wallet',
                    },
                    {
                      method: 'upi',
                    },
                  ],
                },
              },
              sequence: ['block.banks'],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
        }),
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

      // Open Razorpay checkout
      // CRITICAL for mobile: Open immediately and synchronously to preserve user gesture
      const razorpay = new window.Razorpay(options);
      
      // Open immediately - mobile browsers require this to be synchronous with user gesture
      try {
        razorpay.open();
        console.log('✅ [Business Payment] Razorpay checkout opened', { isMobile });
      } catch (openError) {
        console.error('❌ [Business Payment] Failed to open Razorpay:', openError);
        setLoadingPlan(null);
        toast({
          title: 'Payment error',
          description: 'Failed to open payment gateway. Please try again.',
          variant: 'destructive',
        });
        throw openError;
      }
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
          console.log('✅ [Razorpay] Script loaded, checking availability...');
          if (typeof window !== 'undefined' && window.Razorpay) {
            console.log('✅ [Razorpay] SDK available on window');
            setRazorpayLoaded(true);
          } else {
            console.warn('⚠️ [Razorpay] Script loaded but window.Razorpay not available yet');
            // Wait a bit for Razorpay to initialize
            setTimeout(() => {
              if (window.Razorpay) {
                console.log('✅ [Razorpay] SDK available after delay');
                setRazorpayLoaded(true);
              } else {
                console.error('❌ [Razorpay] SDK still not available after delay');
                setRazorpayLoaded(false);
              }
            }, 500);
          }
        }}
        onError={(e) => {
          console.error('❌ [Razorpay] Failed to load SDK:', e);
          setRazorpayLoaded(false);
        }}
        onReady={() => {
          // Double-check Razorpay is available after script is ready
          if (typeof window !== 'undefined' && window.Razorpay) {
            console.log('✅ [Razorpay] SDK ready and available');
            setRazorpayLoaded(true);
          }
        }}
      />

      {/* PDF download limit dialog */}
      <Dialog open={showDownloadLimitDialog} onOpenChange={setShowDownloadLimitDialog}>
        <DialogContent className="resume-limit-dialog max-w-md">
          <DialogHeader>
            <DialogTitle>PDF Download Limit Reached</DialogTitle>
            <DialogDescription>
              You have used all downloads included in your current plan.
            </DialogDescription>
          </DialogHeader>
          {downloadLimitInfo && (
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <span className="font-medium">Downloads used:</span>{' '}
                {downloadLimitInfo.downloadsUsed} / {downloadLimitInfo.downloadsAllowed}
              </p>
              <p>
                <span className="font-medium">Current plan:</span> {downloadLimitInfo.planName}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDownloadLimitDialog(false)}>
              Close
            </Button>
            <Button onClick={() => openPlanSelectionDialog('pdf')}>
              Upgrade Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile PDF download fallback — shown only when share and anchor both fail */}
      <Dialog
        open={mobileDownloadFallback !== null}
        onOpenChange={(open) => {
          if (!open) closeMobileDownloadFallback();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Download your PDF</DialogTitle>
            <DialogDescription>
              Tap the link below to save your resume PDF file.
            </DialogDescription>
          </DialogHeader>
          {mobileDownloadFallback && (
            <a
              href={mobileDownloadFallback.url}
              download={mobileDownloadFallback.filename}
              className="block rounded-md border border-orange-300 bg-orange-50 px-4 py-3 text-center text-sm font-semibold text-orange-900 underline"
            >
              {mobileDownloadFallback.filename}
            </a>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={closeMobileDownloadFallback}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="resume-payment-dialog max-w-5xl w-full max-h-[90vh] sm:max-h-[90vh]">
          <DialogHeader className="resume-payment-dialog__header text-left">
            <DialogTitle className="text-xl sm:text-2xl font-bold pr-2">
              Choose a Plan to Download Resume
            </DialogTitle>
            <DialogDescription className="text-left">
              Select a plan to unlock resume downloads and other premium features.
            </DialogDescription>
          </DialogHeader>

          <div className="resume-payment-dialog__scroll">
          {/* Tabs */}
          <div className="resume-payment-dialog__tabs flex justify-center">
            <div className="inline-flex w-full max-w-md rounded-lg border border-gray-200 bg-white p-1 sm:w-auto">
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
                className={`resume-payment-dialog__plan-card relative rounded-lg border-2 p-6 ${
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
                  {getIndividualPlanFeatureBullets(plan).map((bullet) => (
                    <li key={bullet} className="flex items-center text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <CouponCheckoutBox
                  planKey={plan.key}
                  listPriceRupees={plan.price}
                  appliedQuote={couponQuotes[plan.key] ?? null}
                  onApplied={(quote) =>
                    setCouponQuotes((prev) => ({ ...prev, [plan.key]: quote }))
                  }
                  onRemoved={() =>
                    setCouponQuotes((prev) => ({ ...prev, [plan.key]: null }))
                  }
                  disabled={loadingPlan !== null}
                  className="mb-3"
                />
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
                    `Buy Now - ₹${couponQuotes[plan.key]?.finalPrice ?? plan.price}`
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
                  className={`resume-payment-dialog__plan-card relative rounded-lg border-2 p-6 ${
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
                    {getBusinessPlanFeatureBullets(plan).map((bullet) => (
                      <li key={bullet} className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <CouponCheckoutBox
                    planKey={plan.key}
                    listPriceRupees={plan.price}
                    appliedQuote={couponQuotes[plan.key] ?? null}
                    onApplied={(quote) =>
                      setCouponQuotes((prev) => ({ ...prev, [plan.key]: quote }))
                    }
                    onRemoved={() =>
                      setCouponQuotes((prev) => ({ ...prev, [plan.key]: null }))
                    }
                    disabled={loadingPlan !== null}
                    className="mb-3"
                  />
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
                      `Subscribe - ₹${couponQuotes[plan.key]?.finalPrice ?? plan.price}`
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {!razorpayLoaded && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mt-0.5"></div>
                <div className="flex-1">
                  <div className="font-medium text-yellow-900 mb-1">Loading payment gateway...</div>
                  <div className="text-sm text-yellow-700">
                    <p className="mb-2">If this takes too long, try:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Disable ad blockers or browser extensions</li>
                      <li>Disable VPN if enabled</li>
                      <li>Refresh the page</li>
                      <li>Check your internet connection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
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
      <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-sm">
                <Download className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              Export Resume
            </h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Download your resume as PDF and share it with employers.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center sm:items-start gap-3">
          {mobilePdfReadyAfterPayment && (
            <div className="w-full max-w-md rounded-lg border border-green-300 bg-green-50 p-4 text-center sm:text-left">
              <p className="text-sm font-semibold text-green-900 mb-3">PDF Ready</p>
              <p className="text-sm text-green-800 mb-4">
                Your payment is complete. Tap below to save your resume PDF.
              </p>
              <Button
                onClick={() => {
                  void handleExport('pdf', true);
                }}
                disabled={exporting !== null}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}
          <Button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className="group relative inline-flex flex-row items-center justify-center gap-3 h-12 sm:h-14 px-8 sm:px-10 min-w-[220px] sm:min-w-[260px] bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg rounded-lg"
          >
            {exporting === 'pdf' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent"></div>
                <span className="font-semibold">Generating PDF...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-semibold">Export as PDF</span>
                <Download className="w-4 h-4 sm:w-5 sm:h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            )}
          </Button>
        </div>
      </div>
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

