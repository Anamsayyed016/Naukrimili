import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, fetchFromJooble } from '@/lib/jobs/providers';

type ProviderJob = {
  id?: string;
  source?: string;
  sourceId?: string;
  title?: string;
  company?: string;
  location?: string;
  country?: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  postedAt?: string;
  applyUrl?: string;
  redirect_url?: string;
};

function toDateSafe(d?: string) {
  if (!d) return undefined;
  const x = new Date(d);
  return isFinite(x.getTime()) ? x : undefined;
}

function normalizeCountry(c?: string) {
  return (c || '').toUpperCase();
}

function normalize(job: ProviderJob) {
  const postedAt = toDateSafe(job.postedAt);
  return {
    title: job.title || 'Job',
    company: job.company || 'Company',
    location: job.location || '',
    country: normalizeCountry(job.country),
    description: job.description || '',
    // Prisma schema requires a String; store JSON string of skills array
    skills: JSON.stringify(job.skills || []),
    jobType: (job.jobType || '').toLowerCase(),
    experienceLevel: (job.experienceLevel || '').toLowerCase(),
    salaryMin: job.salaryMin || null,
    salaryMax: job.salaryMax || null,
    salaryCurrency: job.salaryCurrency || null,
    postedAt: postedAt || new Date(),
    source: (job.source || 'external').toLowerCase(),
    sourceId: job.sourceId || job.id || '',
    applyUrl: job.applyUrl || job.redirect_url || null,
    isActive: true,
    isExternal: true,
  };
}

async function upsertBatch(rows: ReturnType<typeof normalize>[]) {
  if (!rows.length) return { upserted: 0 };
  let upserted = 0;
  // Upsert serially in safe chunks to respect DB constraints
  for (const r of rows) {
    if (!r.sourceId) continue;
    await prisma.job.upsert({
      where: { source_sourceId: { source: r.source, sourceId: r.sourceId } as any },
      update: {
        title: r.title,
        company: r.company,
        location: r.location,
        country: r.country,
        description: r.description,
        jobType: r.jobType,
        experienceLevel: r.experienceLevel,
        salaryMin: r.salaryMin as any,
        salaryMax: r.salaryMax as any,
        salaryCurrency: r.salaryCurrency as any,
        postedAt: r.postedAt,
        applyUrl: r.applyUrl as any,
        isActive: true,
        isExternal: true,
      },
      create: {
        ...r,
      },
    });
    upserted++;
  }
  return { upserted };
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countriesParam = searchParams.get('countries') || 'US,IN,GB,AE';
    const pages = Math.min(60, Math.max(1, parseInt(searchParams.get('pages') || '25')));
    const limitPerPage = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') || '50')));
    const days = Math.min(180, Math.max(1, parseInt(searchParams.get('days') || '30')));
    const query = searchParams.get('query') || 'software engineer';

    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const countries = countriesParam.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

    let fetched = 0;
    let upserted = 0;
    const errors: string[] = [];

    for (const country of countries) {
      for (let page = 1; page <= pages; page++) {
        // Fetch from providers (best effort)
        const jobs: ProviderJob[] = [];
        try {
          const adzCountry = country.toLowerCase();
          const [adz, js, gg, jb] = await Promise.all([
            fetchFromAdzuna(query, adzCountry, page, { distanceKm: 50 }).catch(() => []),
            fetchFromJSearch(query, country, page).catch(() => []),
            fetchFromGoogleJobs(query, country === 'US' ? 'United States' : country === 'GB' ? 'United Kingdom' : country, page).catch(() => []),
            fetchFromJooble(query, country, page, { radius: 50, countryCode: country }).catch(() => []),
          ]);
          jobs.push(...adz, ...js, ...gg, ...jb);
        } catch (e: any) {
          errors.push(`fetch ${country} p${page}: ${e?.message || e}`);
        }

        fetched += jobs.length;
        // Normalize, filter by country & recency, and dedupe
        const seen = new Set<string>();
        const normalized = jobs
          .map(j => normalize({ ...j, country }))
          .filter(j => normalizeCountry(j.country) === country)
          .filter(j => (j.postedAt?.getTime() || 0) >= cutoff)
          .filter(j => {
            const key = `${j.source}|${j.sourceId}`;
            if (!j.sourceId || seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        const res = await upsertBatch(normalized);
        upserted += res.upserted;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bulk import completed',
      metrics: { fetched, upserted, countries, pages, limitPerPage, days },
      errors,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Import failed' }, { status: 500 });
  }
}


