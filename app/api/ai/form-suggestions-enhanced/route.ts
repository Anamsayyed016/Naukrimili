/**
 * Enhanced Form Suggestions API
 * Hybrid approach: Instant database search + AI enhancement
 * Provides Google-like real-time suggestions for resume builder
 * 
 * This is an ENHANCED version that doesn't replace the existing endpoint
 * The existing /api/ai/form-suggestions continues to work
 */

import { NextRequest, NextResponse } from 'next/server';
import { getResumeAutocompleteService } from '@/lib/services/resume-autocomplete-service';

export async function POST(request: NextRequest) {
  let field = 'skills';
  let value = '';
  let context = {};

  try {
    const requestData = await request.json();
    field = requestData.field || 'skills';
    value = requestData.value || requestData._value || '';
    context = requestData.context || {};

    console.log(`🚀 Enhanced autocomplete - Field: ${field}, Value: "${value.substring(0, 50)}..."`);

    if (!field) {
      return NextResponse.json(
        {
          success: false,
          error: 'Field is required',
        },
        { status: 400 }
      );
    }

    if (!value || value.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        source: 'fallback',
        confidence: 0,
        message: 'Query must be at least 2 characters',
      });
    }

    // Map field names to internal format
    const fieldMap: Record<string, string> = {
      'summary': 'summary',
      'skills': 'skills',
      'description': 'description',
      'bullet': 'description', // Bullet points are treated as descriptions but shorter
      'project': 'project',
      'certification': 'certification',
      'language': 'language',
      'achievement': 'achievement',
      'internship': 'internship',
      'company': 'company',
      'position': 'position',
      'job_title': 'job_title',
      'title': 'job_title',
    };

    const mappedField = fieldMap[field] || field;

    // Get hybrid suggestions
    const autocompleteService = getResumeAutocompleteService();
    const result = await autocompleteService.getSuggestions(
      mappedField,
      value,
      context
    );

    console.log(`✅ Enhanced autocomplete - ${result.suggestions.length} suggestions (${result.source}, ${result.responseTime}ms)`);

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions,
      confidence: result.confidence,
      source: result.source,
      responseTime: result.responseTime,
      aiProvider: result.source === 'database' ? 'database' : 'hybrid',
    });
  } catch (error: any) {
    console.error('❌ Enhanced autocomplete error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      field,
      value: value.substring(0, 50),
      context: JSON.stringify(context).substring(0, 100),
    });

    // Fallback to empty suggestions (don't break the UI)
    return NextResponse.json({
      success: true,
      suggestions: [],
      source: 'fallback',
      confidence: 0,
      error: error.message || 'Unknown error',
      message: 'Enhanced autocomplete temporarily unavailable',
    });
  }
}

