/**
 * Create Razorpay Order API
 * POST /api/payments/create-order
 * 
 * Creates a Razorpay order for individual plans (one-time payments)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { createRazorpayOrder } from '@/lib/services/razorpay-service';
import { INDIVIDUAL_PLANS, type IndividualPlanKey } from '@/lib/services/razorpay-plans';
import { prisma } from '@/lib/prisma';
import { checkPaymentExists, createPayment } from '@/lib/db-direct';

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

    // Check for existing pending payment using direct database query (bypass Prisma cache issue)
    let existingPayment = null;
    try {
      existingPayment = await checkPaymentExists(session.user.id, planKey);
    } catch (dbError: any) {
      console.error('❌ [Create Order] Error checking existing payment:', {
        error: dbError?.message || dbError,
        userId: session.user.id,
        planKey
      });
      // Continue to create new order if check fails
    }

    if (existingPayment) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error('RAZORPAY_KEY_ID not set in environment');
      }
      console.log('✅ [Create Order] Using existing payment:', existingPayment.razorpayOrderId);
      return NextResponse.json({
        orderId: existingPayment.razorpayOrderId,
        amount: plan.amount,
        currency: 'INR',
        keyId,
        existing: true,
      });
    }

    // Create Razorpay order
    console.log('🔄 [Create Order] Creating Razorpay order...', {
      amount: plan.amount,
      userId: session.user.id,
      planKey
    });
    
    // Generate receipt ID that's guaranteed to be <= 40 characters (Razorpay limit)
    // Format: rcpt_<first8charsOfUserId>_<last10digitsOfTimestamp>
    const userIdShort = session.user.id.slice(0, 8);
    const timestampShort = Date.now().toString().slice(-10);
    const receiptId = `rcpt_${userIdShort}_${timestampShort}`;
    
    let order;
    try {
      order = await createRazorpayOrder({
        amount: plan.amount,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          userId: session.user.id,
          planKey,
          planName: plan.name,
        },
      });
      console.log('✅ [Create Order] Razorpay order created:', order.id);
    } catch (razorpayError: any) {
      console.error('❌ [Create Order] Razorpay API error:', {
        error: razorpayError?.message || razorpayError,
        errorDescription: razorpayError?.error?.description,
        errorCode: razorpayError?.error?.code,
        statusCode: razorpayError?.statusCode,
        stack: razorpayError?.stack
      });
      throw new Error(
        razorpayError?.error?.description || 
        razorpayError?.message || 
        'Failed to create payment order with Razorpay'
      );
    }

    // Store payment record in database using direct query (bypass Prisma cache issue)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Orders expire in 30 minutes

    console.log('🔄 [Create Order] Storing payment record in database...');
    try {
      await createPayment({
        userId: session.user.id,
        razorpayOrderId: order.id,
        planType: 'individual',
        planName: planKey,
        amount: plan.amount,
        currency: 'INR',
        expiresAt,
      });
      console.log('✅ [Create Order] Payment record stored successfully');
    } catch (dbError: any) {
      console.error('❌ [Create Order] Database error storing payment:', {
        error: dbError?.message || dbError,
        code: dbError?.code,
        detail: dbError?.detail,
        constraint: dbError?.constraint,
        table: dbError?.table
      });
      
      // If database insert fails, we should still return the order
      // but log the error for investigation
      // The order is already created in Razorpay, so we can't rollback
      console.warn('⚠️ [Create Order] Payment order created in Razorpay but database insert failed. Order ID:', order.id);
      
      // Check if it's a table not found error
      if (dbError?.message?.includes('does not exist') || dbError?.code === '42P01') {
        throw new Error('Payment table not found. Please run database migrations.');
      }
      
      // For other database errors, we'll still return success but log the issue
      // This allows the payment to proceed even if database logging fails
    }

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
    
    // Safely stringify error for logging
    let errorString = 'Unknown error';
    try {
      if (typeof error === 'string') {
        errorString = error;
      } else if (error?.message) {
        errorString = error.message;
      } else {
        errorString = String(error);
      }
    } catch {
      errorString = 'Error object could not be serialized';
    }
    
    console.error('❌ [Create Order] Error:', {
      message: errorMessage,
      code: errorCode,
      target: errorTarget,
      stack: error?.stack,
      errorString,
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
    
    // Ensure error message is a string, not an object
    let safeErrorMessage = errorMessage;
    if (typeof safeErrorMessage !== 'string') {
      try {
        safeErrorMessage = JSON.stringify(safeErrorMessage);
      } catch {
        safeErrorMessage = 'An unexpected error occurred';
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create order', 
        details: safeErrorMessage,
        message: safeErrorMessage, // Add message field for easier frontend access
        debug: process.env.NODE_ENV === 'development' ? {
          hasKeyId: !!process.env.RAZORPAY_KEY_ID,
          hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
          errorCode,
          errorTarget,
          errorString,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

