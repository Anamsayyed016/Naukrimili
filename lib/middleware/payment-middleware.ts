/**
 * Payment Middleware
 * Checks user credits and plan validity before allowing actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { 
  canDownloadResume, 
  canUseAI, 
  checkBusinessSubscription,
  checkIndividualPlanValidity 
} from '@/lib/services/payment-service';

/**
 * Check if user can perform resume-related actions
 */
export async function checkResumeAccess(userId: string, action: 'download' | 'aiResume' | 'aiCoverLetter'): Promise<{
  allowed: boolean;
  reason?: string;
  isBusiness?: boolean;
  creditsRemaining?: number;
  daysRemaining?: number;
}> {
  // Check business subscription first
  const businessCheck = await checkBusinessSubscription(userId);
  if (businessCheck.isActive) {
    // Business users have unlimited access (credits are managed separately)
    return {
      allowed: true,
      isBusiness: true,
      creditsRemaining: businessCheck.creditsRemaining,
    };
  }

  // Check individual plan
  const individualCheck = await checkIndividualPlanValidity(userId);
  if (!individualCheck.isValid) {
    return {
      allowed: false,
      reason: 'No active plan. Please purchase a plan to continue.',
    };
  }

  // Check specific action limits
  if (action === 'download') {
    const downloadCheck = await canDownloadResume(userId);
    return {
      allowed: downloadCheck.allowed,
      reason: downloadCheck.reason,
      daysRemaining: individualCheck.daysRemaining,
      creditsRemaining: downloadCheck.remaining,
    };
  } else if (action === 'aiResume' || action === 'aiCoverLetter') {
    const aiCheck = await canUseAI(userId, action === 'aiResume' ? 'resume' : 'coverLetter');
    return {
      allowed: aiCheck.allowed,
      reason: aiCheck.reason,
      daysRemaining: individualCheck.daysRemaining,
      creditsRemaining: aiCheck.remaining,
    };
  }

  return { allowed: true };
}

/**
 * Middleware wrapper for API routes that require payment
 */
export function withPaymentCheck(
  handler: (req: NextRequest, context: { userId: string }) => Promise<NextResponse>,
  action: 'download' | 'aiResume' | 'aiCoverLetter'
) {
  return async (req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const accessCheck = await checkResumeAccess(session.user.id, action);
      if (!accessCheck.allowed) {
        return NextResponse.json(
          { 
            error: accessCheck.reason || 'Access denied',
            requiresPayment: true,
            daysRemaining: accessCheck.daysRemaining,
            creditsRemaining: accessCheck.creditsRemaining,
          },
          { status: 403 }
        );
      }

      return handler(req, { userId: session.user.id });
    } catch (error: any) {
      console.error('❌ [Payment Middleware] Error:', error);
      return NextResponse.json(
        { error: 'Payment check failed', details: error.message },
        { status: 500 }
      );
    }
  };
}

