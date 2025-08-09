// Root-level health probe: GET /health
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', ts: Date.now(), path: '/health' });
}

export const dynamic = 'force-static';
