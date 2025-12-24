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
    // Check for Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ [Create Order] Razorpay credentials not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured', details: 'Missing Razorpay credentials' },
        { status: 500 }
      );
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
      const keyId = process.env.RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error('RAZORPAY_KEY_ID not set in environment');
      }
      return NextResponse.json({
        orderId: existingPayment.razorpayOrderId,
        amount: plan.amount,
        currency: 'INR',
        keyId,
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

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      throw new Error('RAZORPAY_KEY_ID not set in environment');
    }

    return NextResponse.json({
      orderId: order.id,
      amount: plan.amount,
      currency: 'INR',
      keyId,
    });
  } catch (error: any) {
    // Handle Prisma errors that might have undefined message
    const errorMessage = error?.message || error?.toString?.() || 'Unknown error';
    const errorCode = error?.code;
    const errorTarget = error?.meta?.target;
    
    console.error('❌ [Create Order] Error:', {
      message: errorMessage,
      code: errorCode,
      target: errorTarget,
      stack: error?.stack,
      rawError: JSON.stringify(error),
      razorpayKeyId: process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT_SET',
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT_SET',
    });
    
    // Check for Prisma table not found error
    if (errorMessage.includes('does not exist') || errorCode === 'P3001') {
      return NextResponse.json(
        { 
          error: 'Database schema error',
          details: 'Payment table not found. Please run database migrations.',
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create order', 
        details: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          hasKeyId: !!process.env.RAZORPAY_KEY_ID,
          hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
          errorCode,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

