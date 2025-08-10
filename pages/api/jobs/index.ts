import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Query validation schema
const querySchema = z.object({
  q: z.string().trim().max(200).optional().default(''),
  country: z.string().length(2).optional(),
  page: z.string().regex(/^\d+$/).optional().default('1'),
  per_page: z.string().regex(/^\d+$/).optional().default('20'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const parseResult = querySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid query', details: parseResult.error.flatten() });
    }
    const { q, country, page, per_page } = parseResult.data;
    const pageNum = Math.max(1, Number(page));
    const perPage = Math.min(100, Math.max(1, Number(per_page)));

    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (country) where.country = country.toUpperCase();

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { postedAt: 'desc' },
        skip: (pageNum - 1) * perPage,
        take: perPage,
      }),
    ]);

    res.status(200).json({ total, page: pageNum, perPage, jobs });
  } catch (error: any) {
    console.error('jobs/index error', error);
    res.status(500).json({ error: error?.message || 'failed' });
  }
}
