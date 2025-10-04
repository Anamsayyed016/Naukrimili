import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch sectors directly from database
    const jobs = await prisma.job.findMany({
      select: { sector: true },
      where: { isActive: true }
    });
    
    const sectors = Array.from(new Set(jobs.map(j => j.sector).filter(Boolean)));
    return NextResponse.json({ success: true, count: sectors.length, sectors });
  } catch (error) {
    console.error('Error in sectors route:', error);
    return NextResponse.json({ success: false, sectors: [] }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
