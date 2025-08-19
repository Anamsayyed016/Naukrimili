import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const rootModule = require('../route.ts');
const jobsStore = rootModule?.jobsStore || [];

export async function GET() {
  const salaries = jobsStore
    .filter((j: any) => typeof j.salaryMin === 'number' && typeof j.salaryMax === 'number')
    .map((j: any) => ({ min: j.salaryMin, max: j.salaryMax }));

  const count = salaries.length;
  let min = null, max = null, avg = null;
  if (count) {
    min = Math.min(...salaries.map(s => s.min));
    max = Math.max(...salaries.map(s => s.max));
    avg = Math.round((salaries.reduce((acc, s) => acc + ((s.min + s.max) / 2), 0) / count));
  }
  return NextResponse.json({ success: true, count, min, max, avg });
}

export const dynamic = 'force-dynamic';
