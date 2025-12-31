/**
 * Razorpay Webhook Handler
 * POST /api/payments/webhook
 * 
 * Handles Razorpay webhook events:
 * - payment.captured
 * - subscription.activated
 * - subscription.cancelled
 * - subscription.expired
 * 
 * SECURITY: Webhook signature verification required
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchPaymentDetails,
  fetchSubscriptionDetails 
} from '@/lib/services/razorpay-service';
import { activateIndividualPlan, activateBusinessSubscription } from '@/lib/services/payment-service';
import { prisma } from '@/lib/prisma';
import { BUSINESS_PLANS } from '@/lib/services/razorpay-plans';

// Verify webhook signature using dynamic import for crypto
async function verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return false;
  }

  const crypto = await import('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    if (!(await verifyWebhookSignature(body, signature))) {
      console.error('❌ [Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    console.log(`📥 [Webhook] Received event: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case 'payment.captured': {
        await handlePaymentCaptured(payload.payment.entity);
        break;
      }

      case 'subscription.activated': {
        await handleSubscriptionActivated(payload.subscription.entity);
        break;
      }

      case 'subscription.cancelled': {
        await handleSubscriptionCancelled(payload.subscription.entity);
        break;
      }

      case 'subscription.expired': {
        await handleSubscriptionExpired(payload.subscription.entity);
        break;
      }

      default:
        console.log(`⚠️ [Webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ [Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    const paymentRecord = await prisma.payment.findFirst({
      where: {
        OR: [
          { razorpayOrderId: payment.order_id },
          { razorpayPaymentId: payment.id },
        ],
      },
    });

    if (!paymentRecord) {
      console.error(`❌ [Webhook] Payment not found: ${payment.id}`);
      return;
    }

    // Update payment status (only if not already captured to prevent overwriting)
    // Use update with conditional check to prevent race conditions
    const currentStatus = paymentRecord.status;
    if (currentStatus !== 'captured') {
      await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
          razorpayPaymentId: payment.id,
          status: 'captured',
          paymentMethod: payment.method,
          metadata: payment as any,
        },
      });
      console.log('✅ [Webhook] Payment status updated to captured');
    } else {
      console.log('⚠️ [Webhook] Payment already captured, skipping status update');
    }

    // Activate individual plan if applicable (only if not already captured)
    // This prevents duplicate activation if webhook and verify endpoint both process the payment
    if (paymentRecord.planType === 'individual' && paymentRecord.status !== 'captured') {
      console.log('🔄 [Webhook] Activating individual plan for payment:', paymentRecord.id);
      try {
        // Check if plan is already active to prevent duplicate activation
        const existingCredits = await prisma.userCredits.findUnique({
          where: { userId: paymentRecord.userId },
        });

        const isAlreadyActive = existingCredits?.isActive && 
                                existingCredits?.planType === 'individual' &&
                                existingCredits?.planName === paymentRecord.planName;

        if (isAlreadyActive) {
          console.log('⚠️ [Webhook] Plan already active, skipping activation');
        } else {
          await activateIndividualPlan({
            userId: paymentRecord.userId,
            paymentId: paymentRecord.id,
            planKey: paymentRecord.planName as any,
          });
          console.log('✅ [Webhook] Plan activated successfully');
        }
      } catch (activateError: any) {
        console.error('❌ [Webhook] Failed to activate plan:', activateError);
        // Don't throw - webhook should not fail, payment status is already updated
      }
    } else if (paymentRecord.status === 'captured') {
      console.log('⚠️ [Webhook] Payment already captured, skipping plan activation (likely activated by verify endpoint)');
    }
  } catch (error: any) {
    console.error('❌ [Webhook] handlePaymentCaptured error:', error);
  }
}

async function handleSubscriptionActivated(subscription: any) {
  try {
    const subscriptionRecord = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscription.id },
      include: { payment: true },
    });

    if (!subscriptionRecord) {
      console.error(`❌ [Webhook] Subscription not found: ${subscription.id}`);
      return;
    }

    const plan = BUSINESS_PLANS[subscriptionRecord.planName as keyof typeof BUSINESS_PLANS];
    if (!plan) {
      console.error(`❌ [Webhook] Plan not found: ${subscriptionRecord.planName}`);
      return;
    }

    const startDate = new Date(subscription.current_start * 1000);
    const endDate = new Date(subscription.current_end * 1000);

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscriptionRecord.id },
      data: {
        status: 'active',
        currentStart: startDate,
        currentEnd: endDate,
        expiresAt: endDate,
        totalCredits: plan.features.resumeCredits,
        remainingCredits: plan.features.resumeCredits,
      },
    });

    // Update payment status if not already captured
    if (subscriptionRecord.payment.status !== 'captured') {
      await prisma.payment.update({
        where: { id: subscriptionRecord.paymentId },
        data: {
          status: 'captured',
          razorpayPaymentId: subscription.linked_payments?.[0] || null,
        },
      });
    }

    // Activate business subscription
    await activateBusinessSubscription({
      userId: subscriptionRecord.userId,
      paymentId: subscriptionRecord.paymentId,
      subscriptionId: subscription.id,
      planKey: subscriptionRecord.planName as any,
      razorpayPlanId: subscription.plan_id,
      startDate,
      endDate,
    });
  } catch (error: any) {
    console.error('❌ [Webhook] handleSubscriptionActivated error:', error);
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  try {
    await prisma.subscription.updateMany({
      where: { razorpaySubscriptionId: subscription.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: subscription.cancelled_at ? 'User cancelled' : 'System cancelled',
      },
    });
  } catch (error: any) {
    console.error('❌ [Webhook] handleSubscriptionCancelled error:', error);
  }
}

async function handleSubscriptionExpired(subscription: any) {
  try {
    await prisma.subscription.updateMany({
      where: { razorpaySubscriptionId: subscription.id },
      data: {
        status: 'expired',
      },
    });

    // Deactivate user credits
    const subscriptionRecord = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscription.id },
    });

    if (subscriptionRecord) {
      await prisma.userCredits.updateMany({
        where: { userId: subscriptionRecord.userId },
        data: { isActive: false },
      });
    }
  } catch (error: any) {
    console.error('❌ [Webhook] handleSubscriptionExpired error:', error);
  }
}

// Disable body parsing for webhook to get raw body
export const runtime = 'nodejs';

