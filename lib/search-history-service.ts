/**
 * Search History Service
 * Centralized service for managing search history operations
 */

import { prisma } from './prisma';

export interface SearchHistoryEntry {
  id: string;
  userId: string;
  query: string;
  location?: string;
  filters?: Record<string, unknown> | null; // Prisma JsonValue type
  resultCount: number;
  searchType: string;
  source: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSearchHistoryData {
  userId: string;
  query: string;
  location?: string;
  filters?: Record<string, unknown> | null;
  resultCount?: number;
  searchType?: string;
  source?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface SearchHistoryOptions {
  limit?: number;
  offset?: number;
  searchType?: string;
  query?: string;
  userId?: string;
  includePopular?: boolean;
}

class SearchHistoryService {
  /**
   * Create a new search history entry
   */
  async createSearchHistory(data: CreateSearchHistoryData): Promise<SearchHistoryEntry> {
    try {
      const searchEntry = await (prisma as any).searchHistory.create({
        data: {
          userId: data.userId,
          query: data.query.trim(),
          location: data.location || null,
          filters: data.filters || null,
          resultCount: data.resultCount || 0,
          searchType: data.searchType || 'job',
          source: data.source || 'web',
          userAgent: data.userAgent || null,
          ipAddress: data.ipAddress || null
        }
      });

      return searchEntry;
    } catch (error) {
      console.error('Error creating search history:', error);
      throw new Error('Failed to create search history entry');
    }
  }

  /**
   * Get search history for a user
   */
  async getUserSearchHistory(
    userId: string, 
    options: SearchHistoryOptions = {}
  ): Promise<{
    history: SearchHistoryEntry[];
    popularSearches: Array<{ query: string; count: number }>;
    total: number;
  }> {
    try {
      const {
        limit = 20,
        offset = 0,
        searchType,
        query,
        includePopular = true
      } = options;

      // Build where clause
      const where: {
        userId: string;
        searchType?: string;
        query?: { contains: string; mode: string };
      } = { userId };
      
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
          skip: offset
        }),
        (prisma as any).searchHistory.count({ where })
      ]);

      // Get popular searches if requested
      let popularSearches: Array<{ query: string; count: number }> = [];
      
      if (includePopular) {
        const popular = await (prisma as any).searchHistory.groupBy({
          by: ['query'],
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          _count: { query: true },
          orderBy: { _count: { query: 'desc' } },
          take: 10
        });

        popularSearches = popular.map(item => ({
          query: item.query,
          count: item._count.query
        }));
      }

      return {
        history,
        popularSearches,
        total
      };
    } catch (error) {
      console.error('Error fetching search history:', error);
      return {
        history: [],
        popularSearches: [],
        total: 0
      };
    }
  }

  /**
   * Get a specific search history entry
   */
  async getSearchHistoryEntry(
    id: string, 
    userId: string
  ): Promise<SearchHistoryEntry | null> {
    try {
      const entry = await (prisma as any).searchHistory.findFirst({
        where: {
          id,
          userId
        }
      });

      return entry;
    } catch (error) {
      console.error('Error fetching search history entry:', error);
      return null;
    }
  }

  /**
   * Delete a specific search history entry
   */
  async deleteSearchHistoryEntry(id: string, userId: string): Promise<boolean> {
    try {
      // Check if the entry belongs to the user
      const entry = await (prisma as any).searchHistory.findFirst({
        where: { id, userId }
      });

      if (!entry) {
        return false;
      }

      await (prisma as any).searchHistory.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error('Error deleting search history entry:', error);
      return false;
    }
  }

  /**
   * Clear user's search history
   */
  async clearUserSearchHistory(
    userId: string, 
    olderThanDays?: number
  ): Promise<number> {
    try {
      let whereClause: any = { userId };
      
      if (olderThanDays) {
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        whereClause.createdAt = { lt: cutoffDate };
      }

      const result = await (prisma as any).searchHistory.deleteMany({
        where: whereClause
      });

      return result.count;
    } catch (error) {
      console.error('Error clearing search history:', error);
      return 0;
    }
  }

  /**
   * Get search analytics for a user
   */
  async getUserSearchAnalytics(userId: string): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    mostSearchedTerms: Array<{ query: string; count: number }>;
    searchTypes: Array<{ type: string; count: number }>;
    recentActivity: Array<{ date: string; count: number }>;
  }> {
    try {
      const [
        totalSearches,
        uniqueQueries,
        mostSearchedTerms,
        searchTypes,
        recentActivity
      ] = await Promise.all([
        // Total searches
        (prisma as any).searchHistory.count({
          where: { userId }
        }),

        // Unique queries
        (prisma as any).searchHistory.groupBy({
          by: ['query'],
          where: { userId },
          _count: { query: true }
        }).then(result => result.length),

        // Most searched terms
        (prisma as any).searchHistory.groupBy({
          by: ['query'],
          where: { userId },
          _count: { query: true },
          orderBy: { _count: { query: 'desc' } },
          take: 10
        }).then(result => result.map(item => ({
          query: item.query,
          count: item._count.query
        }))),

        // Search types
        (prisma as any).searchHistory.groupBy({
          by: ['searchType'],
          where: { userId },
          _count: { searchType: true }
        }).then(result => result.map(item => ({
          type: item.searchType,
          count: item._count.searchType
        }))),

        // Recent activity (last 30 days)
        prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM "SearchHistory"
          WHERE user_id = ${userId}
            AND created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `
      ]);

      return {
        totalSearches,
        uniqueQueries,
        mostSearchedTerms,
        searchTypes,
        recentActivity: recentActivity as Array<{ date: string; count: number }>
      };
    } catch (error) {
      console.error('Error fetching search analytics:', error);
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        mostSearchedTerms: [],
        searchTypes: [],
        recentActivity: []
      };
    }
  }

  /**
   * Track search result count
   */
  async updateSearchResultCount(
    id: string, 
    userId: string, 
    resultCount: number
  ): Promise<boolean> {
    try {
      await (prisma as any).searchHistory.updateMany({
        where: {
          id,
          userId
        },
        data: {
          resultCount
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating search result count:', error);
      return false;
    }
  }

  /**
   * Get trending searches across all users
   */
  async getTrendingSearches(limit: number = 10): Promise<Array<{
    query: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>> {
    try {
      const trending = await (prisma as any).searchHistory.groupBy({
        by: ['query'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        _count: { query: true },
        orderBy: { _count: { query: 'desc' } },
        take: limit
      });

      return trending.map(item => ({
        query: item.query,
        count: item._count.query,
        trend: 'stable' as const // Could be enhanced with trend calculation
      }));
    } catch (error) {
      console.error('Error fetching trending searches:', error);
      return [];
    }
  }
}

// Export singleton instance
export const searchHistoryService = new SearchHistoryService();

// Export individual methods for easy use
export const {
  createSearchHistory,
  getUserSearchHistory,
  getSearchHistoryEntry,
  deleteSearchHistoryEntry,
  clearUserSearchHistory,
  getUserSearchAnalytics,
  updateSearchResultCount,
  getTrendingSearches
} = searchHistoryService;
