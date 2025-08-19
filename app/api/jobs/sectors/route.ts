import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const rootModule = require('../route.ts');
const jobsStore = rootModule?.jobsStore || [];

export async function GET() {
  const sectors = Array.from(new Set(jobsStore.map((j: any) => j.sector).filter(Boolean)));
  return NextResponse.json({ success: true, count: sectors.length, sectors });
}

export const dynamic = 'force-dynamic';
