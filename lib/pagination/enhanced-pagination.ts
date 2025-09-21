/**
 * Enhanced Pagination System
 * Professional pagination like major job portals (LinkedIn, Indeed, etc.)
 */

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  maxVisiblePages?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  showPageNumbers?: boolean;
  showJumpToPage?: boolean;
  showItemsPerPage?: boolean;
  itemsPerPageOptions?: number[];
}

export interface PaginationResult {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  startItem: number;
  endItem: number;
  pages: PageInfo[];
  canJumpToPage: boolean;
  itemsPerPageOptions: number[];
}

export interface PageInfo {
  page: number;
  label: string;
  type: 'page' | 'ellipsis' | 'prev' | 'next' | 'first' | 'last';
  disabled: boolean;
  active: boolean;
}

export interface PaginationProps {
  config: PaginationConfig;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  className?: string;
  showInfo?: boolean;
  showJumpToPage?: boolean;
  showItemsPerPage?: boolean;
}

export class EnhancedPagination {
  /**
   * Calculate pagination data
   */
  static calculate(config: PaginationConfig): PaginationResult {
    const {
      page,
      limit,
      total,
      maxVisiblePages = 7,
      showFirstLast = true,
      showPrevNext = true,
      itemsPerPageOptions = [10, 20, 50, 100]
    } = config;

    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, total);

    // Generate page numbers with ellipsis
    const pages = this.generatePageNumbers(currentPage, totalPages, maxVisiblePages, showFirstLast, showPrevNext);

    return {
      currentPage,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext,
      hasPrev,
      startItem,
      endItem,
      pages,
      canJumpToPage: totalPages > maxVisiblePages,
      itemsPerPageOptions
    };
  }

  /**
   * Generate page numbers with ellipsis logic
   */
  private static generatePageNumbers(
    currentPage: number,
    totalPages: number,
    maxVisiblePages: number,
    showFirstLast: boolean,
    showPrevNext: boolean
  ): PageInfo[] {
    const pages: PageInfo[] = [];

    // Previous button
    if (showPrevNext) {
      pages.push({
        page: currentPage - 1,
        label: 'Previous',
        type: 'prev',
        disabled: currentPage <= 1,
        active: false
      });
    }

    // First page
    if (showFirstLast && currentPage > Math.ceil(maxVisiblePages / 2)) {
      pages.push({
        page: 1,
        label: '1',
        type: 'first',
        disabled: false,
        active: currentPage === 1
      });

      if (currentPage > Math.ceil(maxVisiblePages / 2) + 1) {
        pages.push({
          page: 0,
          label: '...',
          type: 'ellipsis',
          disabled: true,
          active: false
        });
      }
    }

    // Calculate visible page range
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push({
        page: i,
        label: i.toString(),
        type: 'page',
        disabled: false,
        active: i === currentPage
      });
    }

    // Last page
    if (showFirstLast && endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push({
          page: 0,
          label: '...',
          type: 'ellipsis',
          disabled: true,
          active: false
        });
      }

      pages.push({
        page: totalPages,
        label: totalPages.toString(),
        type: 'last',
        disabled: false,
        active: currentPage === totalPages
      });
    }

    // Next button
    if (showPrevNext) {
      pages.push({
        page: currentPage + 1,
        label: 'Next',
        type: 'next',
        disabled: currentPage >= totalPages,
        active: false
      });
    }

    return pages;
  }

  /**
   * Generate pagination info text
   */
  static generateInfoText(result: PaginationResult): string {
    const { startItem, endItem, totalItems, currentPage, totalPages } = result;
    
    if (totalItems === 0) {
      return 'No items found';
    }

    return `Showing ${startItem} to ${endItem} of ${totalItems.toLocaleString()} results (Page ${currentPage} of ${totalPages})`;
  }

  /**
   * Generate page size options
   */
  static generatePageSizeOptions(currentLimit: number, totalItems: number): number[] {
    const baseOptions = [10, 20, 50, 100];
    const options = [...baseOptions];

    // Add current limit if not in base options
    if (!baseOptions.includes(currentLimit)) {
      options.push(currentLimit);
      options.sort((a, b) => a - b);
    }

    // Add total items as option if reasonable
    if (totalItems > 100 && totalItems < 1000 && !options.includes(totalItems)) {
      options.push(totalItems);
    }

    return options;
  }

  /**
   * Calculate optimal page size based on content
   */
  static calculateOptimalPageSize(totalItems: number, contentType: 'jobs' | 'companies' | 'applications' = 'jobs'): number {
    if (totalItems <= 50) return totalItems;
    
    const optimalSizes = {
      jobs: 20,
      companies: 15,
      applications: 10
    };

    const optimal = optimalSizes[contentType];
    
    // If total items is close to a multiple of optimal, use that
    const remainder = totalItems % optimal;
    if (remainder <= 5) {
      return optimal;
    }

    // Otherwise, use a size that gives us a reasonable number of pages
    const targetPages = Math.min(10, Math.max(3, Math.ceil(totalItems / 50)));
    return Math.ceil(totalItems / targetPages);
  }

  /**
   * Validate pagination parameters
   */
  static validateParams(page: number, limit: number, total: number): { page: number; limit: number } {
    const validPage = Math.max(1, Math.min(page, Math.ceil(total / Math.max(1, limit))));
    const validLimit = Math.max(1, Math.min(limit, 1000)); // Max 1000 items per page
    
    return { page: validPage, limit: validLimit };
  }

  /**
   * Generate URL search params for pagination
   */
  static generateUrlParams(page: number, limit: number, additionalParams: Record<string, any> = {}): URLSearchParams {
    const params = new URLSearchParams();
    
    if (page > 1) params.set('page', page.toString());
    if (limit !== 20) params.set('limit', limit.toString());
    
    // Add additional params
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });

    return params;
  }

  /**
   * Parse pagination params from URL
   */
  static parseUrlParams(searchParams: URLSearchParams): { page: number; limit: number } {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(1000, parseInt(searchParams.get('limit') || '20')));
    
    return { page, limit };
  }

  /**
   * Calculate page jump suggestions
   */
  static generateJumpSuggestions(currentPage: number, totalPages: number): number[] {
    const suggestions: number[] = [];
    
    // Add nearby pages
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      if (!suggestions.includes(i)) {
        suggestions.push(i);
      }
    }

    // Add quarter marks
    const quarterMarks = [
      Math.ceil(totalPages * 0.25),
      Math.ceil(totalPages * 0.5),
      Math.ceil(totalPages * 0.75)
    ];

    quarterMarks.forEach(mark => {
      if (mark > 0 && mark <= totalPages && !suggestions.includes(mark)) {
        suggestions.push(mark);
      }
    });

    // Add last page
    if (totalPages > 0 && !suggestions.includes(totalPages)) {
      suggestions.push(totalPages);
    }

    return suggestions.sort((a, b) => a - b);
  }
}

/**
 * React Hook for Enhanced Pagination
 */
export function useEnhancedPagination(
  config: PaginationConfig,
  onPageChange: (page: number) => void,
  onItemsPerPageChange?: (limit: number) => void
) {
  const pagination = EnhancedPagination.calculate(config);
  
  const jumpToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, pagination.totalPages));
    onPageChange(validPage);
  };

  const changeItemsPerPage = (limit: number) => {
    onItemsPerPageChange?.(limit);
    // Reset to first page when changing items per page
    onPageChange(1);
  };

  const jumpSuggestions = EnhancedPagination.generateJumpSuggestions(
    pagination.currentPage,
    pagination.totalPages
  );

  return {
    ...pagination,
    jumpToPage,
    changeItemsPerPage,
    jumpSuggestions,
    infoText: EnhancedPagination.generateInfoText(pagination)
  };
}
