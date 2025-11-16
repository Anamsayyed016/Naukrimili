/**
 * Typesense Autocomplete API Endpoint
 * Provides real-time, typo-tolerant search suggestions using Typesense Cloud
 * 
 * GET /api/search/autocomplete?q=query&type=job_title|company|location|skill|all
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  autocompleteSearch,
  multiCollectionAutocomplete,
  isTypesenseConfigured,
  AutocompleteSuggestion,
} from '@/lib/typesense/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || searchParams.get('query') || '').trim();
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate query
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'Query must be at least 2 characters',
      });
    }

    // Check if Typesense is configured
    if (!isTypesenseConfigured()) {
      console.warn('Typesense is not configured. Returning empty suggestions.');
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'Typesense is not configured',
        fallback: true,
      });
    }

    let suggestions: AutocompleteSuggestion[] = [];

    // Route to appropriate search based on type
    if (type === 'all') {
      // Search across all collections
      suggestions = await multiCollectionAutocomplete(query, limit);
    } else {
      // Search specific collection
      const collectionMap: Record<string, 'job_titles' | 'companies' | 'locations' | 'skills'> = {
        job_title: 'job_titles',
        company: 'companies',
        location: 'locations',
        skill: 'skills',
      };

      const collection = collectionMap[type];
      if (collection) {
        suggestions = await autocompleteSearch({
          query,
          collection,
          limit,
          prefix: true,
          typoTolerance: 2,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid type. Must be one of: job_title, company, location, skill, or all`,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
      query,
      type,
      count: suggestions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Autocomplete API error:', error);

    // Return graceful error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch suggestions',
        message: error.message || 'Unknown error',
        suggestions: [],
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for more complex autocomplete requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type = 'all', limit = 10 } = body;

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'Query must be at least 2 characters',
      });
    }

    if (!isTypesenseConfigured()) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'Typesense is not configured',
        fallback: true,
      });
    }

    let suggestions: AutocompleteSuggestion[] = [];

    if (type === 'all') {
      suggestions = await multiCollectionAutocomplete(query, limit);
    } else {
      const collectionMap: Record<string, 'job_titles' | 'companies' | 'locations' | 'skills'> = {
        job_title: 'job_titles',
        company: 'companies',
        location: 'locations',
        skill: 'skills',
      };

      const collection = collectionMap[type];
      if (collection) {
        suggestions = await autocompleteSearch({
          query,
          collection,
          limit,
          prefix: true,
          typoTolerance: 2,
        });
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
      query,
      type,
      count: suggestions.length,
    });
  } catch (error: any) {
    console.error('Autocomplete POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch suggestions',
        suggestions: [],
      },
      { status: 500 }
    );
  }
}

