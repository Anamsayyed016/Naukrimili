/**
 * Debug AI Suggestions API
 * Test endpoint to debug AI suggestion functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { HybridFormSuggestions } from '@/lib/hybrid-form-suggestions';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug AI suggestions API called');
    
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field') || 'title';
    const value = searchParams.get('value') || 'software engineer';
    
    console.log(`📊 Testing AI suggestions for field: ${field}, value: ${value}`);
    
    // Test environment variables
    const envCheck = {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('🔑 Environment check:', envCheck);
    
    // Test hybrid form suggestions
    const hybridFormSuggestions = new HybridFormSuggestions();
    
    const testContext = {
      jobType: 'Full-time',
      experienceLevel: 'Mid Level',
      location: 'Remote'
    };
    
    console.log('🔮 Testing hybrid form suggestions...');
    const result = await hybridFormSuggestions.generateSuggestions(field, value, testContext);
    
    console.log('✅ AI suggestions result:', {
      success: true,
      suggestionsCount: result.suggestions.length,
      confidence: result.confidence,
      aiProvider: result.aiProvider
    });
    
    return NextResponse.json({
      success: true,
      message: 'AI suggestions debug completed',
      environment: envCheck,
      testParams: { field, value, context: testContext },
      result: {
        suggestions: result.suggestions.slice(0, 5), // Show first 5 suggestions
        confidence: result.confidence,
        aiProvider: result.aiProvider,
        totalSuggestions: result.suggestions.length
      }
    });
    
  } catch (error: any) {
    console.error('❌ AI suggestions debug failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'AI suggestions debug failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug AI suggestions POST called');
    
    const body = await request.json();
    const { field, value, context } = body;
    
    console.log(`📊 Testing AI suggestions for field: ${field}, value: ${value}`);
    
    // Test hybrid form suggestions
    const hybridFormSuggestions = new HybridFormSuggestions();
    
    const result = await hybridFormSuggestions.generateSuggestions(field, value, context || {});
    
    console.log('✅ AI suggestions result:', {
      success: true,
      suggestionsCount: result.suggestions.length,
      confidence: result.confidence,
      aiProvider: result.aiProvider
    });
    
    return NextResponse.json({
      success: true,
      message: 'AI suggestions test completed',
      result: {
        suggestions: result.suggestions,
        confidence: result.confidence,
        aiProvider: result.aiProvider
      }
    });
    
  } catch (error: any) {
    console.error('❌ AI suggestions POST debug failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'AI suggestions POST debug failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
