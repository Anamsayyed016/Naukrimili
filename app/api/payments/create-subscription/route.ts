/**
 * Create Razorpay Subscription API
 * POST /api/payments/create-subscription
 * 
 * Creates a Razorpay subscription for business plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { 
  createRazorpayPlan, 
  createRazorpaySubscription
} from '@/lib/services/razorpay-service';
import { BUSINESS_PLANS, type BusinessPlanKey } from '@/lib/services/razorpay-plans';
import { prisma } from '@/lib/prisma';
import { validateCoupon } from '@/lib/services/coupon-service';
import { captureGoAffProRefForPayment } from '@/lib/goaffpro-server';

export async function POST(request: NextRequest) {
  try {
    // Check for Razorpay configuration
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      console.error('❌ [Create Subscription] Razorpay credentials not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured', details: 'Missing Razorpay credentials' },
        { status: 500 }
      );
    }

    // Detect and log key mode
    const isTestMode = keyId.startsWith('rzp_test_');
    const isLiveMode = keyId.startsWith('rzp_live_');
    const isUsingFallback = keyId === 'rzp_test_RmJIe9drDBjHeC';
    
    if (isUsingFallback) {
      console.warn('⚠️ [Create Subscription] Using fallback TEST keys from ecosystem.config.cjs');
      console.warn('⚠️ [Create Subscription] For production, set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables with LIVE keys');
    } else if (isTestMode) {
      console.log('🧪 [Create Subscription] Using TEST keys - payments will be in test mode');
    } else if (isLiveMode) {
      console.log('✅ [Create Subscription] Using LIVE keys - payments will process real transactions');
    } else {
      console.warn('⚠️ [Create Subscription] Unknown key format - key should start with rzp_test_ or rzp_live_');
    }

    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planKey, couponCode } = body;

    // Validate plan key
    if (!planKey || !(planKey in BUSINESS_PLANS)) {
      return NextResponse.json(
        { error: 'Invalid plan key' },
        { status: 400 }
      );
    }

    const plan = BUSINESS_PLANS[planKey as BusinessPlanKey];

    let chargeAmount = plan.amount;
    let originalAmount: number | null = null;
    let discountAmount = 0;
    let couponId: string | null = null;

    if (couponCode && String(couponCode).trim()) {
      const couponResult = await validateCoupon({
        code: String(couponCode),
        planKey,
        userId: session.user.id,
      });
      if (!couponResult.valid) {
        return NextResponse.json(
          { error: couponResult.error },
          { status: 400 }
        );
      }
      chargeAmount = couponResult.finalAmount;
      originalAmount = couponResult.originalAmount;
      discountAmount = couponResult.discountAmount;
      couponId = couponResult.couponId;
    }

    // Check for existing subscription (any status)
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: { payment: true },
    });

    // If user has an active subscription, don't allow creating a new one
    if (existingSubscription && existingSubscription.status === 'active') {
      console.log('⚠️ [Create Subscription] User already has active subscription:', {
        userId: session.user.id,
        subscriptionId: existingSubscription.id,
        planName: existingSubscription.planName,
        expiresAt: existingSubscription.expiresAt,
      });
      return NextResponse.json(
        { 
          error: 'Active subscription already exists',
          details: `You already have an active ${existingSubscription.planName} subscription`,
          currentSubscription: {
            planName: existingSubscription.planName,
            expiresAt: existingSubscription.expiresAt,
            remainingCredits: existingSubscription.remainingCredits,
          }
        },
        { status: 400 }
      );
    }

    // Log if updating existing subscription
    if (existingSubscription) {
      console.log('🔄 [Create Subscription] Updating existing subscription:', {
        userId: session.user.id,
        existingStatus: existingSubscription.status,
        existingPlan: existingSubscription.planName,
        newPlan: planKey,
      });
    } else {
      console.log('✨ [Create Subscription] Creating new subscription:', {
        userId: session.user.id,
        planKey,
      });
    }

    // Create Razorpay plan (if not exists, create it)
    // Note: In production, you might want to create plans once and reuse them
    const razorpayPlan = await createRazorpayPlan({
      period: plan.billingCycle === 'monthly' ? 'monthly' : 'yearly',
      interval: 1,
      item: {
        name: couponId ? `${plan.name} (Coupon)` : plan.name,
        amount: chargeAmount,
        currency: 'INR',
        description: `Business plan: ${plan.name}`,
      },
    });

    // Create Razorpay subscription
    const subscription = await createRazorpaySubscription({
      planId: razorpayPlan.id,
      customerNotify: 1,
      totalCount: plan.durationMonths,
      notes: {
        userId: session.user.id,
        planKey,
        planName: plan.name,
        ...(couponId ? { couponId } : {}),
      },
    });

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    // If user has an existing subscription (pending/expired/cancelled), update it
    // Otherwise create new payment and subscription records
    let payment;
    
    if (existingSubscription) {
      // Update existing payment record
      console.log('🔄 [Create Subscription] Updating existing payment record:', existingSubscription.paymentId);
      payment = await prisma.payment.update({
        where: { id: existingSubscription.paymentId },
        data: {
          razorpayOrderId: subscription.id,
          planType: 'business',
          planName: planKey,
          amount: chargeAmount,
          originalAmount: originalAmount ?? plan.amount,
          discountAmount,
          couponId,
          currency: 'INR',
          status: 'pending',
          razorpayPaymentId: null,
          razorpaySignature: null,
          paymentMethod: null,
          failureReason: null,
          metadata: null,
        },
      });

      // Update existing subscription record
      console.log('🔄 [Create Subscription] Updating existing subscription record:', existingSubscription.id);
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          paymentId: payment.id,
          razorpaySubscriptionId: subscription.id,
          razorpayPlanId: razorpayPlan.id,
          planName: planKey,
          status: 'pending',
          currentStart: startDate,
          currentEnd: endDate,
          expiresAt: endDate,
          billingCycle: plan.billingCycle,
          totalCredits: plan.features.resumeCredits,
          usedCredits: 0, // Reset used credits
          remainingCredits: plan.features.resumeCredits,
          autoRenew: true,
          cancelledAt: null, // Clear cancellation
          cancelledReason: null,
          metadata: null,
        },
      });
      console.log('✅ [Create Subscription] Existing subscription updated successfully');
    } else {
      // Create new payment record
      console.log('✨ [Create Subscription] Creating new payment record');
      payment = await prisma.payment.create({
        data: {
          userId: session.user.id,
          razorpayOrderId: subscription.id,
          planType: 'business',
          planName: planKey,
          amount: chargeAmount,
          originalAmount: originalAmount ?? plan.amount,
          discountAmount,
          couponId,
          currency: 'INR',
          status: 'pending',
        },
      });

      // Create new subscription record
      console.log('✨ [Create Subscription] Creating new subscription record');
      await prisma.subscription.create({
        data: {
          userId: session.user.id,
          paymentId: payment.id,
          razorpaySubscriptionId: subscription.id,
          razorpayPlanId: razorpayPlan.id,
          planName: planKey,
          status: 'pending',
          currentStart: startDate,
          currentEnd: endDate,
          expiresAt: endDate,
          billingCycle: plan.billingCycle,
          totalCredits: plan.features.resumeCredits,
          remainingCredits: plan.features.resumeCredits,
        },
      });
      console.log('✅ [Create Subscription] New subscription created successfully');
    }

    await captureGoAffProRefForPayment(payment.id, request);

    // keyId is already defined at the top of the function
    if (!keyId) {
      throw new Error('RAZORPAY_KEY_ID not set in environment');
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      planId: razorpayPlan.id,
      amount: chargeAmount,
      originalAmount: originalAmount ?? plan.amount,
      discountAmount,
      currency: 'INR',
      keyId,
    });
  } catch (error: any) {
    console.error('❌ [Create Subscription] Error:', {
      message: error.message,
      stack: error.stack,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT_SET',
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT_SET',
    });
    return NextResponse.json(
      { 
        error: 'Failed to create subscription', 
        details: error.message,
        debug: process.env.NODE_ENV === 'development' ? {
          hasKeyId: !!process.env.RAZORPAY_KEY_ID,
          hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

