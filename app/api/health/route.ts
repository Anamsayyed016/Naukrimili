// Health + echo endpoint at /api/health
import { NextRequest, NextResponse } from 'next/server';
import { verifyDatabaseConnection } from '@/lib/prisma';

export const dynamic = 'force-static'; // Keep fast unless you need runtime info

export async function GET() {
  const db = await verifyDatabaseConnection();
  return NextResponse.json({ status: 'ok', ts: Date.now(), path: '/api/health', db });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ status: 'ok', received: body, ts: Date.now() });
  } catch (err) {
    return NextResponse.json({ status: 'error', error: 'Invalid JSON' }, { status: 400 });
  }
}