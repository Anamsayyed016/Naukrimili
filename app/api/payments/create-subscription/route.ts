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

export async function POST(request: NextRequest) {
  let session: any = null;
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
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planKey } = body;

    // Validate plan key
    if (!planKey || !(planKey in BUSINESS_PLANS)) {
      return NextResponse.json(
        { error: 'Invalid plan key' },
        { status: 400 }
      );
    }

    const plan = BUSINESS_PLANS[planKey as BusinessPlanKey];

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
        name: plan.name,
        amount: plan.amount,
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
      },
    });

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    // Use a transaction to ensure atomicity and prevent race conditions
    // This handles the case where subscription might exist but wasn't found in initial check
    const result = await prisma.$transaction(async (tx) => {
      // Re-check for existing subscription inside transaction to prevent race conditions
      const subscriptionCheck = await tx.subscription.findUnique({
        where: { userId: session.user.id },
        include: { payment: true },
      });

      let payment;
      
      if (subscriptionCheck) {
        // Update existing payment record
        console.log('🔄 [Create Subscription] Updating existing payment record:', subscriptionCheck.paymentId);
        payment = await tx.payment.update({
          where: { id: subscriptionCheck.paymentId },
          data: {
            razorpayOrderId: subscription.id,
            planType: 'business',
            planName: planKey,
            amount: plan.amount,
            currency: 'INR',
            status: 'pending',
            razorpayPaymentId: null, // Reset payment details
            razorpaySignature: null,
            paymentMethod: null,
            failureReason: null,
            metadata: null,
          },
        });

        // Update existing subscription record
        console.log('🔄 [Create Subscription] Updating existing subscription record:', subscriptionCheck.id);
        await tx.subscription.update({
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
        payment = await tx.payment.create({
          data: {
            userId: session.user.id,
            razorpayOrderId: subscription.id, // Using subscription ID as order ID reference
            planType: 'business',
            planName: planKey,
            amount: plan.amount,
            currency: 'INR',
            status: 'pending',
          },
        });

        // Use upsert for subscription to handle race conditions gracefully
        // If subscription somehow exists (race condition), update it instead of failing
        console.log('✨ [Create Subscription] Creating/updating subscription record');
        await tx.subscription.upsert({
          where: { userId: session.user.id },
          update: {
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
            usedCredits: 0,
            remainingCredits: plan.features.resumeCredits,
            autoRenew: true,
            cancelledAt: null,
            cancelledReason: null,
            metadata: null,
          },
          create: {
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

      return payment;
    }, {
      timeout: 10000, // 10 second timeout for transaction
    });

    const payment = result;

    // keyId is already defined at the top of the function
    if (!keyId) {
      throw new Error('RAZORPAY_KEY_ID not set in environment');
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      planId: razorpayPlan.id,
      amount: plan.amount,
      currency: 'INR',
      keyId,
    });
  } catch (error: any) {
    console.error('❌ [Create Subscription] Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT_SET',
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT_SET',
    });

    // Handle Prisma unique constraint violation specifically
    if (error.code === 'P2002' || error.message?.includes('unique constraint')) {
      console.error('❌ [Create Subscription] Unique constraint violation - subscription may already exist');
      
      // Try to fetch existing subscription to provide better error message
      try {
        const existingSub = await prisma.subscription.findUnique({
          where: { userId: session?.user?.id },
          select: {
            id: true,
            planName: true,
            status: true,
            expiresAt: true,
          },
        });

        if (existingSub) {
          return NextResponse.json(
            { 
              error: 'Subscription already exists',
              details: existingSub.status === 'active' 
                ? `You already have an active ${existingSub.planName} subscription`
                : `A ${existingSub.status} subscription already exists. Please try again or contact support.`,
              currentSubscription: {
                planName: existingSub.planName,
                status: existingSub.status,
                expiresAt: existingSub.expiresAt,
              }
            },
            { status: 409 } // Conflict status code
          );
        }
      } catch (fetchError) {
        // If we can't fetch, just return generic error
        console.error('❌ [Create Subscription] Failed to fetch existing subscription:', fetchError);
      }

      return NextResponse.json(
        { 
          error: 'Subscription already exists',
          details: 'A subscription for this user already exists. Please try again or contact support if the issue persists.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create subscription', 
        details: error.message,
        debug: process.env.NODE_ENV === 'development' ? {
          hasKeyId: !!process.env.RAZORPAY_KEY_ID,
          hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
          errorCode: error.code,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

