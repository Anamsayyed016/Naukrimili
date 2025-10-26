/**
 * Search History API
 * Handles search history tracking and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

export interface SearchHistoryData {
  query: string;
  location?: string;
  filters?: Record<string, any>;
  resultCount?: number;
  searchType?: string;
  source?: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * GET /api/search/history
 * Retrieve user's search history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const searchType = searchParams.get('type') || undefined;
    const query = searchParams.get('query') || undefined;

    // Build where clause
    const where: any = { userId: session.user.id };
    
    if (searchType) {
      where.searchType = searchType;
    }
    
    if (query) {
      where.query = {
        contains: query,
        mode: 'insensitive'
      };
    }

    // Get search history with pagination
    const [history, total] = await Promise.all([
      (prisma as any).searchHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          query: true,
          location: true,
          filters: true,
          resultCount: true,
          searchType: true,
          source: true,
          createdAt: true
        }
      }),
      (prisma as any).searchHistory.count({ where })
    ]);

    // Get popular searches for suggestions
    const popularSearches = await (prisma as any).searchHistory.groupBy({
      by: ['query'],
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: {
        history,
        popularSearches: popularSearches.map(item => ({
          query: item.query,
          count: item._count.query
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (_error) {
    console.error('Error fetching search history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search/history
 * Create a new search history entry
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SearchHistoryData = await request.json();
    const { query, location, filters, resultCount, searchType, source, userAgent, ipAddress } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const clientUserAgent = request.headers.get('user-agent') || 'unknown';

    // Create search history entry
    const searchEntry = await (prisma as any).searchHistory.create({
      data: {
        userId: session.user.id,
        query: query.trim(),
        location: location || null,
        filters: filters || null,
        resultCount: resultCount || 0,
        searchType: searchType || 'job',
        source: source || 'web',
        userAgent: userAgent || clientUserAgent,
        ipAddress: ipAddress || clientIP
      }
    });

    return NextResponse.json({
      success: true,
      data: searchEntry
    });

  } catch (_error) {
    console.error('Error creating search history:', error);
    return NextResponse.json(
      { error: 'Failed to create search history entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/search/history
 * Clear user's search history
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan');
    
    let whereClause: any = { userId: session.user.id };
    
    if (olderThan) {
      const days = parseInt(olderThan);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      whereClause.createdAt = { lt: cutoffDate };
    }

    // Delete search history
    const deletedCount = await (prisma as any).searchHistory.deleteMany({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount.count} search history entries`,
      deletedCount: deletedCount.count
    });

  } catch (_error) {
    console.error('Error deleting search history:', error);
    return NextResponse.json(
      { error: 'Failed to delete search history' },
      { status: 500 }
    );
  }
}
