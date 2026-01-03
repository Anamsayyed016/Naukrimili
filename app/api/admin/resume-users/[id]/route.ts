import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { checkIndividualPlanValidity, checkBusinessSubscription } from '@/lib/services/payment-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        userCredits: true,
        subscription: {
          include: {
            creditTransactions: {
              orderBy: { createdAt: 'desc' },
              take: 50
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const individualCheck = await checkIndividualPlanValidity(user.id);
    const businessCheck = await checkBusinessSubscription(user.id);

    let planData: any = {
      planType: 'none',
      planName: null,
      status: 'none',
      pdfUsed: 0,
      pdfLimit: 0,
      dailyUsed: 0,
      dailyLimit: null,
      aiResumeUsed: 0,
      aiResumeLimit: 0,
      aiCoverLetterUsed: 0,
      aiCoverLetterLimit: 0,
      creditsRemaining: null,
      expiryDate: null,
      daysRemaining: null,
      totalCredits: null,
      usedCredits: null
    };

    if (businessCheck.isActive && businessCheck.subscription) {
      const sub = businessCheck.subscription;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDownloads = sub.creditTransactions?.filter(
        tx => tx.createdAt >= today && tx.type === 'deduct' && tx.reason === 'resume_download'
      ).length || 0;

      planData = {
        planType: 'business',
        planName: sub.planName,
        status: 'active',
        pdfUsed: sub.usedCredits || 0,
        pdfLimit: sub.totalCredits || 0,
        dailyUsed: todayDownloads,
        dailyLimit: (sub as any).maxDownloadsPerDay || null,
        aiResumeUsed: 0,
        aiResumeLimit: -1,
        aiCoverLetterUsed: 0,
        aiCoverLetterLimit: -1,
        creditsRemaining: sub.remainingCredits || 0,
        totalCredits: sub.totalCredits || 0,
        usedCredits: sub.usedCredits || 0,
        expiryDate: sub.expiresAt?.toISOString() || null,
        daysRemaining: sub.expiresAt ? Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
        billingCycle: sub.billingCycle,
        subscriptionId: sub.id
      };
    } else if (individualCheck.isValid && individualCheck.credits) {
      const credits = individualCheck.credits;
      planData = {
        planType: 'individual',
        planName: credits.planName,
        status: 'active',
        pdfUsed: credits.pdfDownloads || 0,
        pdfLimit: credits.pdfDownloadsLimit || 0,
        dailyUsed: 0,
        dailyLimit: (credits as any).maxDownloadsPerDay || null,
        aiResumeUsed: credits.aiResumeUsage || 0,
        aiResumeLimit: credits.aiResumeLimit || 0,
        aiCoverLetterUsed: credits.aiCoverLetterUsage || 0,
        aiCoverLetterLimit: credits.aiCoverLetterLimit || 0,
        creditsRemaining: null,
        expiryDate: credits.validUntil?.toISOString() || null,
        daysRemaining: individualCheck.daysRemaining || null,
        templateAccess: credits.templateAccess,
        atsOptimization: credits.atsOptimization
      };
    } else if (user.userCredits) {
      const credits = user.userCredits;
      planData = {
        planType: credits.planType as string,
        planName: credits.planName,
        status: 'expired',
        pdfUsed: credits.pdfDownloads || 0,
        pdfLimit: credits.pdfDownloadsLimit || 0,
        dailyUsed: 0,
        dailyLimit: null,
        aiResumeUsed: credits.aiResumeUsage || 0,
        aiResumeLimit: credits.aiResumeLimit || 0,
        aiCoverLetterUsed: credits.aiCoverLetterUsage || 0,
        aiCoverLetterLimit: credits.aiCoverLetterLimit || 0,
        creditsRemaining: null,
        expiryDate: credits.validUntil?.toISOString() || null,
        daysRemaining: null
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt.toISOString()
        },
        plan: planData
      }
    });
  } catch (error) {
    console.error('Admin resume user GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user resume builder data' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

