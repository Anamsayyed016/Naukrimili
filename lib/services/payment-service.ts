/**
 * Payment Service - Database Operations
 * Handles payment and subscription database operations
 */

import { prisma } from '@/lib/prisma';
import { INDIVIDUAL_PLANS, BUSINESS_PLANS, type IndividualPlanKey, type BusinessPlanKey } from './razorpay-service';

/**
 * Activate Individual Plan after successful payment
 */
export async function activateIndividualPlan(params: {
  userId: string;
  paymentId: string;
  planKey: IndividualPlanKey;
}) {
  const plan = INDIVIDUAL_PLANS[params.planKey];
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + plan.validityDays);

  // Get or create user credits
  let userCredits = await prisma.userCredits.findUnique({
    where: { userId: params.userId },
  });

  if (!userCredits) {
    userCredits = await prisma.userCredits.create({
      data: {
        userId: params.userId,
        resumeDownloadsLimit: plan.features.resumeDownloads,
        aiResumeLimit: plan.features.aiResumeUsage,
        aiCoverLetterLimit: plan.features.aiCoverLetterUsage,
        templateAccess: plan.features.templateAccess,
        atsOptimization: plan.features.atsOptimization,
        pdfDownloadsLimit: plan.features.pdfDownloads,
        docxDownloadsLimit: plan.features.docxDownloads,
        validUntil,
        planType: 'individual',
        planName: params.planKey,
        isActive: true,
      },
    });
  } else {
    // Update existing credits
    userCredits = await prisma.userCredits.update({
      where: { userId: params.userId },
      data: {
        resumeDownloadsLimit: plan.features.resumeDownloads,
        aiResumeLimit: plan.features.aiResumeUsage,
        aiCoverLetterLimit: plan.features.aiCoverLetterUsage,
        templateAccess: plan.features.templateAccess,
        atsOptimization: plan.features.atsOptimization,
        pdfDownloadsLimit: plan.features.pdfDownloads,
        docxDownloadsLimit: plan.features.docxDownloads,
        validUntil,
        planType: 'individual',
        planName: params.planKey,
        isActive: true,
      },
    });
  }

  return userCredits;
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
  const plan = BUSINESS_PLANS[params.planKey];

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
      expiresAt: params.endDate,
      billingCycle: plan.billingCycle,
      totalCredits: plan.features.resumeCredits,
      remainingCredits: plan.features.resumeCredits,
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
      expiresAt: params.endDate,
      billingCycle: plan.billingCycle,
      totalCredits: plan.features.resumeCredits,
      remainingCredits: plan.features.resumeCredits,
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
      validUntil: params.endDate,
    },
    update: {
      planType: 'business',
      planName: params.planKey,
      isActive: true,
      validUntil: params.endDate,
    },
  });

  return subscription;
}

/**
 * Deduct credits for resume download (Business plans)
 */
export async function deductResumeCredits(params: {
  userId: string;
  credits: number;
  reason: string;
  description?: string;
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

  // Create credit transaction record
  await prisma.creditTransaction.create({
    data: {
      subscriptionId: subscription.id,
      userId: params.userId,
      type: 'deduct',
      amount: params.credits,
      reason: params.reason,
      description: params.description,
    },
  });

  return updated;
}

/**
 * Check if user has valid individual plan
 */
export async function checkIndividualPlanValidity(userId: string): Promise<{
  isValid: boolean;
  credits?: any;
  daysRemaining?: number;
}> {
  const credits = await prisma.userCredits.findUnique({
    where: { userId },
  });

  if (!credits || !credits.isActive || credits.planType !== 'individual') {
    return { isValid: false };
  }

  if (!credits.validUntil) {
    return { isValid: false };
  }

  const now = new Date();
  const validUntil = new Date(credits.validUntil);

  if (validUntil < now) {
    // Plan expired, deactivate
    await prisma.userCredits.update({
      where: { userId },
      data: { isActive: false },
    });
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
 */
export async function checkBusinessSubscription(userId: string): Promise<{
  isActive: boolean;
  subscription?: any;
  creditsRemaining?: number;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { creditTransactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });

  if (!subscription) {
    return { isActive: false };
  }

  const now = new Date();
  if (subscription.status !== 'active' || subscription.expiresAt < now) {
    return { isActive: false };
  }

  return {
    isActive: true,
    subscription,
    creditsRemaining: subscription.remainingCredits,
  };
}

/**
 * Check if user can download resume (individual plan)
 */
export async function canDownloadResume(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
}> {
  const validity = await checkIndividualPlanValidity(userId);
  
  if (!validity.isValid || !validity.credits) {
    return { allowed: false, reason: 'No active plan or plan expired' };
  }

  const credits = validity.credits;
  const remaining = credits.resumeDownloadsLimit - credits.resumeDownloads;

  if (remaining <= 0) {
    return { allowed: false, reason: 'Download limit reached', remaining: 0 };
  }

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
 * Increment usage counters after action
 */
export async function incrementUsage(userId: string, action: 'resumeDownload' | 'aiResume' | 'aiCoverLetter' | 'pdfDownload' | 'docxDownload') {
  const updateData: any = {};

  switch (action) {
    case 'resumeDownload':
      updateData.resumeDownloads = { increment: 1 };
      break;
    case 'aiResume':
      updateData.aiResumeUsage = { increment: 1 };
      break;
    case 'aiCoverLetter':
      updateData.aiCoverLetterUsage = { increment: 1 };
      break;
    case 'pdfDownload':
      updateData.pdfDownloads = { increment: 1 };
      break;
    case 'docxDownload':
      updateData.docxDownloads = { increment: 1 };
      break;
  }

  await prisma.userCredits.update({
    where: { userId },
    data: updateData,
  });
}

