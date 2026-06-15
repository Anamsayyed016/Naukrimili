/**
 * GET /api/admin/coupons/stats
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const auth = await requireAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalRedemptions,
      discountAgg,
      recentRedemptions,
      topCoupon,
    ] = await Promise.all([
      prisma.coupon.count(),
      prisma.coupon.count({
        where: {
          isActive: true,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
      }),
      prisma.coupon.count({
        where: { validUntil: { lt: now } },
      }),
      prisma.couponRedemption.count(),
      prisma.couponRedemption.aggregate({
        _sum: { discountAmount: true },
      }),
      prisma.couponRedemption.count({
        where: { redeemedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.couponRedemption.groupBy({
        by: ['couponId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
    ]);

    let topPerforming: { code: string; name: string; redemptions: number } | null = null;
    if (topCoupon.length > 0) {
      const coupon = await prisma.coupon.findUnique({
        where: { id: topCoupon[0].couponId },
        select: { code: true, name: true },
      });
      if (coupon) {
        topPerforming = {
          code: coupon.code,
          name: coupon.name,
          redemptions: topCoupon[0]._count.id,
        };
      }
    }

    const couponsCreatedRecently = await prisma.coupon.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        totalRedemptions,
        totalDiscountPaise: discountAgg._sum.discountAmount ?? 0,
        totalDiscountRupees: (discountAgg._sum.discountAmount ?? 0) / 100,
        redemptionsLast30Days: recentRedemptions,
        couponsCreatedLast30Days: couponsCreatedRecently,
        topPerforming,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    console.error('❌ [Admin Coupon Stats]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
