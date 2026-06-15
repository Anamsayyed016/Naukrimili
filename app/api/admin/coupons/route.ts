/**
 * GET /api/admin/coupons — list
 * POST /api/admin/coupons — create
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import {
  normalizeCouponCode,
} from '@/lib/services/coupon-service';
import { ALL_PLAN_KEYS } from '@/lib/services/razorpay-plans';

const couponSchema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(1).max(120),
  notes: z.string().optional().nullable(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().int().positive(),
  maxDiscountAmount: z.number().int().positive().optional().nullable(),
  minOrderAmount: z.number().int().min(0).optional().nullable(),
  applicablePlanKeys: z.array(z.string()).min(1),
  maxRedemptions: z.number().int().positive().optional().nullable(),
  maxRedemptionsPerUser: z.number().int().min(1).default(1),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  isActive: z.boolean().default(true),
});

function getCouponStatus(coupon: {
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
}): 'active' | 'expired' | 'scheduled' | 'inactive' {
  const now = new Date();
  if (!coupon.isActive) return 'inactive';
  if (now > coupon.validUntil) return 'expired';
  if (now < coupon.validFrom) return 'scheduled';
  return 'active';
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'newest';

    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { code: { contains: search.toUpperCase(), mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      where.isActive = true;
      where.validFrom = { lte: now };
      where.validUntil = { gte: now };
    } else if (status === 'expired') {
      where.validUntil = { lt: now };
    } else if (status === 'scheduled') {
      where.validFrom = { gt: now };
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (sort === 'expiry') orderBy = { validUntil: 'asc' };
    else if (sort === 'usage') orderBy = { redemptionCount: 'desc' };
    else if (sort === 'code') orderBy = { code: 'asc' };

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.coupon.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        coupons: coupons.map((c) => ({
          ...c,
          status: getCouponStatus(c),
          usagePercent:
            c.maxRedemptions != null && c.maxRedemptions > 0
              ? Math.round((c.redemptionCount / c.maxRedemptions) * 100)
              : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list coupons';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = couponSchema.parse(body);

    const code = normalizeCouponCode(parsed.code);
    const validKeys = parsed.applicablePlanKeys.filter((k) =>
      (ALL_PLAN_KEYS as string[]).includes(k)
    );
    if (validKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Select at least one valid plan' },
        { status: 400 }
      );
    }

    if (parsed.discountType === 'percentage' && parsed.discountValue > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentage cannot exceed 100' },
        { status: 400 }
      );
    }

    const validFrom = new Date(parsed.validFrom);
    const validUntil = new Date(parsed.validUntil);
    if (validUntil <= validFrom) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Coupon code already exists' },
        { status: 409 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        name: parsed.name,
        notes: parsed.notes ?? null,
        discountType: parsed.discountType,
        discountValue: parsed.discountValue,
        maxDiscountAmount: parsed.maxDiscountAmount ?? null,
        minOrderAmount: parsed.minOrderAmount ?? null,
        applicablePlanKeys: validKeys,
        maxRedemptions: parsed.maxRedemptions ?? null,
        maxRedemptionsPerUser: parsed.maxRedemptionsPerUser,
        validFrom,
        validUntil,
        isActive: parsed.isActive,
        createdBy: auth.user.id,
      },
    });

    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to create coupon';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
