import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/categories
 * Get all categories with job counts
 */
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            jobs: true
          }
        }
      }
    });

    // Get job counts for each category (categories are stored in Job.sector field)
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const jobCount = await prisma.job.count({
          where: {
            sector: category.name,
            isActive: true
          }
        });

        return {
          id: category.id,
          name: category.name,
          description: category.description || '',
          jobCount,
          isActive: category.isActive,
          createdAt: category.createdAt.toISOString()
        };
      })
    );

    return NextResponse.json({
      success: true,
      categories: categoriesWithCounts
    });
  } catch (_error) {
    console.error('Error fetching categories:', _error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        description: category.description || '',
        jobCount: 0,
        isActive: category.isActive,
        createdAt: category.createdAt.toISOString()
      }
    });
  } catch (_error) {
    console.error('Error creating category:', _error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
