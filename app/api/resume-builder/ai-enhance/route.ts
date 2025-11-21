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
import { EnhancedAIService } from '@/lib/services/enhanced-ai-service';

const aiService = new EnhancedAIService();

export async function POST(request: NextRequest) {
  try {
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

