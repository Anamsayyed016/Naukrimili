import { NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

/**
 * Read-only payment / coupon history for the authenticated user.
 * Does not create orders, verify payments, or alter premium logic.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const [payments, couponRedemptions] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          planType: true,
          planName: true,
          amount: true,
          originalAmount: true,
          discountAmount: true,
          currency: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
          couponId: true,
        },
      }),
      prisma.couponRedemption.findMany({
        where: { userId },
        orderBy: { redeemedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          redeemedAt: true,
          planKey: true,
          originalAmount: true,
          discountAmount: true,
          finalAmount: true,
          coupon: {
            select: {
              code: true,
              name: true,
              discountType: true,
              discountValue: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      payments: payments.map((payment) => ({
        ...payment,
        amountRupees: payment.amount / 100,
        originalAmountRupees:
          payment.originalAmount != null ? payment.originalAmount / 100 : null,
        discountAmountRupees: payment.discountAmount / 100,
      })),
      couponHistory: couponRedemptions.map((row) => ({
        id: row.id,
        redeemedAt: row.redeemedAt,
        planKey: row.planKey,
        originalAmountRupees: row.originalAmount / 100,
        discountAmountRupees: row.discountAmount / 100,
        finalAmountRupees: row.finalAmount / 100,
        code: row.coupon?.code ?? null,
        name: row.coupon?.name ?? null,
        discountType: row.coupon?.discountType ?? null,
        discountValue: row.coupon?.discountValue ?? null,
      })),
    });
  } catch (error) {
    console.error('[payments/history] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load payment history' },
      { status: 500 }
    );
  }
}
