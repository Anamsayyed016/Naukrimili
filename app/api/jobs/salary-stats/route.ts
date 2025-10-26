import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch salary data directly from database
    const jobs = await prisma.job.findMany({
      select: { salaryMin: true, salaryMax: true },
      where: { 
        isActive: true,
        salaryMin: { not: null },
        salaryMax: { not: null }
      }
    });
    
    const salaries = jobs
      .filter(j => typeof j.salaryMin === 'number' && typeof j.salaryMax === 'number')
      .map(j => ({ min: j.salaryMin!, max: j.salaryMax! }));

    const count = salaries.length;
    let min = null, max = null, avg = null;
    if (count) {
      min = Math.min(...salaries.map(s => s.min));
      max = Math.max(...salaries.map(s => s.max));
      avg = Math.round((salaries.reduce((acc, s) => acc + ((s.min + s.max) / 2), 0) / count));
    }
    return NextResponse.json({ success: true, count, min, max, avg });
  } catch (_error) {
    console.error('Error in salary-stats route:', error);
    return NextResponse.json({ success: false, count: 0 }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';