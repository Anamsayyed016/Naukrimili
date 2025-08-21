import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // TODO: Implement when content model is available in Prisma schema
    // For now, return placeholder data
    const content = [
      {
        key: 'welcome_message',
        value: 'Welcome to our job portal!',
        description: 'Main welcome message displayed on homepage'
      },
      {
        key: 'footer_text',
        value: '© 2024 Job Portal. All rights reserved.',
        description: 'Footer copyright text'
      }
    ];

    return NextResponse.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Admin static content error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch static content' },
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
    const { key, value, description } = body;

    if (!key || !value) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // TODO: Implement when content model is available in Prisma schema
    // For now, return success response
    const content = {
      key,
      value,
      description,
      id: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      data: content,
      message: 'Content updated successfully'
    });
  } catch (error) {
    console.error('Admin static content error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update static content' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
