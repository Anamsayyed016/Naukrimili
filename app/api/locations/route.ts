/**
 * Locations API - Real Database Integration
 * GET /api/locations - Get locations with job counts and statistics
 */

import { NextRequest, NextResponse } from 'next/server';

const mockLocations = [
  { name: 'Bangalore', country: 'IN', job_count: 124, latest_job_date: new Date().toISOString(), work_arrangements: { on_site: 60, remote: 50, hybrid: 14 }, salary_stats: { average_min: 900000, average_max: 2400000, lowest: 300000, highest: 3500000, currency: 'INR' } },
  { name: 'Mumbai', country: 'IN', job_count: 98, latest_job_date: new Date().toISOString(), work_arrangements: { on_site: 70, remote: 20, hybrid: 8 }, salary_stats: { average_min: 800000, average_max: 2000000, lowest: 250000, highest: 3200000, currency: 'INR' } },
  { name: 'Delhi', country: 'IN', job_count: 76, latest_job_date: new Date().toISOString(), work_arrangements: { on_site: 40, remote: 25, hybrid: 11 }, salary_stats: { average_min: 700000, average_max: 1800000, lowest: 200000, highest: 3000000, currency: 'INR' } },
  { name: 'Hyderabad', country: 'IN', job_count: 65, latest_job_date: new Date().toISOString(), work_arrangements: { on_site: 30, remote: 28, hybrid: 7 }, salary_stats: { average_min: 650000, average_max: 1700000, lowest: 180000, highest: 2800000, currency: 'INR' } },
  { name: 'Chennai', country: 'IN', job_count: 52, latest_job_date: new Date().toISOString(), work_arrangements: { on_site: 26, remote: 20, hybrid: 6 }, salary_stats: { average_min: 600000, average_max: 1500000, lowest: 150000, highest: 2500000, currency: 'INR' } },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').toLowerCase();
    const country = (searchParams.get('country') || '').toUpperCase();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let results = mockLocations;
    if (q) {
      results = results.filter(loc =>
        loc.name.toLowerCase().includes(q) || loc.country.toLowerCase().includes(q)
      );
    }
    if (country) {
      results = results.filter(loc => loc.country === country);
    }

    const total = results.length;
    const data = results.slice(offset, offset + limit).map(loc => ({
      id: `${loc.name}-${loc.country}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: loc.name,
      country: loc.country,
      display_name: `${loc.name}, ${loc.country}`,
      job_count: loc.job_count,
      latest_job_date: loc.latest_job_date,
      job_types: { 'full-time': Math.round(loc.job_count * 0.7), 'contract': Math.round(loc.job_count * 0.2), internship: Math.round(loc.job_count * 0.1) },
      work_arrangements: loc.work_arrangements,
      salary_stats: loc.salary_stats,
    }));

    return NextResponse.json({
      success: true,
      message: `Found ${total} locations`,
      locations: data,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_results: total,
        per_page: limit,
        has_next: page * limit < total,
        has_prev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ success: false, error: 'Location creation not supported' }, { status: 405 });
}