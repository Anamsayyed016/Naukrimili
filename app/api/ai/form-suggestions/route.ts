import { NextRequest, NextResponse } from 'next/server';
import { HybridFormSuggestions } from '@/lib/hybrid-form-suggestions';

const hybridFormSuggestions = new HybridFormSuggestions();

export async function POST(request: NextRequest) {
  try {
    const { field, value, context = {} } = await request.json();

    if (!field || !value) {
      return NextResponse.json({
        success: false,
        error: 'Field and value are required'
      }, { status: 400 });
    }

    // Generate suggestions using hybrid AI
    const result = await hybridFormSuggestions.generateSuggestions(field, value, context);

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions,
      confidence: result.confidence,
      aiProvider: result.aiProvider
    });

  } catch (error) {
    console.error('AI form suggestions error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate suggestions'
    }, { status: 500 });
  }
}

