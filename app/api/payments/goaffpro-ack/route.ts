/**
 * POST /api/payments/goaffpro-ack
 * Idempotent server-side marker after client fires GoAffPro conversion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { isGoAffProReported, logGoAffPro } from '@/lib/goaffpro-conversion';
import { reportGoAffProSaleForPayment } from '@/lib/goaffpro-server';

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

    if (isGoAffProReported(payment.metadata)) {
      logGoAffPro('conversion skipped', { reason: 'duplicate', paymentId });
      return NextResponse.json({ success: true, alreadyReported: true });
    }

    const orderNumber =
      payment.razorpayPaymentId ||
      (typeof payment.metadata === 'object' &&
      payment.metadata &&
      !Array.isArray(payment.metadata) &&
      typeof (payment.metadata as Record<string, unknown>).goaffproOrderNumber === 'string'
        ? String((payment.metadata as Record<string, unknown>).goaffproOrderNumber)
        : null);

    if (orderNumber) {
      const serverResult = await reportGoAffProSaleForPayment(paymentId, orderNumber);
      if (serverResult.reported || serverResult.alreadyReported) {
        return NextResponse.json({
          success: true,
          alreadyReported: serverResult.alreadyReported,
          reportedBy: 'server',
        });
      }
    }

    const existingMeta =
      payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
        ? (payment.metadata as Record<string, unknown>)
        : {};

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        metadata: {
          ...existingMeta,
          goaffproReported: true,
          goaffproReportedAt: new Date().toISOString(),
          goaffproReportMethod: 'client',
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
