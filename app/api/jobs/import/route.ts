import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, checkJobProvidersHealth } from '@/lib/jobs/providers';
import { upsertNormalizedJobs } from '@/lib/jobs/upsertJob';

const importBodySchema = z.object({
  queries: z.array(z.string().min(2)).min(1).max(5).default(['software developer']),
  country: z.string().length(2).default('IN'),
  page: z.number().int().positive().max(50).default(1),
  location: z.string().optional(),
  radiusKm: z.number().min(1).max(100).default(25),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = importBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { queries, country, page, location, radiusKm } = parsed.data;

    console.log(`🚀 Starting job import: ${queries.join(', ')} in ${country}${location ? ` near ${location}` : ''}`);

    // Check API health first
    const health = await checkJobProvidersHealth();
    console.log('📊 API Health Check:', health);

    // Normalize country codes for providers
    const adzunaCountry = (country || 'IN').toLowerCase();
    const jsearchCountry = (country || 'IN').toUpperCase();

    // Fetch from providers concurrently for all queries
    const fetchTasks: Promise<any[]>[] = [];
    for (const q of queries) {
      // Adzuna
      fetchTasks.push(fetchFromAdzuna(q, adzunaCountry, page, { location, distanceKm: radiusKm }));
      // JSearch
      fetchTasks.push(fetchFromJSearch(q, jsearchCountry, page));
      // Google Jobs
      fetchTasks.push(fetchFromGoogleJobs(q, location || 'India', page));
    }

    const fetchedBatches = await Promise.allSettled(fetchTasks);
    const fetched: any[] = [];
    let adzunaCount = 0;
    let jsearchCount = 0;
    let googleCount = 0;

    fetchedBatches.forEach((res, idx) => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        fetched.push(...res.value);
        // Count by provider (every 3rd is Google Jobs)
        if (idx % 3 === 0) adzunaCount += res.value.length;
        else if (idx % 3 === 1) jsearchCount += res.value.length;
        else googleCount += res.value.length;
      }
    });

    console.log(`📈 Import Summary: Adzuna(${adzunaCount}), JSearch(${jsearchCount}), Google(${googleCount})`);

    // Upsert into database (composite unique [source, sourceId])
    const persisted = await upsertNormalizedJobs(fetched);

    return NextResponse.json({
      success: true,
      imported: persisted.length,
      fetched: fetched.length,
      providers: {
        adzuna: adzunaCount,
        jsearch: jsearchCount,
        googleJobs: googleCount,
      },
      health: health,
      country,
      page,
      queries,
      location,
      radiusKm,
    });
  } catch (e: any) {
    console.error('❌ Job import failed:', e);
    return NextResponse.json({ success: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
