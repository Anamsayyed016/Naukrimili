import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAdzuna, fetchFromJSearch } from '@/lib/jobs/providers';
import { upsertNormalizedJobs } from '@/lib/jobs/upsertJob';
import { z } from 'zod';

// In-memory rate limiter (per-IP) - replace with Redis in production if needed
const rateMap = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_REQ = 5;
function rateLimit(key: string) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || entry.reset < now) {
    rateMap.set(key, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQ) return false;
  entry.count += 1;
  return true;
}

const importBodySchema = z.object({
  queries: z.array(z.string().min(2)).min(1).max(5).default(['software developer']),
  country: z.string().length(2).default('IN'),
  page: z.number().int().positive().max(50).default(1),
});

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-import-api-key') || undefined;
  if (!apiKey || apiKey !== process.env.IMPORT_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (!rateLimit(`import:${ip}`)) {
    return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = importBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { queries, country, page } = parsed.data;
    const allJobs: any[] = [];
    for (const q of queries) {
      const [adz, jsearch] = await Promise.all([
        fetchFromAdzuna(q, country.toLowerCase(), page).catch(() => []),
        fetchFromJSearch(q, country.toUpperCase(), page).catch(() => []),
      ]);
      allJobs.push(...adz, ...jsearch);
    }
    const saved = await upsertNormalizedJobs(allJobs);
    return NextResponse.json({ imported: saved.length });
  } catch (e: any) {
    console.error('import route error', e);
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
