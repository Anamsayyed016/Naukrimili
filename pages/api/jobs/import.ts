import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchFromAdzuna, fetchFromJSearch } from '@/lib/jobs/providers';
import { upsertNormalizedJobs } from '@/lib/jobs/upsertJob';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Simple in-memory rate limiter (per-IP). Replace with Redis for distributed environments.
const rateMap = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000; // 1 minute window
const MAX_REQ = 5; // max requests per window

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = (req.headers['x-import-api-key'] as string) || (req.body?.importApiKey as string | undefined);
  if (!apiKey || apiKey !== process.env.IMPORT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Rate limit by IP
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (!rateLimit(`import:${ip}`)) return res.status(429).json({ error: 'rate limit exceeded' });

  try {
    const parsed = importBodySchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
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
    res.status(200).json({ imported: saved.length });
  } catch (error: any) {
    console.error('import error', error);
    res.status(500).json({ error: error?.message || 'failed' });
  }
}
