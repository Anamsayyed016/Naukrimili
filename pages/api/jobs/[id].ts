import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'missing id' });

    const job = await prisma.job.findUnique({ where: { id: Number(id) } });
    if (!job) return res.status(404).json({ error: 'not found' });

    res.status(200).json(job);
  } catch (error: any) {
    console.error('jobs/[id] error', error);
    res.status(500).json({ error: error?.message || 'failed' });
  }
}
