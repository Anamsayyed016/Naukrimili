import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { checkIndividualPlanValidity, checkBusinessSubscription } from '@/lib/services/payment-service';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const planType = searchParams.get('planType'); // 'all', 'individual', 'business', 'none'
    const status = searchParams.get('status'); // 'all', 'active', 'expired', 'low_credits'
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Get all users with their credits and subscriptions
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
                where: {
                  type: 'deduct',
                  reason: 'resume_download',
                  createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                  }
                }
              }
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Enrich users with resume builder data
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const individualCheck = await checkIndividualPlanValidity(user.id);
      const businessCheck = await checkBusinessSubscription(user.id);

      let planData: {
        planType: 'individual' | 'business' | 'none';
        planName: string | null;
        status: 'active' | 'expired' | 'none';
        pdfUsed: number;
        pdfLimit: number;
        dailyUsed: number;
        dailyLimit: number | null;
        aiResumeUsed: number;
        aiResumeLimit: number;
        aiCoverLetterUsed: number;
        aiCoverLetterLimit: number;
        creditsRemaining: number | null;
        expiryDate: string | null;
        daysRemaining: number | null;
      } = {
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
        daysRemaining: null
      };

      if (businessCheck.isActive && businessCheck.subscription) {
        const sub = businessCheck.subscription;
        planData = {
          planType: 'business',
          planName: sub.planName,
          status: 'active',
          pdfUsed: sub.usedCredits || 0,
          pdfLimit: sub.totalCredits || 0,
          dailyUsed: sub.creditTransactions?.length || 0,
          dailyLimit: (sub as any).maxDownloadsPerDay || null,
          aiResumeUsed: 0,
          aiResumeLimit: -1, // Unlimited for business
          aiCoverLetterUsed: 0,
          aiCoverLetterLimit: -1,
          creditsRemaining: sub.remainingCredits || 0,
          expiryDate: sub.expiresAt?.toISOString() || null,
          daysRemaining: sub.expiresAt ? Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
        };
      } else if (individualCheck.isValid && individualCheck.credits) {
        const credits = individualCheck.credits;
        planData = {
          planType: 'individual',
          planName: credits.planName,
          status: 'active',
          pdfUsed: credits.pdfDownloads || 0,
          pdfLimit: credits.pdfDownloadsLimit || 0,
          dailyUsed: 0, // Would need daily counter field
          dailyLimit: (credits as any).maxDownloadsPerDay || null,
          aiResumeUsed: credits.aiResumeUsage || 0,
          aiResumeLimit: credits.aiResumeLimit || 0,
          aiCoverLetterUsed: credits.aiCoverLetterUsage || 0,
          aiCoverLetterLimit: credits.aiCoverLetterLimit || 0,
          creditsRemaining: null,
          expiryDate: credits.validUntil?.toISOString() || null,
          daysRemaining: individualCheck.daysRemaining || null
        };
      } else if (user.userCredits) {
        // Expired plan
        const credits = user.userCredits;
        planData = {
          planType: credits.planType as 'individual' | 'business' | 'none',
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

      // Apply filters
      if (planType && planType !== 'all') {
        if (planType === 'none' && planData.planType !== 'none') return null;
        if (planType !== 'none' && planData.planType !== planType) return null;
      }

      if (status && status !== 'all') {
        if (status === 'active' && planData.status !== 'active') return null;
        if (status === 'expired' && planData.status !== 'expired') return null;
        if (status === 'low_credits' && planData.planType === 'business' && (planData.creditsRemaining || 0) > (planData.pdfLimit * 0.2)) return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt.toISOString(),
        ...planData
      };
    }));

    // Filter out nulls
    const filteredUsers = enrichedUsers.filter((u): u is NonNullable<typeof u> => u !== null);
    
    // Apply filters
    let finalUsers = filteredUsers;
    
    if (planType && planType !== 'all') {
      finalUsers = finalUsers.filter(u => {
        if (planType === 'none') return u.planType === 'none';
        return u.planType === planType;
      });
    }
    
    if (status && status !== 'all') {
      finalUsers = finalUsers.filter(u => {
        if (status === 'active') return u.status === 'active';
        if (status === 'expired') return u.status === 'expired';
        if (status === 'low_credits') {
          return u.planType === 'business' && u.creditsRemaining !== null && u.pdfLimit > 0 && (u.creditsRemaining / u.pdfLimit) <= 0.2;
        }
        return true;
      });
    }

    // Apply pagination after filtering
    const paginatedUsers = finalUsers.slice(skip, skip + limit);
    
    return NextResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total: finalUsers.length,
          totalPages: Math.ceil(finalUsers.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin resume users GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resume builder users' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

