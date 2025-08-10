import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchFromAdzuna, fetchFromJSearch, NormalizedJob } from '@/lib/jobs/providers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CacheEntry = { expiresAt: number; data: any };
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 3600);
const cache = new Map<string, CacheEntry>();

function cacheKey(q: string, country: string, page: string) {
  return `${q}::${country}::${page}`;
}

function normalizeCountry(code?: string) {
  if (!code) return 'us';
  const map: Record<string, string> = { IN: 'in', GB: 'gb', UK: 'gb', US: 'us', AE: 'ae', UAE: 'ae' };
  return map[code.toUpperCase()] || code.toLowerCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query = 'software developer', country = 'IN', page = '1' } = req.query;
    const q = String(query);
    const pageStr = String(page);
    const countryCode = normalizeCountry(String(country));

    if (process.env.ALLOWED_ORIGINS) {
      const origin = req.headers.origin;
      const allowed = String(process.env.ALLOWED_ORIGINS).split(',').map(s => s.trim());
      if (origin && !allowed.includes(origin)) {
        return res.status(403).json({ error: 'origin not allowed' });
      }
    }

    const key = cacheKey(q, countryCode, pageStr);
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
      return res.status(200).json({ source: 'cache', count: cached.data.length, jobs: cached.data });
    }

    const [adzunaJobs, jsearchJobs] = await Promise.all([
      fetchFromAdzuna(q, countryCode, Number(pageStr)).catch(() => []),
      fetchFromJSearch(q, countryCode.toUpperCase(), Number(pageStr)).catch(() => []),
    ]);

    const combined: NormalizedJob[] = [...adzunaJobs, ...jsearchJobs];

    const upsertPromises = combined.map(async (job) => {
      if (!job || !job.sourceId) return null;
      try {
        const existing = await prisma.job.findFirst({ where: { source: job.source, sourceId: job.sourceId } });
        if (existing) {
          return prisma.job.update({
            where: { id: existing.id },
            data: {
              title: job.title,
              company: job.company,
              location: job.location,
              description: job.description,
              applyUrl: job.applyUrl,
              postedAt: job.postedAt ? new Date(job.postedAt) : existing.postedAt,
              salary: job.salary,
              rawJson: job.raw,
            },
          });
        } else {
          return prisma.job.create({
            data: {
              source: job.source,
              sourceId: job.sourceId,
              title: job.title,
              company: job.company,
              location: job.location,
              country: job.country?.slice(0, 2) || 'US',
              description: job.description || '',
              applyUrl: job.applyUrl || null,
              postedAt: job.postedAt ? new Date(job.postedAt) : null,
              salary: job.salary || null,
              rawJson: job.raw,
            },
          });
        }
      } catch {
        return null;
      }
    });

    const results = await Promise.all(upsertPromises);
    const saved = results.filter(Boolean) as any[];

    const serialized = saved.map((s) => ({
      id: s.id,
      title: s.title,
      company: s.company,
      location: s.location,
      country: s.country,
      postedAt: s.postedAt,
      description: s.description,
      applyUrl: s.applyUrl,
      source: s.source,
    }));

    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000, data: serialized });

    res.status(200).json({ source: 'aggregator', count: serialized.length, jobs: serialized });
  } catch (error: any) {
    console.error('Aggregate error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'failed' });
  }
}
