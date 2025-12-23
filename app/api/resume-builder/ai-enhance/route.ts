/**
 * AI Enhancement API Route
 * Enhances resume content using OpenAI/Gemini for better ATS optimization
 * 
 * POST /api/resume-builder/ai-enhance
 * 
 * Body:
 * {
 *   "jobTitle": "Software Engineer",
 *   "industry": "Technology",
 *   "experienceLevel": "experienced",
 *   "currentContent": "...",
 *   "enhancementType": "summary" | "skills" | "experience" | "keywords" | "optimize"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { EnhancedAIService } from '@/lib/services/enhanced-ai-service';
import { checkResumeAccess } from '@/lib/middleware/payment-middleware';
import { incrementUsage } from '@/lib/services/payment-service';

const aiService = new EnhancedAIService();

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check payment/credits before allowing AI usage
    const accessCheck = await checkResumeAccess(session.user.id, 'aiResume');
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { 
          error: accessCheck.reason || 'AI usage limit reached',
          requiresPayment: true,
          daysRemaining: accessCheck.daysRemaining,
          creditsRemaining: accessCheck.creditsRemaining,
        },
        { status: 403 }
      );
    }

    if (!aiService.isAvailable()) {
      return NextResponse.json(
        { error: 'AI service not available. Please configure OPENAI_API_KEY or GEMINI_API_KEY.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { jobTitle, industry, experienceLevel, currentContent, enhancementType } = body;

    if (!enhancementType) {
      return NextResponse.json(
        { error: 'Missing required field: enhancementType' },
        { status: 400 }
      );
    }

    console.log('🤖 AI enhancement requested:', { enhancementType, hasContent: !!currentContent });

    const result = await aiService.enhanceContent({
      jobTitle,
      industry,
      experienceLevel,
      currentContent,
      enhancementType,
    });

    console.log('✅ AI enhancement completed:', {
      enhancedLength: result.enhanced.length,
      suggestionsCount: result.suggestions.length,
      keywordsCount: result.keywords.length,
      confidence: result.confidence,
    });

    // Increment AI usage counter after successful enhancement
    try {
      await incrementUsage(session.user.id, 'aiResume');
    } catch (creditError: any) {
      console.error('⚠️ [AI Enhance] Credit increment failed:', creditError);
      // Don't fail the request if credit increment fails
    }

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error: any) {
    console.error('❌ AI enhancement error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to enhance content', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

