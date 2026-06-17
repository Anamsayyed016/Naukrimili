/**
 * Razorpay Webhook Handler
 * POST /api/payments/webhook
 * 
 * Handles Razorpay webhook events:
 * - payment.captured
 * - subscription.activated
 * - subscription.charged
 * - subscription.completed
 * - subscription.cancelled
 * - subscription.expired
 * - subscription.halted
 * - subscription.paused
 * - subscription.resumed
 * 
 * SECURITY: Webhook signature verification required
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchPaymentDetails,
} from '@/lib/services/razorpay-service';
import { activateIndividualPlan, activateBusinessSubscription, syncBusinessSubscriptionBillingCycle } from '@/lib/services/payment-service';
import type { IndividualPlanKey } from '@/lib/services/razorpay-plans';
import { prisma } from '@/lib/prisma';
import { BUSINESS_PLANS } from '@/lib/services/razorpay-plans';
import {
  assertPaymentAmountMatches,
  redeemCoupon,
} from '@/lib/services/coupon-service';
import { mergePaymentCaptureMetadata } from '@/lib/goaffpro-conversion';
import { reportGoAffProSaleForPayment } from '@/lib/goaffpro-server';

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

      case 'subscription.charged': {
        await handleSubscriptionCharged(payload.subscription.entity);
        break;
      }

      case 'subscription.completed': {
        await handleSubscriptionCompleted(payload.subscription.entity);
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

      case 'subscription.halted': {
        await handleSubscriptionPaused(payload.subscription.entity, 'halted');
        break;
      }

      case 'subscription.paused': {
        await handleSubscriptionPaused(payload.subscription.entity, 'paused');
        break;
      }

      case 'subscription.resumed': {
        await handleSubscriptionResumed(payload.subscription.entity);
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

    // Mandatory amount validation for captured payments
    if (payment.status === 'captured') {
      try {
        assertPaymentAmountMatches(paymentRecord.amount, payment.amount);
      } catch (amountError: unknown) {
        const msg = amountError instanceof Error ? amountError.message : 'Amount mismatch';
        console.error('❌ [Webhook] Payment amount mismatch:', msg);
        await prisma.payment.update({
          where: { id: paymentRecord.id },
          data: { status: 'failed', failureReason: msg },
        });
        return;
      }
    }

    // Update payment status (only if not already captured to prevent overwriting)
    // Use update with conditional check to prevent race conditions
    const currentStatus = paymentRecord.status;
    if (currentStatus !== 'captured') {
      const captureMetadata = mergePaymentCaptureMetadata(
        paymentRecord.metadata,
        payment as Record<string, unknown>
      );

      await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
          razorpayPaymentId: payment.id,
          status: 'captured',
          paymentMethod: payment.method,
          metadata: captureMetadata,
        },
      });
      console.log('✅ [Webhook] Payment status updated to captured');
    } else {
      console.log('⚠️ [Webhook] Payment already captured, skipping status update');
    }

    if (payment.status === 'captured' && payment.id) {
      await reportGoAffProSaleForPayment(paymentRecord.id, payment.id);
    }

    // Activate individual plan if applicable (only if not already captured)
    // This prevents duplicate activation if webhook and verify endpoint both process the payment
    if (paymentRecord.planType === 'individual' && paymentRecord.status !== 'captured') {
      console.log('🔄 [Webhook] Activating individual plan for payment:', paymentRecord.id);

      if (paymentRecord.couponId) {
        try {
          await redeemCoupon({
            couponId: paymentRecord.couponId,
            userId: paymentRecord.userId,
            paymentId: paymentRecord.id,
            planType: 'individual',
            planKey: paymentRecord.planName,
            originalAmount: paymentRecord.originalAmount ?? paymentRecord.amount,
            discountAmount: paymentRecord.discountAmount ?? 0,
            finalAmount: paymentRecord.amount,
            razorpayReference: payment.order_id,
          });
        } catch (redeemError: unknown) {
          console.error('❌ [Webhook] Coupon redemption failed:', redeemError);
          return;
        }
      }

      try {
        await activateIndividualPlan({
          userId: paymentRecord.userId,
          paymentId: paymentRecord.id,
          planKey: paymentRecord.planName as IndividualPlanKey,
        });
        console.log('✅ [Webhook] Plan activated successfully');
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

    const paymentMeta =
      subscriptionRecord.payment.metadata &&
      typeof subscriptionRecord.payment.metadata === 'object' &&
      !Array.isArray(subscriptionRecord.payment.metadata)
        ? (subscriptionRecord.payment.metadata as Record<string, unknown>)
        : {};

    const activationCycleKey = `${subscription.id}:${startDate.getTime()}`;
    if (
      paymentMeta.businessPlanActivated === true &&
      paymentMeta.businessActivationCycle === activationCycleKey
    ) {
      console.log('⚠️ [Webhook] Business subscription already activated for this cycle, skipping');
      return;
    }

    // Validate subscription plan matches stored record
    if (subscription.plan_id !== subscriptionRecord.razorpayPlanId) {
      console.error('❌ [Webhook] Subscription plan_id mismatch');
      await prisma.payment.update({
        where: { id: subscriptionRecord.paymentId },
        data: {
          status: 'failed',
          failureReason: 'Subscription plan mismatch',
        },
      });
      return;
    }

    // Validate first payment amount when available
    const linkedPaymentId =
      subscription.linked_payments?.[0]?.payment_id ||
      subscription.linked_payments?.[0] ||
      null;

    if (linkedPaymentId) {
      try {
        const razorpayPayment = await fetchPaymentDetails(String(linkedPaymentId));
        if (razorpayPayment.status === 'captured') {
          assertPaymentAmountMatches(
            subscriptionRecord.payment.amount,
            razorpayPayment.amount
          );
        }
      } catch (amountError: unknown) {
        const msg = amountError instanceof Error ? amountError.message : 'Amount mismatch';
        console.error('❌ [Webhook] Subscription payment amount validation failed:', msg);
        await prisma.payment.update({
          where: { id: subscriptionRecord.paymentId },
          data: { status: 'failed', failureReason: msg },
        });
        return;
      }
    }

    // Redeem coupon (subscription rail — primary redemption path)
    if (subscriptionRecord.payment.couponId) {
      try {
        await redeemCoupon({
          couponId: subscriptionRecord.payment.couponId,
          userId: subscriptionRecord.userId,
          paymentId: subscriptionRecord.paymentId,
          planType: 'business',
          planKey: subscriptionRecord.planName,
          originalAmount:
            subscriptionRecord.payment.originalAmount ?? subscriptionRecord.payment.amount,
          discountAmount: subscriptionRecord.payment.discountAmount ?? 0,
          finalAmount: subscriptionRecord.payment.amount,
          razorpayReference: subscription.id,
        });
      } catch (redeemError: unknown) {
        console.error('❌ [Webhook] Subscription coupon redemption failed:', redeemError);
        return;
      }
    }

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

    // Activate business subscription (credits, usedCredits reset, idempotency)
    await activateBusinessSubscription({
      userId: subscriptionRecord.userId,
      paymentId: subscriptionRecord.paymentId,
      subscriptionId: subscription.id,
      planKey: subscriptionRecord.planName as any,
      razorpayPlanId: subscription.plan_id,
      startDate,
      endDate,
    });

    // Mark payment eligible for GoAffPro conversion (client polls after webhook confirmation)
    const existingMetadata =
      subscriptionRecord.payment.metadata &&
      typeof subscriptionRecord.payment.metadata === 'object' &&
      !Array.isArray(subscriptionRecord.payment.metadata)
        ? (subscriptionRecord.payment.metadata as Record<string, unknown>)
        : {};

    await prisma.payment.update({
      where: { id: subscriptionRecord.paymentId },
      data: {
        metadata: {
          ...existingMetadata,
          goaffproEligible: true,
          goaffproOrderNumber: subscription.id,
          goaffproTotal: subscriptionRecord.payment.amount / 100,
        },
      },
    });

    await reportGoAffProSaleForPayment(subscriptionRecord.paymentId, subscription.id);
  } catch (error: any) {
    console.error('❌ [Webhook] handleSubscriptionActivated error:', error);
  }
}

async function handleSubscriptionCharged(subscription: any) {
  try {
    if (!subscription?.id || !subscription.current_start || !subscription.current_end) {
      return;
    }

    const synced = await syncBusinessSubscriptionBillingCycle({
      razorpaySubscriptionId: subscription.id,
      currentStart: new Date(subscription.current_start * 1000),
      currentEnd: new Date(subscription.current_end * 1000),
    });

    if (synced) {
      console.log(`✅ [Webhook] Synced billing cycle for subscription: ${subscription.id}`);
    }
  } catch (error: any) {
    console.error('❌ [Webhook] handleSubscriptionCharged error:', error);
  }
}

async function handleSubscriptionCompleted(subscription: any) {
  try {
    await prisma.subscription.updateMany({
      where: { razorpaySubscriptionId: subscription.id },
      data: { status: 'expired' },
    });

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
    console.error('❌ [Webhook] handleSubscriptionCompleted error:', error);
  }
}

async function handleSubscriptionPaused(subscription: any, reason: 'paused' | 'halted') {
  try {
    await prisma.subscription.updateMany({
      where: { razorpaySubscriptionId: subscription.id },
      data: {
        status: 'paused',
        cancelledReason: reason === 'halted' ? 'Payment halted' : 'Subscription paused',
      },
    });

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
    console.error(`❌ [Webhook] handleSubscriptionPaused (${reason}) error:`, error);
  }
}

async function handleSubscriptionResumed(subscription: any) {
  try {
    const subscriptionRecord = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscription.id },
    });

    if (!subscriptionRecord) {
      return;
    }

    const now = new Date();
    if (subscriptionRecord.expiresAt < now) {
      console.log('⚠️ [Webhook] Subscription resumed but already past expiresAt');
      return;
    }

    const startDate = subscription.current_start
      ? new Date(subscription.current_start * 1000)
      : subscriptionRecord.currentStart;
    const endDate = subscription.current_end
      ? new Date(subscription.current_end * 1000)
      : subscriptionRecord.currentEnd;

    await prisma.subscription.update({
      where: { id: subscriptionRecord.id },
      data: {
        status: 'active',
        currentStart: startDate,
        currentEnd: endDate,
        cancelledReason: null,
      },
    });

    await prisma.userCredits.updateMany({
      where: { userId: subscriptionRecord.userId },
      data: {
        isActive: true,
        validUntil: subscriptionRecord.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('❌ [Webhook] handleSubscriptionResumed error:', error);
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

