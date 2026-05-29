import { NextRequest, NextResponse } from 'next/server';
import { dailyScheduler } from '@/lib/jobs/daily-scheduler';
import { SYNC_REGION_PRIORITY, type SyncRegion } from '@/lib/jobs/region-sync-config';

function parseRegions(body: unknown): SyncRegion[] | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const regions = (body as { regions?: unknown }).regions;
  if (!Array.isArray(regions)) return undefined;
  const valid = regions
    .map((r) => String(r).toUpperCase())
    .filter((r): r is SyncRegion =>
      (SYNC_REGION_PRIORITY as string[]).includes(r)
    );
  return valid.length ? valid : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ADMIN_SYNC_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const regions = parseRegions(body);

    const result = await dailyScheduler.runDailySync(regions);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Job sync completed successfully',
        regions: regions || SYNC_REGION_PRIORITY,
        stats: result.stats,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Job sync failed',
        stats: result.stats,
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Job sync API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = await dailyScheduler.getStats();
    return NextResponse.json({
      success: true,
      stats,
      regions: SYNC_REGION_PRIORITY,
      scheduleHint: {
        IN: 'every 6 hours',
        US: 'every 6 hours',
        GB: 'every 12 hours',
        AE: 'every 12 hours',
        full: 'daily via POST without regions filter',
      },
    });
  } catch (error) {
    console.error('Job stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch job statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
