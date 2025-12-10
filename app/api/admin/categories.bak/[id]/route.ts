import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/admin/categories/[id]
 * Update a category (toggle status, update name/description)
 */
export async function PATCH(
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
    const { isActive, name, description } = body;

    const updateData: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (name) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // If updating name, check for duplicates
    if (name && name !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name: name.trim() }
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Category with this name already exists' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData
    });

    // Get job count
    const jobCount = await prisma.job.count({
      where: {
        sector: category.name,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        description: category.description || '',
        jobCount,
        isActive: category.isActive,
        createdAt: category.createdAt.toISOString()
      }
    });
  } catch (_error) {
    console.error('Error updating category:', _error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Delete a category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category is used in any jobs
    const jobCount = await prisma.job.count({
      where: {
        sector: existing.name
      }
    });

    if (jobCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete category. It is used by ${jobCount} job(s). Please update or remove those jobs first.` 
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (_error) {
    console.error('Error deleting category:', _error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
