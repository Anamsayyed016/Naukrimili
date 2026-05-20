/**
 * Scalable pagination utilities for the resume template gallery.
 */

export const GALLERY_PAGE_SIZE_DESKTOP = 6;
export const GALLERY_PAGE_SIZE_MOBILE = 4;

export function getGalleryPageSize(isMobile: boolean): number {
  return isMobile ? GALLERY_PAGE_SIZE_MOBILE : GALLERY_PAGE_SIZE_DESKTOP;
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  if (pageSize <= 0 || items.length === 0) return [];
  const safePage = Math.min(Math.max(page, 1), getTotalPages(items.length, pageSize));
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getTotalPages(itemCount: number, pageSize: number): number {
  if (itemCount <= 0 || pageSize <= 0) return 1;
  return Math.ceil(itemCount / pageSize);
}

export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

export type PageIndicator = number | 'ellipsis';

/** Compact page list with ellipses for large template counts */
export function getVisiblePageNumbers(currentPage: number, totalPages: number): PageIndicator[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: PageIndicator[] = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);
  return pages;
}
