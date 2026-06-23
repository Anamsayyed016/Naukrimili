/**
 * Payment Service - Database Operations
 * Handles payment and subscription database operations
 */

import { prisma } from '@/lib/prisma';
import { isAiPaymentBypassEnabled } from '@/lib/ai-payment-bypass';
import {
  INDIVIDUAL_PLANS,
  BUSINESS_PLANS,
  PLAN_DISPLAY_NAMES,
  type IndividualPlanKey,
  type BusinessPlanKey,
  type PlanKey,
} from './razorpay-plans';
import {
  findUserCredits,
  incrementPdfDownloadUsage,
  incrementMiniStarterPostEditPdfDownload,
} from '@/lib/db-direct';
import { isPaymentBypassAdmin } from '@/lib/auth-utils';

/** Reuses existing Settings table — no schema migration. */
const INDIVIDUAL_PLAN_USAGE_KEY = 'individual_plan_usage';

/** Mini Starter: 1 plan PDF + 1 post-edit PDF (after lifetimeEditsUsed >= 1). */
const MINI_STARTER_POST_EDIT_DOWNLOAD_CAP = 2;

type IndividualPlanUsage = {
  pdfDailyDate?: string;
  pdfDailyCount?: number;
  usedPremiumTemplates?: string[];
  editDailyDate?: string;
  editDailyCount?: number;
  lifetimeEditsUsed?: number;
};

export const EDIT_LIMIT_MESSAGES = {
  miniBeforeDownload:
    'Resume editing unlocks after your first PDF download.',
  miniEditUsed: 'Your included resume edit has already been used.',
  dailyLimit: "You have reached today's edit limit. Please try again tomorrow.",
} as const;

function calendarDayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPdfDownloadQuota(credits: Record<string, unknown>): {
  used: number;
  limit: number;
  remaining: number;
} {
  const used = Number(credits.pdfDownloads) || 0;
  const limit = Number(credits.pdfDownloadsLimit) || 0;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

function getMiniStarterEffectivePdfCap(planLimit: number, lifetimeEditsUsed: number): number {
  return lifetimeEditsUsed >= 1 ? MINI_STARTER_POST_EDIT_DOWNLOAD_CAP : planLimit;
}

/**
 * Resolves PDF download entitlement including Mini Starter post-edit allowance.
 * Other individual plans use stored pdfDownloadsLimit only.
 */
export async function resolvePdfDownloadEntitlement(
  userId: string,
  credits: Record<string, unknown>
): Promise<{
  used: number;
  limit: number;
  remaining: number;
  effectiveLimit: number;
  planKey: string | null;
}> {
  const used = Number(credits.pdfDownloads) || 0;
  const limit = Number(credits.pdfDownloadsLimit) || 0;
  const planKey = typeof credits.planName === 'string' ? credits.planName : null;

  if (planKey === 'mini_starter') {
    const usage = await getIndividualPlanUsage(userId);
    const effectiveLimit = getMiniStarterEffectivePdfCap(limit, usage.lifetimeEditsUsed ?? 0);
    return {
      used,
      limit,
      remaining: Math.max(0, effectiveLimit - used),
      effectiveLimit,
      planKey,
    };
  }

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    effectiveLimit: limit,
    planKey,
  };
}

async function canMiniStarterUsePostEditDownload(
  userId: string,
  credits: Record<string, unknown>
): Promise<boolean> {
  const used = Number(credits.pdfDownloads) || 0;
  const limit = Number(credits.pdfDownloadsLimit) || 0;
  if (limit <= 0 || used < limit) {
    return false;
  }
  const usage = await getIndividualPlanUsage(userId);
  return (usage.lifetimeEditsUsed ?? 0) >= 1 && used < MINI_STARTER_POST_EDIT_DOWNLOAD_CAP;
}

export function resolvePlanDisplayName(planKey: string | null | undefined): string {
  if (!planKey) return 'Current plan';
  return PLAN_DISPLAY_NAMES[planKey as PlanKey] || planKey.replace(/_/g, ' ');
}

export function formatPdfDownloadLimitMessage(
  planKey: string | null | undefined,
  used: number,
  limit: number
): string {
  const planName = resolvePlanDisplayName(planKey);
  const downloadWord = limit === 1 ? 'download' : 'downloads';
  return `You have used all ${limit} PDF ${downloadWord} included in your ${planName} plan.`;
}

export function buildPdfDownloadLimitPayload(credits: Record<string, unknown>) {
  const { used, limit } = getPdfDownloadQuota(credits);
  const planKey = typeof credits.planName === 'string' ? credits.planName : undefined;
  const planName = resolvePlanDisplayName(planKey);
  return {
    error: formatPdfDownloadLimitMessage(planKey, used, limit),
    requiresPayment: true,
    downloadLimitReached: true,
    downloadsUsed: used,
    downloadsAllowed: limit,
    planName,
    planKey,
    title: 'PDF Download Limit Reached',
    description: 'You have used all downloads included in your current plan.',
  };
}

function planHasAtsFeature(ats: string | boolean | undefined): boolean {
  return ats === 'basic' || ats === 'advanced' || ats === true;
}

function atsTierFromPlanFeatures(
  features: { atsOptimization?: string | boolean } | undefined | null
): 'basic' | 'advanced' | 'none' {
  if (!features) return 'none';
  if (features.atsOptimization === 'advanced') return 'advanced';
  if (features.atsOptimization === 'basic') return 'basic';
  return 'none';
}

function computeBusinessSubscriptionExpiresAt(startDate: Date, planKey: BusinessPlanKey): Date {
  const plan = BUSINESS_PLANS[planKey];
  const expiresAt = new Date(startDate);
  expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths);
  return expiresAt;
}

function businessActivationCycleKey(subscriptionId: string, startDate: Date): string {
  return `${subscriptionId}:${startDate.getTime()}`;
}

function computeIndividualValidUntil(
  planKey: IndividualPlanKey,
  existingCredits: { planName?: string | null; validUntil?: Date | string | null; isActive?: boolean } | null
): Date {
  const plan = INDIVIDUAL_PLANS[planKey];
  const now = new Date();
  const base =
    existingCredits?.isActive &&
    existingCredits.planName === planKey &&
    existingCredits.validUntil &&
    new Date(existingCredits.validUntil) > now
      ? new Date(existingCredits.validUntil)
      : now;
  const validUntil = new Date(base);
  validUntil.setDate(validUntil.getDate() + plan.validityDays);
  return validUntil;
}

async function getIndividualPlanUsage(userId: string): Promise<IndividualPlanUsage> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { userId_key: { userId, key: INDIVIDUAL_PLAN_USAGE_KEY } },
    });
    if (!setting?.value || typeof setting.value !== 'object' || Array.isArray(setting.value)) {
      return {};
    }
    return setting.value as IndividualPlanUsage;
  } catch {
    return {};
  }
}

async function setIndividualPlanUsage(userId: string, usage: IndividualPlanUsage): Promise<void> {
  await prisma.settings.upsert({
    where: { userId_key: { userId, key: INDIVIDUAL_PLAN_USAGE_KEY } },
    create: { userId, key: INDIVIDUAL_PLAN_USAGE_KEY, value: usage },
    update: { value: usage },
  });
}

export async function clearIndividualPlanUsage(userId: string): Promise<void> {
  try {
    await prisma.settings.deleteMany({
      where: { userId, key: INDIVIDUAL_PLAN_USAGE_KEY },
    });
  } catch {
    // Non-fatal
  }
}

async function isPremiumTemplateId(templateId: string): Promise<boolean> {
  try {
    const templatesData = await import('@/lib/resume-builder/templates.json');
    const template = templatesData.default.templates?.find((t: { id: string }) => t.id === templateId);
    return Boolean(
      template?.categories?.includes('Premium') || template?.categories?.includes('premium')
    );
  } catch {
    return false;
  }
}

function getIndividualDailyEditCount(usage: IndividualPlanUsage): number {
  const today = calendarDayKey();
  if (usage.editDailyDate !== today) return 0;
  return usage.editDailyCount ?? 0;
}

/** Stable compare for resume form payloads — ignores save metadata noise. */
export function hasMeaningfulResumeDataChange(before: unknown, after: unknown): boolean {
  const normalize = (value: unknown): string => {
    if (value == null) return '';
    if (typeof value !== 'object') return JSON.stringify(value);
    const record = { ...(value as Record<string, unknown>) };
    for (const key of ['updatedAt', 'lastSaved', 'savedAt', '_meta']) {
      delete record[key];
    }
    return JSON.stringify(record, Object.keys(record).sort());
  };
  return normalize(before) !== normalize(after);
}

async function recordResumeEditUsage(userId: string, planKey: IndividualPlanKey): Promise<void> {
  const usage = await getIndividualPlanUsage(userId);

  if (planKey === 'mini_starter') {
    await setIndividualPlanUsage(userId, {
      ...usage,
      lifetimeEditsUsed: (usage.lifetimeEditsUsed ?? 0) + 1,
    });
    return;
  }

  if (planKey === 'starter_premium' || planKey === 'pro_job_seeker') {
    const today = calendarDayKey();
    const count =
      usage.editDailyDate === today ? (usage.editDailyCount ?? 0) + 1 : 1;
    await setIndividualPlanUsage(userId, {
      ...usage,
      editDailyDate: today,
      editDailyCount: count,
    });
  }
}

/**
 * Increment edit quota after a confirmed meaningful resume save.
 * Business subscribers are not metered on individual edit limits.
 */
export async function recordResumeEdit(userId: string): Promise<void> {
  const businessCheck = await checkBusinessSubscription(userId);
  if (businessCheck.isActive) {
    return;
  }

  const validity = await checkIndividualPlanValidity(userId);
  if (!validity.isValid || !validity.credits?.planName) {
    return;
  }

  const planKey = validity.credits.planName as IndividualPlanKey;
  if (!(planKey in INDIVIDUAL_PLANS)) {
    return;
  }

  await recordResumeEditUsage(userId, planKey);
}

function getIndividualDailyPdfCount(usage: IndividualPlanUsage): number {
  const today = calendarDayKey();
  if (usage.pdfDailyDate !== today) return 0;
  return usage.pdfDailyCount ?? 0;
}

async function recordIndividualDailyPdfDownload(userId: string): Promise<void> {
  const usage = await getIndividualPlanUsage(userId);
  const today = calendarDayKey();
  const count = usage.pdfDailyDate === today ? (usage.pdfDailyCount ?? 0) + 1 : 1;
  await setIndividualPlanUsage(userId, {
    ...usage,
    pdfDailyDate: today,
    pdfDailyCount: count,
  });
}

async function registerPremiumTemplateSlot(userId: string, templateId: string): Promise<void> {
  const usage = await getIndividualPlanUsage(userId);
  const used = usage.usedPremiumTemplates ?? [];
  if (used.includes(templateId)) return;
  await setIndividualPlanUsage(userId, {
    ...usage,
    usedPremiumTemplates: [...used, templateId],
  });
}

/**
 * Activate Individual Plan after successful payment
 */
export async function activateIndividualPlan(params: {
  userId: string;
  paymentId: string;
  planKey: IndividualPlanKey;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    select: { metadata: true, userId: true, status: true },
  });

  if (!payment || payment.userId !== params.userId) {
    throw new Error('Payment not found for plan activation');
  }

  const paymentMeta =
    payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
      ? (payment.metadata as Record<string, unknown>)
      : {};

  if (paymentMeta.individualPlanActivated === true) {
    const existing = await prisma.userCredits.findUnique({ where: { userId: params.userId } });
    if (existing) return existing;
  }

  const plan = INDIVIDUAL_PLANS[params.planKey];

  const existingCredits = await prisma.userCredits.findUnique({
    where: { userId: params.userId },
  });

  const validUntil = computeIndividualValidUntil(params.planKey, existingCredits);

  const aiResumeLimit = plan.features.aiResumeUsage === -1 ? 999999 : plan.features.aiResumeUsage;
  const aiCoverLetterLimit = plan.features.aiCoverLetterUsage === -1 ? 999999 : plan.features.aiCoverLetterUsage;
  const atsEnabled = planHasAtsFeature(plan.features.atsOptimization);

  const activationData = {
    resumeDownloadsLimit: plan.features.pdfDownloads,
    resumeDownloads: 0,
    aiResumeLimit,
    aiResumeUsage: 0,
    aiCoverLetterLimit,
    aiCoverLetterUsage: 0,
    templateAccess: plan.features.templateAccess,
    atsOptimization: atsEnabled,
    pdfDownloadsLimit: plan.features.pdfDownloads,
    pdfDownloads: 0,
    docxDownloadsLimit: 0,
    validUntil,
    planType: 'individual' as const,
    planName: params.planKey,
    isActive: true,
  };

  const userCredits = existingCredits
    ? await prisma.userCredits.update({
        where: { userId: params.userId },
        data: activationData,
      })
    : await prisma.userCredits.create({
        data: {
          userId: params.userId,
          ...activationData,
        },
      });

  await clearIndividualPlanUsage(params.userId);

  await prisma.payment.update({
    where: { id: params.paymentId },
    data: {
      metadata: {
        ...paymentMeta,
        individualPlanActivated: true,
        activatedPlanKey: params.planKey,
        activatedAt: new Date().toISOString(),
      },
    },
  });

  return userCredits;
}

/**
 * Admin testing bypass — reuses activateIndividualPlan (same entitlements as verify/webhook).
 */
export async function activateIndividualPlanAdminBypass(params: {
  userId: string;
  planKey: IndividualPlanKey;
  adminUserId: string;
}) {
  const authorized = await isPaymentBypassAdmin(params.adminUserId);
  if (!authorized) {
    throw new Error('Admin authorization required for plan bypass');
  }

  const plan = INDIVIDUAL_PLANS[params.planKey];
  const orderId = `admin_bypass_${params.userId}_${params.planKey}_${Date.now()}`;

  const payment = await prisma.payment.create({
    data: {
      userId: params.userId,
      razorpayOrderId: orderId,
      razorpayPaymentId: `admin_${orderId}`,
      planType: 'individual',
      planName: params.planKey,
      amount: plan.amount,
      originalAmount: plan.amount,
      currency: 'INR',
      status: 'captured',
      metadata: {
        adminBypass: true,
        bypassedByAdminId: params.adminUserId,
        bypassedAt: new Date().toISOString(),
      },
    },
  });

  const userCredits = await activateIndividualPlan({
    userId: params.userId,
    paymentId: payment.id,
    planKey: params.planKey,
  });

  return { payment, userCredits };
}

/**
 * Activate Business Subscription after successful payment
 */
export async function activateBusinessSubscription(params: {
  userId: string;
  paymentId: string;
  subscriptionId: string;
  planKey: BusinessPlanKey;
  razorpayPlanId: string;
  startDate: Date;
  endDate: Date;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    select: { metadata: true, userId: true, status: true },
  });

  if (!payment || payment.userId !== params.userId) {
    throw new Error('Payment not found for business subscription activation');
  }

  const paymentMeta =
    payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
      ? (payment.metadata as Record<string, unknown>)
      : {};

  const cycleKey = businessActivationCycleKey(params.subscriptionId, params.startDate);

  if (
    paymentMeta.businessPlanActivated === true &&
    paymentMeta.businessActivationCycle === cycleKey
  ) {
    const existing = await prisma.subscription.findUnique({ where: { userId: params.userId } });
    if (existing) return existing;
  }

  const plan = BUSINESS_PLANS[params.planKey];
  const expiresAt = computeBusinessSubscriptionExpiresAt(params.startDate, params.planKey);
  const creditPool = plan.features.resumeCredits;

  // Create or update subscription
  const subscription = await prisma.subscription.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      paymentId: params.paymentId,
      razorpaySubscriptionId: params.subscriptionId,
      razorpayPlanId: params.razorpayPlanId,
      planName: params.planKey,
      status: 'active',
      currentStart: params.startDate,
      currentEnd: params.endDate,
      expiresAt,
      billingCycle: plan.billingCycle,
      totalCredits: creditPool,
      usedCredits: 0,
      remainingCredits: creditPool,
      autoRenew: true,
    },
    update: {
      paymentId: params.paymentId,
      razorpaySubscriptionId: params.subscriptionId,
      razorpayPlanId: params.razorpayPlanId,
      planName: params.planKey,
      status: 'active',
      currentStart: params.startDate,
      currentEnd: params.endDate,
      expiresAt,
      billingCycle: plan.billingCycle,
      totalCredits: creditPool,
      usedCredits: 0,
      remainingCredits: creditPool,
      autoRenew: true,
      cancelledAt: null,
      cancelledReason: null,
    },
  });

  // Update user credits for business plan
  await prisma.userCredits.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      planType: 'business',
      planName: params.planKey,
      isActive: true,
      validUntil: expiresAt,
    },
    update: {
      planType: 'business',
      planName: params.planKey,
      isActive: true,
      validUntil: expiresAt,
    },
  });

  await prisma.payment.update({
    where: { id: params.paymentId },
    data: {
      metadata: {
        ...paymentMeta,
        businessPlanActivated: true,
        businessActivationCycle: cycleKey,
        activatedPlanKey: params.planKey,
        activatedSubscriptionId: params.subscriptionId,
        activatedAt: new Date().toISOString(),
      },
    },
  });

  return subscription;
}

/**
 * Sync billing-cycle dates for an active business subscription (no credit refresh).
 */
export async function syncBusinessSubscriptionBillingCycle(params: {
  razorpaySubscriptionId: string;
  currentStart: Date;
  currentEnd: Date;
}): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { razorpaySubscriptionId: params.razorpaySubscriptionId },
  });

  if (!subscription || subscription.status !== 'active') {
    return false;
  }

  if (
    subscription.currentStart.getTime() === params.currentStart.getTime() &&
    subscription.currentEnd.getTime() === params.currentEnd.getTime()
  ) {
    return false;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      currentStart: params.currentStart,
      currentEnd: params.currentEnd,
    },
  });

  return true;
}

/**
 * Deduct credits for resume download (Business plans)
 * Extended to track per-resume downloads in metadata
 */
export async function deductResumeCredits(params: {
  userId: string;
  credits: number;
  reason: string;
  description?: string;
  resumeId?: string;
}) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId: params.userId },
  });

  if (!subscription || subscription.status !== 'active') {
    throw new Error('No active subscription found');
  }

  if (subscription.remainingCredits < params.credits) {
    throw new Error('Insufficient credits');
  }

  // Update subscription credits
  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      usedCredits: { increment: params.credits },
      remainingCredits: { decrement: params.credits },
    },
  });

  // Create credit transaction record with metadata for per-resume tracking
  await prisma.creditTransaction.create({
    data: {
      subscriptionId: subscription.id,
      userId: params.userId,
      type: 'deduct',
      amount: params.credits,
      reason: params.reason,
      description: params.description,
      metadata: params.resumeId ? { resumeId: params.resumeId } : undefined,
    },
  });

  return updated;
}

/**
 * Check if user has valid individual plan
 * Uses direct DB connection first (bypasses Prisma auth issues), falls back to Prisma
 */
export async function checkIndividualPlanValidity(userId: string): Promise<{
  isValid: boolean;
  credits?: any;
  daysRemaining?: number;
}> {
  // Try direct DB connection first (more reliable)
  let credits = await findUserCredits(userId);
  
  // Fallback to Prisma if direct DB fails
  if (!credits) {
    try {
      credits = await prisma.userCredits.findUnique({
        where: { userId },
      });
    } catch (prismaError: any) {
      console.warn('⚠️ [Payment Service] Prisma check failed, using direct DB only:', prismaError?.message);
    }
  }

  if (!credits || !credits.isActive || credits.planType !== 'individual') {
    return { isValid: false };
  }

  if (!credits.validUntil) {
    return { isValid: false };
  }

  const now = new Date();
  const validUntil = new Date(credits.validUntil);

  if (validUntil < now) {
    // Plan expired, deactivate (try direct DB first, fallback to Prisma)
    try {
      // Try to update via direct DB (would need to add update function to db-direct.js)
      // For now, just try Prisma
      await prisma.userCredits.update({
        where: { userId },
        data: { isActive: false },
      });
    } catch (updateError: any) {
      console.warn('⚠️ [Payment Service] Failed to deactivate expired plan:', updateError?.message);
    }
    return { isValid: false };
  }

  const daysRemaining = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isValid: true,
    credits,
    daysRemaining,
  };
}

/**
 * Check if user has active business subscription
 * Extended to check daily limits and per-resume limits
 */
export async function checkBusinessSubscription(userId: string, resumeId?: string): Promise<{
  isActive: boolean;
  subscription?: any;
  creditsRemaining?: number;
  dailyLimitReached?: boolean;
  perResumeLimitReached?: boolean;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { creditTransactions: { orderBy: { createdAt: 'desc' } } },
  });

  if (!subscription) {
    return { isActive: false };
  }

  const now = new Date();
  if (subscription.status !== 'active' || subscription.expiresAt < now) {
    return { isActive: false };
  }

  // Get plan configuration
  const planKey = subscription.planName as keyof typeof BUSINESS_PLANS;
  const plan = planKey ? BUSINESS_PLANS[planKey] : null;

  // Check daily download limit
  if (plan && plan.features.maxDownloadsPerDay !== null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count downloads today from credit transactions
    const todayDownloads = subscription.creditTransactions.filter(
      (tx) => 
        tx.type === 'deduct' && 
        tx.reason === 'resume_download' &&
        tx.createdAt >= today &&
        tx.createdAt < tomorrow
    ).length;

    if (todayDownloads >= plan.features.maxDownloadsPerDay) {
      return {
        isActive: true,
        subscription,
        creditsRemaining: subscription.remainingCredits,
        dailyLimitReached: true,
      };
    }
  }

  // Check per-resume download limit (only for Business Partner plan)
  if (plan && plan.features.maxDownloadsPerCandidate !== null && resumeId) {
    const resumeDownloads = subscription.creditTransactions.filter(
      (tx) =>
        tx.type === 'deduct' &&
        tx.reason === 'resume_download' &&
        (tx.metadata as any)?.resumeId === resumeId
    ).length;

    if (resumeDownloads >= plan.features.maxDownloadsPerCandidate) {
      return {
        isActive: true,
        subscription,
        creditsRemaining: subscription.remainingCredits,
        perResumeLimitReached: true,
      };
    }
  }

  // Check credit availability
  if (subscription.remainingCredits <= 0) {
    return {
      isActive: true,
      subscription,
      creditsRemaining: 0,
    };
  }

  return {
    isActive: true,
    subscription,
    creditsRemaining: subscription.remainingCredits,
  };
}

/**
 * Check if user can download resume (individual plan)
 * Extended to support PDF downloads, daily limits, and plan-based restrictions
 */
export async function canDownloadResume(userId: string, resumeId?: string): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
  dailyLimitReached?: boolean;
  downloadLimitReached?: boolean;
  downloadsUsed?: number;
  downloadsAllowed?: number;
  planName?: string;
  planKey?: string;
}> {
  const validity = await checkIndividualPlanValidity(userId);
  
  if (!validity.isValid || !validity.credits) {
    console.log(`❌ [canDownloadResume] No valid plan for user ${userId}`);
    return { allowed: false, reason: 'No active plan or plan expired' };
  }

  const credits = validity.credits as Record<string, unknown>;
  const planKey = credits.planName as keyof typeof INDIVIDUAL_PLANS;
  const plan = planKey ? INDIVIDUAL_PLANS[planKey] : null;

  const { used, limit, remaining, effectiveLimit } = await resolvePdfDownloadEntitlement(
    userId,
    credits
  );
  
  console.log(`🔍 [canDownloadResume] Checking download limit for user ${userId}:`, {
    planName: credits.planName,
    pdfDownloads: used,
    pdfDownloadsLimit: limit,
    effectiveLimit,
    remaining,
    planFeatures: plan?.features,
  });
  
  if (limit <= 0) {
    return {
      allowed: false,
      reason: 'No PDF downloads included in your current plan.',
      remaining: 0,
      downloadLimitReached: true,
      downloadsUsed: used,
      downloadsAllowed: effectiveLimit,
      planName: resolvePlanDisplayName(String(credits.planName ?? '')),
      planKey: String(credits.planName ?? ''),
    };
  }

  if (remaining <= 0) {
    console.log(
      `❌ [canDownloadResume] Download limit reached for user ${userId}: ${used}/${effectiveLimit}`
    );
    return {
      allowed: false,
      reason: formatPdfDownloadLimitMessage(String(credits.planName ?? ''), used, effectiveLimit),
      remaining: 0,
      downloadLimitReached: true,
      downloadsUsed: used,
      downloadsAllowed: effectiveLimit,
      planName: resolvePlanDisplayName(String(credits.planName ?? '')),
      planKey: String(credits.planName ?? ''),
    };
  }

  // Check daily limit if plan has maxDownloadsPerDay
  if (plan && plan.features.maxDownloadsPerDay !== null) {
    const usage = await getIndividualPlanUsage(userId);
    const todayDownloads = getIndividualDailyPdfCount(usage);
    if (todayDownloads >= plan.features.maxDownloadsPerDay) {
      console.log(`❌ [canDownloadResume] Daily limit reached for user ${userId}: ${todayDownloads}/${plan.features.maxDownloadsPerDay}`);
      return {
        allowed: false,
        reason: 'Daily download limit reached. Please try again tomorrow.',
        remaining,
        dailyLimitReached: true,
      };
    }
  }

  console.log(`✅ [canDownloadResume] Download allowed for user ${userId}, remaining: ${remaining}`);
  return { allowed: true, remaining };
}

/**
 * Check if user can use AI features (individual plan)
 */
export async function canUseAI(userId: string, feature: 'resume' | 'coverLetter'): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
}> {
  const validity = await checkIndividualPlanValidity(userId);
  
  if (!validity.isValid || !validity.credits) {
    return { allowed: false, reason: 'No active plan or plan expired' };
  }

  const credits = validity.credits;
  const limit = feature === 'resume' ? credits.aiResumeLimit : credits.aiCoverLetterLimit;
  const used = feature === 'resume' ? credits.aiResumeUsage : credits.aiCoverLetterUsage;
  const remaining = limit - used;

  if (remaining <= 0) {
    return { allowed: false, reason: `${feature} AI usage limit reached`, remaining: 0 };
  }

  return { allowed: true, remaining };
}

/**
 * Check if user can edit resume (plan expiry + per-plan edit limits)
 */
export async function canEditResume(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  isLocked?: boolean;
}> {
  const businessCheck = await checkBusinessSubscription(userId);
  if (businessCheck.isActive) {
    return { allowed: true };
  }

  const validity = await checkIndividualPlanValidity(userId);

  if (!validity.isValid || !validity.credits) {
    return {
      allowed: false,
      reason: 'No active plan. Please purchase a plan to edit resumes.',
      isLocked: true,
    };
  }

  const credits = validity.credits;
  const planKey = credits.planName as IndividualPlanKey;
  const plan = planKey in INDIVIDUAL_PLANS ? INDIVIDUAL_PLANS[planKey] : null;

  const now = new Date();
  const validUntil = credits.validUntil ? new Date(credits.validUntil) : null;
  const isExpired = validUntil ? validUntil < now : true;

  if (isExpired) {
    if (plan && (plan.features as { resumeLockedAfterExpiry?: boolean }).resumeLockedAfterExpiry === true) {
      return {
        allowed: false,
        reason: 'Your plan has expired and resumes are locked. Please renew your plan to continue editing.',
        isLocked: true,
      };
    }

    return {
      allowed: false,
      reason: 'Your plan has expired. Please renew your plan to edit resumes.',
      isLocked: true,
    };
  }

  const usage = await getIndividualPlanUsage(userId);

  if (planKey === 'mini_starter') {
    const { used } = getPdfDownloadQuota(credits as Record<string, unknown>);
    if (used < 1) {
      return {
        allowed: false,
        reason: EDIT_LIMIT_MESSAGES.miniBeforeDownload,
        isLocked: true,
      };
    }

    if ((usage.lifetimeEditsUsed ?? 0) >= 1) {
      return {
        allowed: false,
        reason: EDIT_LIMIT_MESSAGES.miniEditUsed,
        isLocked: true,
      };
    }

    return { allowed: true };
  }

  if (planKey === 'starter_premium' || planKey === 'pro_job_seeker') {
    if (getIndividualDailyEditCount(usage) >= 1) {
      return {
        allowed: false,
        reason: EDIT_LIMIT_MESSAGES.dailyLimit,
        isLocked: false,
      };
    }

    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Check if user can access a specific template based on plan
 */
export async function canAccessTemplate(
  userId: string,
  templateId: string,
  options?: { registerUse?: boolean }
): Promise<{
  allowed: boolean;
  reason?: string;
  lockReason?: 'upgrade' | 'slot_limit' | 'error';
}> {
  const registerUse = options?.registerUse ?? false;
  let isPremium = false;

  try {
    isPremium = await isPremiumTemplateId(templateId);
  } catch {
    return {
      allowed: false,
      reason: 'Unable to verify template access. Please try again.',
      lockReason: 'error',
    };
  }

  // Check individual plan first
  const validity = await checkIndividualPlanValidity(userId);

  if (validity.isValid && validity.credits) {
    const credits = validity.credits;
    const templateAccess = credits.templateAccess || 'free';

    if (templateAccess === 'free' && isPremium) {
      return {
        allowed: false,
        reason: 'Premium templates require a paid plan. Please upgrade to access this template.',
        lockReason: 'upgrade',
      };
    }

    if (templateAccess === 'all') {
      return { allowed: true };
    }

    if (templateAccess === 'premium' && isPremium) {
      const planKey = credits.planName as keyof typeof INDIVIDUAL_PLANS;
      const plan = planKey ? INDIVIDUAL_PLANS[planKey] : null;
      const templateCount = plan?.features.templateCount;

      if (templateCount !== null && templateCount !== undefined) {
        const usage = await getIndividualPlanUsage(userId);
        const used = usage.usedPremiumTemplates ?? [];

        if (used.includes(templateId)) {
          return { allowed: true };
        }

        if (used.length >= templateCount) {
          return {
            allowed: false,
            reason: `Your plan includes ${templateCount} premium template${templateCount === 1 ? '' : 's'}. Upgrade to unlock more.`,
            lockReason: 'slot_limit',
          };
        }

        if (registerUse) {
          await registerPremiumTemplateSlot(userId, templateId);
        }

        return { allowed: true };
      }

      return { allowed: true };
    }

    return { allowed: true };
  }

  // Check business subscription as fallback
  const businessCheck = await checkBusinessSubscription(userId);
  if (businessCheck.isActive) {
    return { allowed: true };
  }

  if (isPremium) {
    return {
      allowed: false,
      reason: 'Premium templates require a paid plan. Please upgrade to access this template.',
      lockReason: 'upgrade',
    };
  }

  return { allowed: true };
}

export type TemplateLockState = 'open' | 'locked' | 'upgrade' | 'slot_used';

export async function getTemplateLockState(
  userId: string,
  templateId: string
): Promise<TemplateLockState> {
  const isPremium = await isPremiumTemplateId(templateId);
  if (!isPremium) return 'open';

  const check = await canAccessTemplate(userId, templateId, { registerUse: false });
  if (check.allowed) {
    const validity = await checkIndividualPlanValidity(userId);
    if (validity.isValid && validity.credits?.templateAccess === 'premium') {
      const usage = await getIndividualPlanUsage(userId);
      if ((usage.usedPremiumTemplates ?? []).includes(templateId)) {
        return 'slot_used';
      }
    }
    return 'open';
  }
  if (check.lockReason === 'slot_limit') return 'locked';
  if (check.lockReason === 'upgrade') return 'upgrade';
  return 'locked';
}

export async function getTemplateEntitlementSummary(userId: string): Promise<{
  templateSlotsMax: number | null;
  templateSlotsUsed: number;
  usedPremiumTemplateIds: string[];
  pdfDailyLimitReached: boolean;
  resumeVersionHistory: boolean;
  atsTier: 'basic' | 'advanced' | 'none';
}> {
  const validity = await checkIndividualPlanValidity(userId);
  const usage = await getIndividualPlanUsage(userId);
  const usedPremiumTemplateIds = usage.usedPremiumTemplates ?? [];

  let templateSlotsMax: number | null = null;
  let pdfDailyLimitReached = false;
  let resumeVersionHistory = false;
  let atsTier: 'basic' | 'advanced' | 'none' = 'none';

  if (validity.isValid && validity.credits) {
    const planKey = validity.credits.planName as keyof typeof INDIVIDUAL_PLANS;
    const plan = planKey ? INDIVIDUAL_PLANS[planKey] : null;
    if (plan) {
      templateSlotsMax =
        plan.features.templateAccess === 'all' ? null : plan.features.templateCount ?? null;
      resumeVersionHistory = Boolean((plan.features as { resumeVersionHistory?: boolean }).resumeVersionHistory);
      if (plan.features.atsOptimization === 'advanced') atsTier = 'advanced';
      else if (plan.features.atsOptimization === 'basic') atsTier = 'basic';

      if (plan.features.maxDownloadsPerDay !== null) {
        pdfDailyLimitReached =
          getIndividualDailyPdfCount(usage) >= plan.features.maxDownloadsPerDay;
      }
    }
  }

  const businessCheck = await checkBusinessSubscription(userId);
  if (businessCheck.isActive && businessCheck.subscription?.planName) {
    templateSlotsMax = null;
    const bPlan = BUSINESS_PLANS[businessCheck.subscription.planName as BusinessPlanKey];
    resumeVersionHistory = Boolean(
      (bPlan?.features as { resumeVersionHistory?: boolean }).resumeVersionHistory
    );
    atsTier = atsTierFromPlanFeatures(
      bPlan?.features as { atsOptimization?: string | boolean } | undefined
    );
  }

  return {
    templateSlotsMax,
    templateSlotsUsed: usedPremiumTemplateIds.length,
    usedPremiumTemplateIds,
    pdfDailyLimitReached,
    resumeVersionHistory,
    atsTier,
  };
}

export async function canUseResumeVersionHistory(userId: string): Promise<boolean> {
  const validity = await checkIndividualPlanValidity(userId);
  if (validity.isValid && validity.credits?.planName) {
    const plan = INDIVIDUAL_PLANS[validity.credits.planName as IndividualPlanKey];
    return Boolean((plan?.features as { resumeVersionHistory?: boolean }).resumeVersionHistory);
  }
  const businessCheck = await checkBusinessSubscription(userId);
  if (businessCheck.isActive && businessCheck.subscription?.planName) {
    const plan = BUSINESS_PLANS[businessCheck.subscription.planName as BusinessPlanKey];
    return Boolean((plan?.features as { resumeVersionHistory?: boolean }).resumeVersionHistory);
  }
  return false;
}

/**
 * Get ATS optimization level for user
 */
export async function getATSOptimizationLevel(userId: string): Promise<'basic' | 'advanced' | 'none'> {
  const validity = await checkIndividualPlanValidity(userId);

  if (validity.isValid && validity.credits?.planName) {
    const plan = INDIVIDUAL_PLANS[validity.credits.planName as IndividualPlanKey];
    if (plan?.features.atsOptimization === 'advanced') return 'advanced';
    if (plan?.features.atsOptimization === 'basic') return 'basic';
  }

  const businessCheck = await checkBusinessSubscription(userId);
  if (businessCheck.isActive && businessCheck.subscription?.planName) {
    const plan = BUSINESS_PLANS[businessCheck.subscription.planName as BusinessPlanKey];
    return atsTierFromPlanFeatures(
      plan?.features as { atsOptimization?: string | boolean } | undefined
    );
  }

  return 'none';
}

/**
 * Increment usage counters after action
 * Extended to handle daily limit tracking via date-based reset
 * Uses direct DB connection first (bypasses Prisma auth issues), falls back to Prisma
 */
export async function incrementUsage(userId: string, action: 'resumeDownload' | 'aiResume' | 'aiCoverLetter' | 'pdfDownload' | 'docxDownload') {
  if (
    isAiPaymentBypassEnabled() &&
    (action === 'aiResume' || action === 'aiCoverLetter')
  ) {
    return;
  }

  // Get current credits to check plan and daily limits (try direct DB first)
  let credits = await findUserCredits(userId);
  
  // Fallback to Prisma if direct DB fails
  if (!credits) {
    try {
      credits = await prisma.userCredits.findUnique({
        where: { userId },
      });
    } catch (prismaError: any) {
      console.warn('⚠️ [Payment Service] Prisma check failed in incrementUsage, using direct DB only:', prismaError?.message);
    }
  }

  if (!credits) {
    throw new Error('User credits not found');
  }

  // CRITICAL: Validate limits BEFORE incrementing to prevent going over limit
  // This is a safety check in addition to the pre-download check
  const updateData: any = {};
  const now = new Date();

  switch (action) {
    case 'resumeDownload':
      // Check if limit reached
      if (credits.resumeDownloads >= credits.resumeDownloadsLimit) {
        console.warn(`⚠️ [Payment Service] Resume download limit reached: ${credits.resumeDownloads}/${credits.resumeDownloadsLimit}`);
        throw new Error('Resume download limit reached');
      }
      updateData.resumeDownloads = { increment: 1 };
      break;
    case 'aiResume':
      // Check if limit reached
      if (credits.aiResumeUsage >= credits.aiResumeLimit) {
        console.warn(`⚠️ [Payment Service] AI resume limit reached: ${credits.aiResumeUsage}/${credits.aiResumeLimit}`);
        throw new Error('AI resume limit reached');
      }
      updateData.aiResumeUsage = { increment: 1 };
      break;
    case 'aiCoverLetter':
      // Check if limit reached
      if (credits.aiCoverLetterUsage >= credits.aiCoverLetterLimit) {
        console.warn(`⚠️ [Payment Service] AI cover letter limit reached: ${credits.aiCoverLetterUsage}/${credits.aiCoverLetterLimit}`);
        throw new Error('AI cover letter limit reached');
      }
      updateData.aiCoverLetterUsage = { increment: 1 };
      break;
    case 'pdfDownload': {
      const entitlement = await resolvePdfDownloadEntitlement(
        userId,
        credits as Record<string, unknown>
      );

      if (entitlement.remaining <= 0) {
        console.error(
          `❌ [Payment Service] PDF download limit reached: ${entitlement.used}/${entitlement.effectiveLimit} for user ${userId}`
        );
        throw new Error(
          formatPdfDownloadLimitMessage(
            String(credits.planName ?? ''),
            entitlement.used,
            entitlement.effectiveLimit
          )
        );
      }

      const quota = getPdfDownloadQuota(credits as Record<string, unknown>);
      let incremented;

      if (quota.used >= quota.limit && credits.planName === 'mini_starter') {
        if (!(await canMiniStarterUsePostEditDownload(userId, credits as Record<string, unknown>))) {
          throw new Error(
            formatPdfDownloadLimitMessage(
              String(credits.planName ?? ''),
              entitlement.used,
              entitlement.effectiveLimit
            )
          );
        }
        incremented = await incrementMiniStarterPostEditPdfDownload(userId);
      } else {
        incremented = await incrementPdfDownloadUsage(userId);
      }

      if (!incremented.success || !incremented.row) {
        console.error(`❌ [Payment Service] Atomic PDF increment failed for user ${userId}`);
        throw new Error('PDF download limit reached');
      }

      if (credits.planType === 'individual') {
        await recordIndividualDailyPdfDownload(userId);
      }

      console.log(
        `✅ [Payment Service] Incremented PDF download via DB: ${Number(incremented.row.pdfDownloads)}/${Number(incremented.row.pdfDownloadsLimit)} for user ${userId}`
      );
      return incremented.row;
    }
    case 'docxDownload':
      // Check if limit reached
      if (credits.docxDownloads >= credits.docxDownloadsLimit) {
        console.warn(`⚠️ [Payment Service] DOCX download limit reached: ${credits.docxDownloads}/${credits.docxDownloadsLimit}`);
        throw new Error('DOCX download limit reached');
      }
      updateData.docxDownloads = { increment: 1 };
      break;
  }

  // Perform the update with additional validation
  try {
    const updated = await prisma.userCredits.update({
      where: { userId },
      data: updateData,
    });

    // Log successful increment
    console.log(`✅ [Payment Service] Successfully incremented ${action} for user ${userId}`);
    
    return updated;
  } catch (updateError: any) {
    console.error(`❌ [Payment Service] Failed to increment ${action} for user ${userId}:`, updateError);
    throw updateError;
  }
}

