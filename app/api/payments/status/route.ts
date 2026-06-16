/**
 * Get Payment Status API
 * GET /api/payments/status
 * 
 * Returns user's current plan status, credits, and validity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { checkIndividualPlanValidity, checkBusinessSubscription } from '@/lib/services/payment-service';
import { prisma } from '@/lib/prisma';
import {
  buildGoAffProConversionPayload,
  isGoAffProReported,
  logGoAffPro,
  parsePaymentGoAffProMetadata,
} from '@/lib/goaffpro-conversion';

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
        return NextResponse.json({
        planType: 'individual',
        isActive: true,
        planName: credits.planName,
        daysRemaining: individualCheck.daysRemaining,
        credits: {
          resumeDownloads: {
            used: credits.resumeDownloads,
            limit: credits.resumeDownloadsLimit,
            remaining: credits.resumeDownloadsLimit - credits.resumeDownloads,
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
            used: credits.pdfDownloads,
            limit: credits.pdfDownloadsLimit,
            remaining: credits.pdfDownloadsLimit - credits.pdfDownloads,
          },
          docxDownloads: {
            used: credits.docxDownloads,
            limit: credits.docxDownloadsLimit,
            remaining: credits.docxDownloadsLimit - credits.docxDownloads,
          },
          templateAccess: credits.templateAccess,
          atsOptimization: credits.atsOptimization,
        },
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

