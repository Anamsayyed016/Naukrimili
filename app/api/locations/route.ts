/**
 * Locations API - Real Database Integration
 * GET /api/locations - Get locations with job counts and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const country = (searchParams.get('country') || '').trim();
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const sortBy = (searchParams.get('sort_by') || 'job_count').toLowerCase(); // job_count | latest
    const offset = (page - 1) * limit;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    const whereBase: any = { isActive: true };
    if (country) {
      whereBase.country = { equals: country, mode: 'insensitive' };
    }
    if (q) {
      whereBase.OR = [
        { location: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
      ];
    }

    const grouped = await (prisma as any).job.groupBy({
      by: ['country', 'location'],
      where: whereBase,
      _count: { _all: true },
      _max: { createdAt: true, salaryMax: true },
      _min: { salaryMin: true },
      _avg: { salaryMin: true, salaryMax: true },
    });

    const sorted = [...grouped].sort((a: any, b: any) => {
      if (sortBy === 'latest') {
        const ad = new Date(a._max?.createdAt || 0).getTime();
        const bd = new Date(b._max?.createdAt || 0).getTime();
        return bd - ad;
      }
      return (b._count?._all || 0) - (a._count?._all || 0);
    });

    const totalDistinct = sorted.length;
    const paged = sorted.slice(offset, offset + limit);

    const filtersForPage = paged.map((g: any) => ({ country: g.country, location: g.location }));

    const keyFor = (c: string, l: string) => `${(l || '').trim()}::${(c || '').trim()}`;
    const arrangementByKey = new Map<string, { on_site: number; remote: number; hybrid: number }>();
    const jobTypesByKey = new Map<string, Record<string, number>>();

    if (filtersForPage.length > 0) {
      const arrangementRows = await (prisma as any).job.groupBy({
        by: ['country', 'location', 'isRemote', 'isHybrid'],
        where: { ...whereBase, OR: filtersForPage },
        _count: { _all: true },
      });
      for (const row of arrangementRows) {
        const k = keyFor(row.country, row.location);
        const prev = arrangementByKey.get(k) || { on_site: 0, remote: 0, hybrid: 0 };
        if (row.isHybrid) prev.hybrid += row._count._all || 0;
        else if (row.isRemote) prev.remote += row._count._all || 0;
        else prev.on_site += row._count._all || 0;
        arrangementByKey.set(k, prev);
      }

      const jobTypeRows = await (prisma as any).job.groupBy({
        by: ['country', 'location', 'jobType'],
        where: { ...whereBase, OR: filtersForPage },
        _count: { _all: true },
      });
      for (const row of jobTypeRows) {
        const k = keyFor(row.country, row.location);
        const prev = jobTypesByKey.get(k) || {};
        const jt = (row.jobType || 'unknown').toLowerCase();
        prev[jt] = (prev[jt] || 0) + (row._count._all || 0);
        jobTypesByKey.set(k, prev);
      }
    }

    const data = paged
      .filter((g: any) => g.location)
      .map((g: any) => {
        const k = keyFor(g.country, g.location);
        const work = arrangementByKey.get(k) || { on_site: 0, remote: 0, hybrid: 0 };
        const types = jobTypesByKey.get(k) || {};
        const lowest = g._min?.salaryMin ?? null;
        const highest = g._max?.salaryMax ?? null;
        const average_min = Math.round(g._avg?.salaryMin || 0) || null;
        const average_max = Math.round(g._avg?.salaryMax || 0) || null;
        const name = (g.location || 'Unknown').trim();
        const cc = (g.country || '').toUpperCase();
        const id = `${name}-${cc}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return {
          id,
          name,
          country: cc,
          display_name: cc ? `${name}, ${cc}` : name,
          job_count: g._count?._all || 0,
          latest_job_date: g._max?.createdAt || null,
          job_types: types,
          work_arrangements: work,
          salary_stats: {
            average_min,
            average_max,
            lowest,
            highest,
            currency: cc === 'IN' ? 'INR' : cc === 'US' ? 'USD' : undefined,
          },
        };
      });

    return NextResponse.json({
      success: true,
      message: `Found ${totalDistinct} locations`,
      locations: data,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalDistinct / limit),
        total_results: totalDistinct,
        per_page: limit,
        has_next: page * limit < totalDistinct,
        has_prev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
