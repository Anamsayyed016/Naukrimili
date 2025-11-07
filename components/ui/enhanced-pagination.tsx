/**
 * Enhanced Pagination Component
 * Professional pagination like LinkedIn, Indeed, etc.
 */

"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { safeLength, safeArray } from '@/lib/safe-array-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { useEnhancedPagination } from '@/lib/pagination/enhanced-pagination';
import { PaginationConfig } from '@/lib/pagination/enhanced-pagination';

interface EnhancedPaginationProps {
  config: PaginationConfig;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  className?: string;
  showInfo?: boolean;
  showJumpToPage?: boolean;
  showItemsPerPage?: boolean;
  compact?: boolean;
}

export function EnhancedPagination({
  config,
  onPageChange,
  onItemsPerPageChange,
  className = '',
  showInfo = true,
  showJumpToPage = false,
  showItemsPerPage = true,
  compact = false
}: EnhancedPaginationProps) {
  const [jumpToPage, setJumpToPage] = useState('');
  const [showJumpInput, setShowJumpInput] = useState(false);

  const pagination = useEnhancedPagination(config, onPageChange, onItemsPerPageChange);

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage);
    if (page >= 1 && page <= pagination.totalPages) {
      pagination.jumpToPage(page);
      setJumpToPage('');
      setShowJumpInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  if (pagination.totalPages <= 1) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center justify-between w-full max-w-full ${className}`}>
        {showInfo && (
          <div className="text-sm text-gray-600 truncate">
            {pagination.infoText}
          </div>
        )}
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          {pagination.hasPrev && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.jumpToPage(pagination.currentPage - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          {pagination.hasNext && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.jumpToPage(pagination.currentPage + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 w-full max-w-full ${className}`}>
      {/* Pagination Info */}
      {showInfo && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600 w-full">
          <div className="truncate">
            {pagination.infoText}
          </div>
          
          {showItemsPerPage && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span>Show:</span>
              <Select
                value={pagination.itemsPerPage.toString()}
                onValueChange={(value) => pagination.changeItemsPerPage(parseInt(value))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pagination.itemsPerPageOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-center space-x-1 flex-wrap gap-1 w-full overflow-x-auto touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' as any }}>
        {/* First Page */}
        {pagination.pages.some(p => p.type === 'first') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.jumpToPage(1)}
            disabled={pagination.currentPage === 1}
            className="h-9 w-9 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Previous Page */}
        {pagination.pages.some(p => p.type === 'prev') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.jumpToPage(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="h-9 w-9 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Page Numbers */}
        {pagination.pages.map((page, index) => {
          if (page.type === 'ellipsis') {
            return (
              <div key={index} className="flex items-center justify-center h-9 w-9">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </div>
            );
          }

          return (
            <Button
              key={index}
              variant={page.active ? "default" : "outline"}
              size="sm"
              onClick={() => !page.disabled && pagination.jumpToPage(page.page)}
              disabled={page.disabled}
              className={`h-9 w-9 p-0 ${
                page.active 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {page.label}
            </Button>
          );
        })}

        {/* Next Page */}
        {pagination.pages.some(p => p.type === 'next') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.jumpToPage(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="h-9 w-9 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Last Page */}
        {pagination.pages.some(p => p.type === 'last') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.jumpToPage(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="h-9 w-9 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Jump to Page */}
      {showJumpToPage && pagination.canJumpToPage && (
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-600">Go to page:</span>
          {showJumpInput ? (
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="1"
                max={pagination.totalPages}
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-20 h-8 text-center"
                placeholder="Page"
              />
              <Button
                size="sm"
                onClick={handleJumpToPage}
                className="h-8"
              >
                Go
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowJumpInput(false);
                  setJumpToPage('');
                }}
                className="h-8"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJumpInput(true)}
              className="h-8"
            >
              Jump to Page
            </Button>
          )}
        </div>
      )}

      {/* Quick Jump Suggestions */}
      {showJumpToPage && safeLength(pagination.jumpSuggestions) > 0 && !showJumpInput && (
        <div className="flex items-center justify-center space-x-1">
          <span className="text-sm text-gray-500">Quick jump:</span>
          {pagination.jumpSuggestions.slice(0, 5).map((page) => (
            <Button
              key={page}
              variant="ghost"
              size="sm"
              onClick={() => pagination.jumpToPage(page)}
              className={`h-7 px-2 text-xs ${
                page === pagination.currentPage 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export default EnhancedPagination;
