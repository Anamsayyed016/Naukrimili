/**
 * Individual Search History API
 * Handles specific search history entry operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search/history/[id]
 * Get a specific search history entry
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const searchEntry = await (prisma as any).searchHistory.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      select: {
        id: true,
        query: true,
        location: true,
        filters: true,
        resultCount: true,
        searchType: true,
        source: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!searchEntry) {
      return NextResponse.json(
        { error: 'Search history entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: searchEntry
    });

  } catch (error) {
    console.error('Error fetching search history entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search history entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/search/history/[id]
 * Delete a specific search history entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if the search entry belongs to the user
    const searchEntry = await (prisma as any).searchHistory.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!searchEntry) {
      return NextResponse.json(
        { error: 'Search history entry not found' },
        { status: 404 }
      );
    }

    // Delete the search entry
    await (prisma as any).searchHistory.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Search history entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting search history entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete search history entry' },
      { status: 500 }
    );
  }
}
