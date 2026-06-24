import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { syncMiniStarterEditEntitlement } from '@/lib/services/payment-service';

/**
 * POST /api/resume-builder/sync-edit-entitlement
 * Records Mini Starter post-download edit when editor changes live in localStorage only.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const formData = body?.formData;
    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ error: 'formData is required' }, { status: 400 });
    }

    const result = await syncMiniStarterEditEntitlement(session.user.id, formData);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sync edit entitlement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
