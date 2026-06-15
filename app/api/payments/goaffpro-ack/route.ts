/**
 * POST /api/payments/goaffpro-ack
 * Idempotent server-side marker after client fires GoAffPro conversion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { isGoAffProReported, logGoAffPro, parsePaymentGoAffProMetadata } from '@/lib/goaffpro-conversion';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : '';

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'captured') {
      return NextResponse.json({ error: 'Payment not captured' }, { status: 400 });
    }

    const metadata = parsePaymentGoAffProMetadata(payment.metadata);
    if (isGoAffProReported(metadata)) {
      logGoAffPro('conversion skipped', { reason: 'duplicate', paymentId });
      return NextResponse.json({ success: true, alreadyReported: true });
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        metadata: {
          ...metadata,
          goaffproReported: true,
          goaffproReportedAt: new Date().toISOString(),
        },
      },
    });

    logGoAffPro('conversion success', { paymentId, orderNumber: payment.razorpayPaymentId });
    return NextResponse.json({ success: true, alreadyReported: false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ack failed';
    logGoAffPro('conversion failed', { stage: 'ack', error: message });
    return NextResponse.json({ error: 'Failed to record conversion ack' }, { status: 500 });
  }
}
