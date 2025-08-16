import { NextRequest, NextResponse } from 'next/server';

// Compatibility wrapper: forwards to /api/jobs and adapts response format if needed
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const fwd = new URL(url.pathname.replace('/api/jobs/search', '/api/jobs') + (url.search || ''), url.origin);
  const resp = await fetch(fwd, { headers: { 'accept': 'application/json' } });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return NextResponse.json(json || { success: false, error: 'Search failed' }, { status: resp.status });
  }
  // Ensure consistent shape for optimized hooks
  return NextResponse.json({
    success: true,
    data: {
      jobs: json.jobs || [],
      pagination: json.pagination || { total_results: 0, current_page: 1, per_page: 20 },
    },
    filters: { applied: {}, available: json.availableFilters || {} },
    meta: {
      search_time_ms: 0,
      query_type: 'compat',
      total_in_db: (json.pagination?.total_results) || 0,
      suggestions: [],
    },
  });
}


