/**
 * Verify Payment API
 * POST /api/payments/verify
 * 
 * Verifies payment signature and activates plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { verifyPaymentSignature, fetchPaymentDetails } from '@/lib/services/razorpay-service';
import { activateIndividualPlan } from '@/lib/services/payment-service';
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
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = await verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Fetch payment from database
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if already processed
    if (payment.status === 'captured') {
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        paymentId: payment.id,
      });
    }

    // Fetch payment details from Razorpay
    const razorpayPayment = await fetchPaymentDetails(razorpayPaymentId);

    if (razorpayPayment.status !== 'captured') {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failureReason: `Payment status: ${razorpayPayment.status}`,
        },
      });

      return NextResponse.json(
        { error: 'Payment not captured', status: razorpayPayment.status },
        { status: 400 }
      );
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: 'captured',
        paymentMethod: razorpayPayment.method,
        metadata: razorpayPayment as any,
      },
    });

    // Activate plan if individual plan
    if (payment.planType === 'individual') {
      await activateIndividualPlan({
        userId: payment.userId,
        paymentId: payment.id,
        planKey: payment.planName as any,
      });
    }

    // Note: Business subscriptions are activated via webhook

    return NextResponse.json({
      success: true,
      message: 'Payment verified and plan activated',
      paymentId: payment.id,
    });
  } catch (error: any) {
    console.error('❌ [Verify Payment] Error:', {
      message: error.message,
      stack: error.stack,
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT_SET',
    });
    return NextResponse.json(
      { 
        error: 'Failed to verify payment', 
        details: error.message,
        debug: process.env.NODE_ENV === 'development' ? {
          hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

