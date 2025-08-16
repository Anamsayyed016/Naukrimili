import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchFromAdzuna, fetchFromJSearch } from '@/lib/jobs/providers';
import { upsertNormalizedJobs } from '@/lib/jobs/upsertJob';

const importBodySchema = z.object({
  queries: z.array(z.string().min(2)).min(1).max(5).default(['software developer']),
  country: z.string().length(2).default('IN'),
  page: z.number().int().positive().max(50).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = importBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { queries, country, page } = parsed.data;

    // Normalize country codes for providers
    const adzunaCountry = (country || 'IN').toLowerCase();
    const jsearchCountry = (country || 'IN').toUpperCase();

    // Fetch from providers concurrently for all queries
    const fetchTasks: Promise<any[]>[] = [];
    for (const q of queries) {
      fetchTasks.push(fetchFromAdzuna(q, adzunaCountry, page));
      fetchTasks.push(fetchFromJSearch(q, jsearchCountry, page));
    }

    const fetchedBatches = await Promise.allSettled(fetchTasks);
    const fetched: any[] = [];
    let adzunaCount = 0;
    let jsearchCount = 0;
    fetchedBatches.forEach((res, idx) => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        fetched.push(...res.value);
        // Even indices are Adzuna (based on push order), odd are JSearch
        if (idx % 2 === 0) adzunaCount += res.value.length; else jsearchCount += res.value.length;
      }
    });

    // Upsert into database (composite unique [source, sourceId])
    const persisted = await upsertNormalizedJobs(fetched);

    return NextResponse.json({
      success: true,
      imported: persisted.length,
      fetched: fetched.length,
      providers: {
        adzuna: adzunaCount,
        jsearch: jsearchCount,
      },
      country,
      page,
      queries,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
