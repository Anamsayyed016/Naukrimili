import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const importBodySchema = z.object({
  queries: z.array(z.string().min(2)).min(1).max(5).default(['software developer']),
  country: z.string().length(2).default('IN'),
  page: z.number().int().positive().max(50).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = importBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { queries, country, page } = parsed.data;

    // Simulate import success with mock count
    const importedCount = queries.length * 25; // pretend each query fetched 25 jobs

    return NextResponse.json({ success: true, imported: importedCount, country, page, queries });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
