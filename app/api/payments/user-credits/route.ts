/**
 * Get User Credits API
 * GET /api/payments/user-credits
 * 
 * Returns detailed credit information for frontend display
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { checkIndividualPlanValidity, checkBusinessSubscription } from '@/lib/services/payment-service';
import { prisma } from '@/lib/prisma';

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

    // Check business subscription first
    const businessCheck = await checkBusinessSubscription(userId);
    if (businessCheck.isActive && businessCheck.subscription) {
      return NextResponse.json({
        planType: 'business',
        isActive: true,
        subscription: {
          planName: businessCheck.subscription.planName,
          status: businessCheck.subscription.status,
          creditsRemaining: businessCheck.creditsRemaining,
          totalCredits: businessCheck.subscription.totalCredits,
          usedCredits: businessCheck.subscription.usedCredits,
          expiresAt: businessCheck.subscription.expiresAt,
        },
      });
    }

    // Check individual plan
    const individualCheck = await checkIndividualPlanValidity(userId);
    if (individualCheck.isValid && individualCheck.credits) {
      const credits = individualCheck.credits;
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

    // No active plan
    return NextResponse.json({
      planType: null,
      isActive: false,
      message: 'No active plan',
    });
  } catch (error: any) {
    console.error('❌ [User Credits] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits', details: error.message },
      { status: 500 }
    );
  }
}

