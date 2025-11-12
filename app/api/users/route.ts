import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const userActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete', 'changeRole']),
  userIds: z.array(z.string()),
  reason: z.string().optional(),
  newRole: z.string().optional()
});

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (role && role !== 'all') {
      where.role = role;
    }
    
    if (status && status !== 'all') {
      switch (status) {
        case 'active':
          where.isActive = true;
          break;
        case 'inactive':
          where.isActive = false;
          break;
      }
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get users with pagination and related data
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          phone: true,
          location: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              applications: true,
              createdJobs: true,
              createdCompanies: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Transform users to include combined name field
    const usersWithName = users.map(user => ({
      ...user,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName || user.lastName || user.email.split('@')[0] || 'No Name'
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithName,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (_error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { action, userIds, reason, newRole } = userActionSchema.parse(body);

    if (!userIds || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No user IDs provided' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        message = 'Users activated successfully';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        message = 'Users deactivated successfully';
        break;
      case 'changeRole':
        if (!newRole) {
          return NextResponse.json(
            { success: false, error: 'New role is required for role change' },
            { status: 400 }
          );
        }
        updateData = { role: newRole };
        message = 'User roles updated successfully';
        break;
      case 'delete':
        // Delete users
        await prisma.user.deleteMany({
          where: { id: { in: userIds } }
        });
        return NextResponse.json({
          success: true,
          message: 'Users deleted successfully'
        });
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update users
    const updatedUsers = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message,
      data: {
        updatedCount: updatedUsers.count
      }
    });
  } catch (_error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform user action' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}