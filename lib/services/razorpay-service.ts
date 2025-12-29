/**
 * Razorpay Payment Service
 * Handles all Razorpay API interactions
 * 
 * SECURITY: Secret key is NEVER exposed to frontend
 * 
 * CRITICAL: This file uses dynamic imports for server-only modules
 * to prevent Webpack from bundling them for the client
 * 
 * This file should ONLY be imported in server-side code (API routes, Server Components)
 * 
 * @fileoverview Server-only module - do not import in client components
 */

// Mark as server-only - runtime check only executes in browser (not during build)
// This prevents accidental client-side usage while allowing build-time analysis
// Webpack config will exclude this file from client bundles

// Dynamic import helper for Razorpay
async function getRazorpayInstance() {
  const Razorpay = (await import('razorpay')).default;
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

// Dynamic import helper for crypto
async function getCrypto() {
  return await import('crypto');
}

// Re-export plan configurations from separate file (safe to import)
export {
  INDIVIDUAL_PLANS,
  BUSINESS_PLANS,
  type IndividualPlanKey,
  type BusinessPlanKey,
} from './razorpay-plans';

/**
 * Create Razorpay Order for one-time payment (Individual Plans)
 */
export async function createRazorpayOrder(params: {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}) {
  try {
    const razorpay = await getRazorpayInstance();

    console.log('🔄 [Razorpay] Creating order with params:', {
      amount: params.amount,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      hasNotes: !!params.notes
    });

    // Generate fallback receipt if not provided (max 40 chars for Razorpay)
    const fallbackReceipt = params.receipt || `rcpt_${Date.now().toString().slice(-12)}`;
    
    const order = await razorpay.orders.create({
      amount: params.amount,
      currency: params.currency || 'INR',
      receipt: fallbackReceipt,
      notes: params.notes || {},
    });

    console.log('✅ [Razorpay] Order created successfully:', order.id);
    return order;
  } catch (error: any) {
    console.error('❌ [Razorpay] Error creating order:', {
      error: error?.message || error,
      errorDescription: error?.error?.description,
      errorCode: error?.error?.code,
      statusCode: error?.statusCode,
      field: error?.field,
      source: error?.source,
      step: error?.step,
      reason: error?.reason,
      metadata: error?.metadata
    });
    
    // Re-throw with more context
    const errorMessage = error?.error?.description || error?.message || 'Failed to create Razorpay order';
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).originalError = error;
    (enhancedError as any).razorpayError = error?.error;
    throw enhancedError;
  }
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
  const razorpay = await getRazorpayInstance();

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
  const razorpay = await getRazorpayInstance();

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
export async function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<boolean> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET not configured');
  }

  const crypto = await getCrypto();
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
export async function verifySubscriptionSignature(params: {
  razorpaySubscriptionId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<boolean> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET not configured');
  }

  const crypto = await getCrypto();
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
  const razorpay = await getRazorpayInstance();
  return await razorpay.payments.fetch(paymentId);
}

/**
 * Fetch subscription details from Razorpay
 */
export async function fetchSubscriptionDetails(subscriptionId: string) {
  const razorpay = await getRazorpayInstance();
  return await razorpay.subscriptions.fetch(subscriptionId);
}

/**
 * Cancel Razorpay Subscription
 */
export async function cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false) {
  const razorpay = await getRazorpayInstance();
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

