/**
 * Resume AI Optimization — single centralized analyze endpoint
 * POST /api/resume-builder/optimize
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import {
  checkResumeOptimizationPanelAccess,
  shouldBillResumeOptimizationUsage,
} from '@/lib/resume-optimization-access';
import { incrementUsage } from '@/lib/services/payment-service';
import { getResumeOptimizationOrchestrator } from '@/lib/resume-builder/ai-optimization/orchestrator';
import type { OptimizeResumeRequest } from '@/lib/resume-builder/ai-optimization/types';
import { getUnifiedAI } from '@/lib/services/unified-ai-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function aiAvailable(): boolean {
  return (
    getUnifiedAI().isAvailable() ||
    !!(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY)
  );
}

/** Lightweight access probe — avoids POST 403 noise from silent auto-run in the editor. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ allowed: false, reason: 'Unauthorized' }, { status: 401 });
    }

    const accessCheck = await checkResumeOptimizationPanelAccess(session.user.id);
    return NextResponse.json({
      allowed: accessCheck.allowed,
      freeTier: accessCheck.freeTier ?? false,
      requiresPayment: !accessCheck.allowed,
      reason: accessCheck.reason,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Access check failed';
    return NextResponse.json({ allowed: false, reason: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
    }

    const accessCheck = await checkResumeOptimizationPanelAccess(session.user.id);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: accessCheck.reason || 'AI usage limit reached',
          success: false,
          requiresPayment: true,
          daysRemaining: accessCheck.daysRemaining,
          creditsRemaining: accessCheck.creditsRemaining,
        },
        { status: 403 }
      );
    }

    if (!aiAvailable()) {
      return NextResponse.json(
        {
          error: 'AI service not available. Configure OPENAI_API_KEY or GEMINI_API_KEY.',
          success: false,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      targetRole = '',
      industry = '',
      experienceLevel = '',
      jobDescription = '',
      formData = {},
    } = body;

    if (!targetRole?.trim()) {
      return NextResponse.json(
        { error: 'targetRole is required', success: false },
        { status: 400 }
      );
    }

    const payload: OptimizeResumeRequest = {
      targetRole: String(targetRole).trim(),
      industry: String(industry).trim(),
      experienceLevel: String(experienceLevel).trim(),
      jobDescription: String(jobDescription || '').trim(),
      formData: typeof formData === 'object' && formData !== null ? formData : {},
    };

    console.log('🎯 Resume optimize:', {
      userId: session.user.id,
      targetRole: payload.targetRole,
      jdLength: payload.jobDescription.length,
    });

    const orchestrator = getResumeOptimizationOrchestrator();
    const report = await orchestrator.optimize(session.user.id, payload);

    if (shouldBillResumeOptimizationUsage(accessCheck)) {
      try {
        await incrementUsage(session.user.id, 'aiResume');
      } catch (creditError) {
        console.error('⚠️ [Optimize] Credit increment failed:', creditError);
      }
    }

    return NextResponse.json({
      ...report,
      freeTier: accessCheck.freeTier ?? false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Optimization failed';
    console.error('❌ Resume optimize error:', error);
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
