import { NextRequest, NextResponse } from 'next/server';

// Reuse the in-memory store defined in parent route by importing that module.
// (Node module cache ensures singleton). If not loaded yet, fallback to local array.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rootModule = require('../route.ts');
const jobsStore = rootModule?.jobsStore || [];

export async function GET(_request: NextRequest, { params }: { params: { jobId: string } }) {
  const job = jobsStore.find((j: any) => j.id === params.jobId);
  if (!job) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, job });
}

export async function PUT(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const updates = await request.json();
    const job = jobsStore.find((j: any) => j.id === params.jobId);
    if (!job) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    Object.assign(job, updates, { updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true, job });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { jobId: string } }) {
  const idx = jobsStore.findIndex((j: any) => j.id === params.jobId);
  if (idx === -1) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  const [removed] = jobsStore.splice(idx, 1);
  return NextResponse.json({ success: true, removed });
}

export const dynamic = 'force-dynamic';