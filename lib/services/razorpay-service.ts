/**
 * Razorpay Payment Service
 * Handles all Razorpay API interactions
 * 
 * SECURITY: Secret key is NEVER exposed to frontend
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// Plan configurations
export const INDIVIDUAL_PLANS = {
  starter_premium: {
    name: 'Starter Premium',
    amount: 9900, // ₹99 in paise
    validityDays: 3,
    features: {
      resumeDownloads: 5,
      templateAccess: 'premium',
      aiResumeUsage: 3,
      aiCoverLetterUsage: 2,
      atsOptimization: true,
      pdfDownloads: 5,
      docxDownloads: 5,
    },
  },
  professional_plus: {
    name: 'Professional Plus',
    amount: 39900, // ₹399 in paise
    validityDays: 7,
    features: {
      resumeDownloads: 15,
      templateAccess: 'premium',
      aiResumeUsage: 10,
      aiCoverLetterUsage: 5,
      atsOptimization: true,
      pdfDownloads: 15,
      docxDownloads: 15,
    },
  },
  best_value: {
    name: 'Best Value Plan',
    amount: 99900, // ₹999 in paise (30 days - calculated as ₹33/day)
    validityDays: 30,
    features: {
      resumeDownloads: 100,
      templateAccess: 'all',
      aiResumeUsage: 50,
      aiCoverLetterUsage: 25,
      atsOptimization: true,
      pdfDownloads: 100,
      docxDownloads: 100,
    },
  },
} as const;

export const BUSINESS_PLANS = {
  business_partner: {
    name: 'Business Partner',
    amount: 499900, // ₹4,999 in paise
    billingCycle: 'monthly',
    durationMonths: 6,
    features: {
      resumeCredits: 500,
      whiteLabelBranding: true,
      clientDashboard: true,
      prioritySupport: true,
      creditDeductionPerDownload: 1,
    },
  },
  business_partner_pro: {
    name: 'Business Partner Pro',
    amount: 899900, // ₹8,999 in paise
    billingCycle: 'yearly',
    durationMonths: 12,
    features: {
      resumeCredits: 1200,
      whiteLabelBranding: true,
      clientDashboard: true,
      prioritySupport: true,
      creditDeductionPerDownload: 1,
    },
  },
} as const;

export type IndividualPlanKey = keyof typeof INDIVIDUAL_PLANS;
export type BusinessPlanKey = keyof typeof BUSINESS_PLANS;

/**
 * Create Razorpay Order for one-time payment (Individual Plans)
 */
export async function createRazorpayOrder(params: {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpayInstance();

  const order = await razorpay.orders.create({
    amount: params.amount,
    currency: params.currency || 'INR',
    receipt: params.receipt || `receipt_${Date.now()}`,
    notes: params.notes || {},
  });

  return order;
}

/**
 * Create Razorpay Plan for subscription (Business Plans)
 */
export async function createRazorpayPlan(params: {
  period: 'monthly' | 'yearly';
  interval: number;
  item: {
    name: string;
    amount: number; // in paise
    currency?: string;
    description?: string;
  };
}) {
  const razorpay = getRazorpayInstance();

  const plan = await razorpay.plans.create({
    period: params.period,
    interval: params.interval,
    item: {
      name: params.item.name,
      amount: params.item.amount,
      currency: params.item.currency || 'INR',
      description: params.item.description,
    },
  });

  return plan;
}

/**
 * Create Razorpay Subscription
 */
export async function createRazorpaySubscription(params: {
  planId: string;
  customerNotify?: number;
  totalCount?: number;
  startAt?: number;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpayInstance();

  const subscription = await razorpay.subscriptions.create({
    plan_id: params.planId,
    customer_notify: params.customerNotify ?? 1,
    total_count: params.totalCount ?? 12, // Default 12 cycles
    start_at: params.startAt || Math.floor(Date.now() / 1000) + 60, // Start 1 minute from now
    notes: params.notes || {},
  });

  return subscription;
}

/**
 * Verify Razorpay Payment Signature
 * CRITICAL: Always verify signature on server-side
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET not configured');
  }

  const text = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(text)
    .digest('hex');

  return generatedSignature === params.razorpaySignature;
}

/**
 * Verify Razorpay Subscription Signature
 */
export function verifySubscriptionSignature(params: {
  razorpaySubscriptionId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET not configured');
  }

  const text = `${params.razorpaySubscriptionId}|${params.razorpayPaymentId}`;
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(text)
    .digest('hex');

  return generatedSignature === params.razorpaySignature;
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPaymentDetails(paymentId: string) {
  const razorpay = getRazorpayInstance();
  return await razorpay.payments.fetch(paymentId);
}

/**
 * Fetch subscription details from Razorpay
 */
export async function fetchSubscriptionDetails(subscriptionId: string) {
  const razorpay = getRazorpayInstance();
  return await razorpay.subscriptions.fetch(subscriptionId);
}

/**
 * Cancel Razorpay Subscription
 */
export async function cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false) {
  const razorpay = getRazorpayInstance();
  return await razorpay.subscriptions.cancel(subscriptionId, {
    cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
  });
}

/**
 * Get Razorpay key ID for frontend (safe to expose)
 */
export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error('RAZORPAY_KEY_ID not configured');
  }
  return keyId;
}

