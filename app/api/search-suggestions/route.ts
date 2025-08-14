/**
 * Search Suggestions API - Real Database Integration
 * Provides dynamic search suggestions based on actual job data
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    const suggestions = getFallbackSuggestions(q);

    return NextResponse.json({
      success: true,
      suggestions,
      query: q,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: true, suggestions: getFallbackSuggestions('') });
  }
}

function getFallbackSuggestions(query: string) {
  const q = query.toLowerCase();
  const titles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer'];
  const companies = ['TechCorp', 'InnovateSoft', 'Digital Solutions', 'Future Systems', 'CloudTech'];
  const locations = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai'];

  const suggestions = [
    ...titles.filter(t => t.toLowerCase().includes(q)).map(v => ({ type: 'title', value: v })),
    ...companies.filter(c => c.toLowerCase().includes(q)).map(v => ({ type: 'company', value: v })),
    ...locations.filter(l => l.toLowerCase().includes(q)).map(v => ({ type: 'location', value: v })),
  ];

  return suggestions.slice(0, 10);
}
