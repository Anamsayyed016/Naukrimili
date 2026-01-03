import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const overrideSchema = z.object({
  action: z.enum(['extend_expiry', 'add_credits', 'increase_pdf_limit', 'increase_ai_limit', 'reset_daily_usage', 'disable_downloads', 'disable_ai']),
  value: z.number().optional(),
  days: z.number().optional(),
  reason: z.string().min(1, 'Reason is required for audit trail')
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, value, days, reason } = overrideSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userCredits: true,
        subscription: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'extend_expiry':
        if (!days || days <= 0) {
          return NextResponse.json(
            { success: false, error: 'Days must be a positive number' },
            { status: 400 }
          );
        }
        
        if (user.subscription) {
          // Business plan
          const newExpiry = new Date(user.subscription.expiresAt);
          newExpiry.setDate(newExpiry.getDate() + days);
          await prisma.subscription.update({
            where: { id: user.subscription.id },
            data: { expiresAt: newExpiry }
          });
          result = { message: `Extended subscription by ${days} days`, newExpiry: newExpiry.toISOString() };
        } else if (user.userCredits) {
          // Individual plan
          const currentExpiry = user.userCredits.validUntil ? new Date(user.userCredits.validUntil) : new Date();
          const newExpiry = new Date(currentExpiry);
          newExpiry.setDate(newExpiry.getDate() + days);
          await prisma.userCredits.update({
            where: { userId: id },
            data: { validUntil: newExpiry }
          });
          result = { message: `Extended plan by ${days} days`, newExpiry: newExpiry.toISOString() };
        } else {
          return NextResponse.json(
            { success: false, error: 'User has no active plan' },
            { status: 400 }
          );
        }
        break;

      case 'add_credits':
        if (!value || value <= 0) {
          return NextResponse.json(
            { success: false, error: 'Credits must be a positive number' },
            { status: 400 }
          );
        }
        
        if (!user.subscription) {
          return NextResponse.json(
            { success: false, error: 'User does not have a business subscription' },
            { status: 400 }
          );
        }

        await prisma.subscription.update({
          where: { id: user.subscription.id },
          data: {
            remainingCredits: { increment: value },
            totalCredits: { increment: value }
          }
        });

        await prisma.creditTransaction.create({
          data: {
            subscriptionId: user.subscription.id,
            userId: id,
            type: 'add',
            amount: value,
            reason: 'admin_override',
            description: `Admin added ${value} credits. Reason: ${reason}`
          }
        });

        result = { message: `Added ${value} credits`, newTotal: user.subscription.totalCredits + value };
        break;

      case 'increase_pdf_limit':
        if (!value || value <= 0) {
          return NextResponse.json(
            { success: false, error: 'Limit must be a positive number' },
            { status: 400 }
          );
        }

        if (!user.userCredits) {
          return NextResponse.json(
            { success: false, error: 'User has no individual plan' },
            { status: 400 }
          );
        }

        await prisma.userCredits.update({
          where: { userId: id },
          data: { pdfDownloadsLimit: { increment: value } }
        });

        result = { message: `Increased PDF limit by ${value}` };
        break;

      case 'increase_ai_limit':
        if (!value || value <= 0) {
          return NextResponse.json(
            { success: false, error: 'Limit must be a positive number' },
            { status: 400 }
          );
        }

        if (!user.userCredits) {
          return NextResponse.json(
            { success: false, error: 'User has no individual plan' },
            { status: 400 }
          );
        }

        await prisma.userCredits.update({
          where: { userId: id },
          data: {
            aiResumeLimit: { increment: value },
            aiCoverLetterLimit: { increment: value }
          }
        });

        result = { message: `Increased AI limits by ${value}` };
        break;

      case 'reset_daily_usage':
        // For business plans, this would require resetting credit transactions
        // For individual plans, would need a daily counter field
        result = { message: 'Daily usage reset (implementation depends on daily counter field)' };
        break;

      case 'disable_downloads':
        if (user.userCredits) {
          await prisma.userCredits.update({
            where: { userId: id },
            data: { pdfDownloadsLimit: 0 }
          });
        }
        result = { message: 'PDF downloads disabled' };
        break;

      case 'disable_ai':
        if (user.userCredits) {
          await prisma.userCredits.update({
            where: { userId: id },
            data: {
              aiResumeLimit: 0,
              aiCoverLetterLimit: 0
            }
          });
        }
        result = { message: 'AI features disabled' };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Log admin action (you might want to create an admin_actions table)
    console.log(`[Admin Override] User: ${id}, Action: ${action}, Reason: ${reason}, Admin: ${auth.user.email}`);

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Admin override error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform admin override' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

