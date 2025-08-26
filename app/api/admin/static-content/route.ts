import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const contentSchema = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .regex(/^[a-z0-9_-]+$/, 'Key must contain only lowercase letters, numbers, underscores, and hyphens'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  isActive: z.boolean().optional().default(true)
});

const updateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  isActive: z.boolean().optional()
});

// Get all static content or specific content by key - GET /api/admin/static-content
export async function GET(request: NextRequest) {
  // Require admin authentication
  const auth = await requireAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (key) {
      // Get specific content by key
      const content = await prisma.staticContent.findUnique({
        where: { key: key.toLowerCase() }
      });

      if (!content) {
        return NextResponse.json({
          success: false,
          error: 'Content not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: content
      });
    } else {
      // Get all content
      const whereClause = includeInactive ? {} : { isActive: true };
      
      const allContent = await prisma.staticContent.findMany({
        where: whereClause,
        orderBy: [
          { isActive: 'desc' },
          { key: 'asc' }
        ]
      });

      return NextResponse.json({
        success: true,
        data: {
          content: allContent,
          total: allContent.length,
          active: allContent.filter(c => c.isActive).length,
          inactive: allContent.filter(c => !c.isActive).length
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Static content GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch static content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Create new static content - POST /api/admin/static-content
export async function POST(request: NextRequest) {
  // Require admin authentication
  const auth = await requireAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { key, title, content, isActive } = contentSchema.parse(body);

    // Check if content with this key already exists
    const existingContent = await prisma.staticContent.findUnique({
      where: { key: key.toLowerCase() }
    });

    if (existingContent) {
      return NextResponse.json({
        success: false,
        error: 'Content with this key already exists'
      }, { status: 409 });
    }

    // Create new static content
    const newContent = await prisma.staticContent.create({
      data: {
        key: key.toLowerCase(),
        title,
        content,
        isActive: isActive ?? true
      }
    });

    return NextResponse.json({
      success: true,
      data: newContent,
      message: 'Static content created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Static content POST error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create static content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Update existing static content - PUT /api/admin/static-content
export async function PUT(request: NextRequest) {
  // Require admin authentication
  const auth = await requireAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'Content key is required in query parameters'
      }, { status: 400 });
    }

    const body = await request.json();
    const updateData = updateContentSchema.parse(body);

    // Check if content exists
    const existingContent = await prisma.staticContent.findUnique({
      where: { key: key.toLowerCase() }
    });

    if (!existingContent) {
      return NextResponse.json({
        success: false,
        error: 'Content not found'
      }, { status: 404 });
    }

    // Update content
    const updatedContent = await prisma.staticContent.update({
      where: { key: key.toLowerCase() },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedContent,
      message: 'Static content updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Static content PUT error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update static content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Delete static content - DELETE /api/admin/static-content
export async function DELETE(request: NextRequest) {
  // Require admin authentication
  const auth = await requireAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'Content key is required in query parameters'
      }, { status: 400 });
    }

    // Check if content exists
    const existingContent = await prisma.staticContent.findUnique({
      where: { key: key.toLowerCase() }
    });

    if (!existingContent) {
      return NextResponse.json({
        success: false,
        error: 'Content not found'
      }, { status: 404 });
    }

    // Delete content
    await prisma.staticContent.delete({
      where: { key: key.toLowerCase() }
    });

    return NextResponse.json({
      success: true,
      message: 'Static content deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Static content DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete static content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
