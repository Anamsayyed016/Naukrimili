/**
 * Get Payment Status API
 * GET /api/payments/status
 * 
 * Returns user's current plan status, credits, and validity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { checkIndividualPlanValidity, checkBusinessSubscription, getTemplateEntitlementSummary, canAccessTemplate, getATSOptimizationLevel, resolvePdfDownloadEntitlement } from '@/lib/services/payment-service';
import { prisma } from '@/lib/prisma';
import {
  buildGoAffProConversionPayload,
  isGoAffProReported,
  logGoAffPro,
  parsePaymentGoAffProMetadata,
} from '@/lib/goaffpro-conversion';
import { reportGoAffProSaleForPayment } from '@/lib/goaffpro-server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const subscriptionConversionId = request.nextUrl.searchParams.get('subscriptionConversion');

    if (subscriptionConversionId) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          razorpaySubscriptionId: subscriptionConversionId,
          userId,
        },
        include: { payment: true },
      });

      if (!subscription || subscription.status !== 'active') {
        return NextResponse.json({ ready: false });
      }

      const metadata = parsePaymentGoAffProMetadata(subscription.payment.metadata);

      if (isGoAffProReported(metadata)) {
        logGoAffPro('conversion skipped', {
          reason: 'duplicate-server',
          subscriptionId: subscriptionConversionId,
        });
        return NextResponse.json({ ready: false, alreadyReported: true });
      }

      if (!metadata.goaffproEligible) {
        return NextResponse.json({ ready: false });
      }

      const orderNumber = String(
        metadata.goaffproOrderNumber || subscription.razorpaySubscriptionId
      );

      await reportGoAffProSaleForPayment(subscription.payment.id, orderNumber);

      const refreshedPayment = await prisma.payment.findUnique({
        where: { id: subscription.payment.id },
      });
      if (refreshedPayment && isGoAffProReported(refreshedPayment.metadata)) {
        logGoAffPro('conversion skipped', {
          reason: 'duplicate-server',
          subscriptionId: subscriptionConversionId,
        });
        return NextResponse.json({ ready: false, alreadyReported: true });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      let couponCode: string | null = null;
      if (subscription.payment.couponId) {
        const coupon = await prisma.coupon.findUnique({
          where: { id: subscription.payment.couponId },
          select: { code: true },
        });
        couponCode = coupon?.code ?? null;
      }

      const conversion = buildGoAffProConversionPayload({
        orderNumber,
        amountPaise: subscription.payment.amount,
        customerEmail: user?.email,
        couponCode,
      });

      if (!conversion) {
        return NextResponse.json({ ready: false });
      }

      logGoAffPro('referral found', {
        subscriptionId: subscriptionConversionId,
        paymentId: subscription.payment.id,
        plan: subscription.planName,
      });

      return NextResponse.json({
        ready: true,
        paymentId: subscription.payment.id,
        conversion,
      });
    }

    // Check business subscription first
    try {
      const businessCheck = await checkBusinessSubscription(userId);
      if (businessCheck.isActive && businessCheck.subscription) {
        return NextResponse.json({
          planType: 'business',
          isActive: true,
          subscription: {
            planName: businessCheck.subscription?.planName || null,
            status: businessCheck.subscription?.status || null,
            creditsRemaining: businessCheck.creditsRemaining ?? 0,
            totalCredits: businessCheck.subscription?.totalCredits ?? 0,
            usedCredits: businessCheck.subscription?.usedCredits ?? 0,
            expiresAt: businessCheck.subscription?.expiresAt || null,
          },
        });
      }
    } catch (businessError: any) {
      console.error('❌ [Payment Status] Business check error:', businessError);
      // Continue to check individual plan if business check fails
    }

    // Check individual plan
    try {
      const individualCheck = await checkIndividualPlanValidity(userId);
      if (individualCheck.isValid && individualCheck.credits) {
        const credits = individualCheck.credits;
        
        // Validate credits object has required fields
        if (!credits || typeof credits !== 'object') {
          return NextResponse.json({
            planType: null,
            isActive: false,
            message: 'No active plan',
          });
        }
        const pdfEntitlement = await resolvePdfDownloadEntitlement(userId, credits as Record<string, unknown>);
        return NextResponse.json({
        planType: 'individual',
        isActive: true,
        planName: credits.planName,
        daysRemaining: individualCheck.daysRemaining,
        credits: {
          resumeDownloads: {
            used: pdfEntitlement.used,
            limit: pdfEntitlement.effectiveLimit,
            remaining: pdfEntitlement.remaining,
          },
          aiResume: {
            used: credits.aiResumeUsage,
            limit: credits.aiResumeLimit,
            remaining: credits.aiResumeLimit - credits.aiResumeUsage,
          },
          aiCoverLetter: {
            used: credits.aiCoverLetterUsage,
            limit: credits.aiCoverLetterLimit,
            remaining: credits.aiCoverLetterLimit - credits.aiCoverLetterUsage,
          },
          pdfDownloads: {
            used: pdfEntitlement.used,
            limit: pdfEntitlement.effectiveLimit,
            remaining: pdfEntitlement.remaining,
          },
          docxDownloads: {
            used: credits.docxDownloads,
            limit: credits.docxDownloadsLimit,
            remaining: credits.docxDownloadsLimit - credits.docxDownloads,
          },
          templateAccess: credits.templateAccess,
          atsOptimization: credits.atsOptimization,
          atsTier: await getATSOptimizationLevel(userId),
        },
        entitlements: await getTemplateEntitlementSummary(userId),
        validUntil: credits.validUntil,
      });
      }
    } catch (individualError: any) {
      console.error('❌ [Payment Status] Individual check error:', individualError);
      // Continue to return no active plan if individual check fails
    }

    // No active plan
    return NextResponse.json({
      planType: null,
      isActive: false,
      message: 'No active plan',
    });
  } catch (error: any) {
    console.error('❌ [Payment Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/status
 * Register premium template slot usage (editor entry).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const templateId = typeof body.templateId === 'string' ? body.templateId.trim() : '';

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    const accessCheck = await canAccessTemplate(session.user.id, templateId, { registerUse: true });

    return NextResponse.json(
      {
        allowed: accessCheck.allowed,
        reason: accessCheck.reason,
        lockReason: accessCheck.lockReason,
      },
      { status: accessCheck.allowed ? 200 : 403 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to register template access';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

