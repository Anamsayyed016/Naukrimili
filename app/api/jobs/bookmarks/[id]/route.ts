import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/nextauth-config';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { id: bookmarkId } = params;

    // Check if bookmark exists and belongs to user
    const bookmark = await prisma.jobBookmark.findFirst({
      where: {
        id: bookmarkId,
        userId: session.user.id
      }
    });

    if (!bookmark) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bookmark not found' 
      }, { status: 404 });
    }

    // Delete bookmark
    await prisma.jobBookmark.delete({
      where: { id: bookmarkId }
    });

    return NextResponse.json({
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (error: any) {
    console.error('Bookmark deletion error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove bookmark' 
    }, { status: 500 });
  }
}
