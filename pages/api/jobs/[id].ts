import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { id } = req.query;
    const idNum = Number(id);
    if (!id || !/^\d+$/.test(String(id)) || idNum <= 0) return res.status(400).json({ error: 'invalid id' });

    const job = await prisma.job.findUnique({ where: { id: idNum } });
    if (!job) return res.status(404).json({ error: 'not found' });

    res.status(200).json(job);
  } catch (error: any) {
    console.error('jobs/[id] error', error);
    res.status(500).json({ error: error?.message || 'failed' });
  }
}
