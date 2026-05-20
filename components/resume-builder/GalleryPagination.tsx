'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getVisiblePageNumbers } from '@/lib/resume-builder/gallery-pagination';

interface GalleryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function GalleryPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: GalleryPaginationProps) {
  if (totalItems <= pageSize) {
    return null;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pageNumbers = getVisiblePageNumbers(currentPage, totalPages);

  return (
    <nav
      role="navigation"
      aria-label="Template gallery pagination"
      className={cn('flex flex-col items-center gap-3 sm:gap-4', className)}
    >
      <p className="text-xs sm:text-sm text-gray-500 tabular-nums">
        Showing {start}–{end} of {totalItems} templates
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1 px-2.5 sm:px-3"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-1">
          {pageNumbers.map((item, index) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center text-gray-400"
                aria-hidden
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === currentPage ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  'h-9 w-9 text-sm font-medium',
                  item === currentPage && 'pointer-events-none shadow-sm'
                )}
                aria-label={`Page ${item}`}
                aria-current={item === currentPage ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            )
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1 px-2.5 sm:px-3"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Button>
      </div>
    </nav>
  );
}
