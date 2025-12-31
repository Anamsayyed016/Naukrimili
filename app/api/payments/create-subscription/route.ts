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
    const { planKey } = body;

    // Validate plan key
    if (!planKey || !(planKey in BUSINESS_PLANS)) {
      return NextResponse.json(
        { error: 'Invalid plan key' },
        { status: 400 }
      );
    }

    const plan = BUSINESS_PLANS[planKey as BusinessPlanKey];

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        { error: 'Active subscription already exists' },
        { status: 400 }
      );
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

    // Store payment record (will be updated when payment is captured)
    const payment = await prisma.payment.create({
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

    // Store subscription record
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

