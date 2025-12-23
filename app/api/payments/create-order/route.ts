/**
 * Create Razorpay Order API
 * POST /api/payments/create-order
 * 
 * Creates a Razorpay order for individual plans (one-time payments)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { createRazorpayOrder, INDIVIDUAL_PLANS, type IndividualPlanKey } from '@/lib/services/razorpay-service';
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
    if (!planKey || !(planKey in INDIVIDUAL_PLANS)) {
      return NextResponse.json(
        { error: 'Invalid plan key' },
        { status: 400 }
      );
    }

    const plan = INDIVIDUAL_PLANS[planKey as IndividualPlanKey];

    // Check for existing pending payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        planName: planKey,
        status: 'pending',
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPayment) {
      return NextResponse.json({
        orderId: existingPayment.razorpayOrderId,
        amount: plan.amount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        existing: true,
      });
    }

    // Create Razorpay order
    const order = await createRazorpayOrder({
      amount: plan.amount,
      currency: 'INR',
      receipt: `receipt_${session.user.id}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        planKey,
        planName: plan.name,
      },
    });

    // Store payment record in database
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Orders expire in 30 minutes

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        razorpayOrderId: order.id,
        planType: 'individual',
        planName: planKey,
        amount: plan.amount,
        currency: 'INR',
        status: 'pending',
        expiresAt,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: plan.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('❌ [Create Order] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}

