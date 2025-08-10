import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { fetchFromAdzuna, fetchFromJSearch } from '@/lib/jobs/providers';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = (req.headers['x-import-api-key'] as string) || (req.body?.importApiKey as string | undefined);
  if (!key || key !== process.env.IMPORT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { queries = ['software developer'], country = 'IN', page = 1 } = req.body || {};

    const allJobs: any[] = [];
    for (const q of queries) {
      const [adz, jsearch] = await Promise.all([
        fetchFromAdzuna(q, country, page).catch(() => []),
        fetchFromJSearch(q, country, page).catch(() => []),
      ]);
      allJobs.push(...adz, ...jsearch);
    }

    const upsertPromises = allJobs.map(async (job) => {
      if (!job?.sourceId) return null;
      try {
        // Composite unique (source, sourceId)
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
        }
        return prisma.job.create({
          data: {
            source: job.source,
            sourceId: job.sourceId,
            title: job.title,
            company: job.company,
            location: job.location,
            country: job.country?.slice(0, 2).toUpperCase() || 'US',
            description: job.description || '',
            applyUrl: job.applyUrl || null,
            postedAt: job.postedAt ? new Date(job.postedAt) : null,
            salary: job.salary || null,
            rawJson: job.raw,
          },
        });
      } catch {
        return null;
      }
    });

    const results = await Promise.all(upsertPromises);
    res.status(200).json({ imported: results.filter(Boolean).length });
  } catch (error: any) {
    console.error('import error', error);
    res.status(500).json({ error: error?.message || 'failed' });
  }
}
