/**
 * GET/PATCH/DELETE /api/admin/coupons/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { ALL_PLAN_KEYS } from '@/lib/services/razorpay-plans';

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  notes: z.string().optional().nullable(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().int().positive().optional(),
  maxDiscountAmount: z.number().int().positive().optional().nullable(),
  minOrderAmount: z.number().int().min(0).optional().nullable(),
  applicablePlanKeys: z.array(z.string()).min(1).optional(),
  maxRedemptions: z.number().int().positive().optional().nullable(),
  maxRedemptionsPerUser: z.number().int().min(1).optional(),
  validFrom: z.string().min(1).optional(),
  validUntil: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        redemptions: {
          take: 20,
          orderBy: { redeemedAt: 'desc' },
          select: {
            id: true,
            userId: true,
            planKey: true,
            finalAmount: true,
            discountAmount: true,
            redeemedAt: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: coupon });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch coupon';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = { ...parsed };
    if (parsed.applicablePlanKeys) {
      const validKeys = parsed.applicablePlanKeys.filter((k) =>
        (ALL_PLAN_KEYS as string[]).includes(k)
      );
      if (validKeys.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Select at least one valid plan' },
          { status: 400 }
        );
      }
      data.applicablePlanKeys = validKeys;
    }
    if (parsed.validFrom) {
      const validFrom = new Date(parsed.validFrom);
      if (Number.isNaN(validFrom.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Valid From must be a valid date' },
          { status: 400 }
        );
      }
      data.validFrom = validFrom;
    }
    if (parsed.validUntil) {
      const validUntil = new Date(parsed.validUntil);
      if (Number.isNaN(validUntil.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Valid Until must be a valid date' },
          { status: 400 }
        );
      }
      data.validUntil = validUntil;
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: coupon });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to update coupon';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth();
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete coupon';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
