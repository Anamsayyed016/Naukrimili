import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { q = '', country, page = '1', per_page = '20' } = req.query;
    const pageNum = Math.max(1, Number(page));
    const perPage = Math.min(100, Number(per_page) || 20);

    const where: any = {};
    if (String(q).trim()) {
      const s = String(q);
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { company: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }
    if (country) where.country = String(country).toUpperCase();

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
