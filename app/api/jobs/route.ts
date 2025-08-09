import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// Temporary in-memory store (replace with real DB via prisma.job later)
type Job = {
  id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  sector?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
};

const jobsStore: Job[] = [];

function listJobs(query: URLSearchParams) {
  let results = [...jobsStore];
  const q = query.get('q');
  if (q) {
    const lc = q.toLowerCase();
    results = results.filter(j => j.title.toLowerCase().includes(lc) || j.company.toLowerCase().includes(lc));
  }
  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const data = listJobs(searchParams);
  return NextResponse.json({ success: true, count: data.length, jobs: data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.company) {
      return NextResponse.json({ success: false, error: 'title and company required' }, { status: 400 });
    }
    const now = new Date().toISOString();
    const job: Job = {
      id: randomUUID(),
      title: body.title,
      company: body.company,
      location: body.location ?? null,
      description: body.description ?? '',
      sector: body.sector ?? null,
      salaryMin: body.salaryMin ?? null,
      salaryMax: body.salaryMax ?? null,
      currency: body.currency ?? 'USD',
      createdAt: now,
      updatedAt: now,
    } as Job;
    jobsStore.push(job);
    return NextResponse.json({ success: true, job });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}

export const dynamic = 'force-dynamic';