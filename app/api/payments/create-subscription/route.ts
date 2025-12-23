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
  createRazorpaySubscription, 
  BUSINESS_PLANS, 
  type BusinessPlanKey 
} from '@/lib/services/razorpay-service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({
      subscriptionId: subscription.id,
      planId: razorpayPlan.id,
      amount: plan.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('❌ [Create Subscription] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription', details: error.message },
      { status: 500 }
    );
  }
}

