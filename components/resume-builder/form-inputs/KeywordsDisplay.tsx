'use client';

/**
 * Keywords Display Component
 * Shows ATS keywords and allows users to add them to their resume
 */

import { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KeywordsDisplayProps {
  keywords: string[];
  selectedKeywords?: string[];
  onKeywordSelect?: (keyword: string) => void;
  onKeywordRemove?: (keyword: string) => void;
  className?: string;
  maxDisplay?: number;
}

export default function KeywordsDisplay({
  keywords,
  selectedKeywords = [],
  onKeywordSelect,
  onKeywordRemove,
  className,
  maxDisplay = 20,
}: KeywordsDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const displayKeywords = expanded ? keywords : keywords.slice(0, maxDisplay);
  const hasMore = keywords.length > maxDisplay;

  if (!keywords || keywords.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">
            ATS Keywords ({keywords.length})
          </h4>
        </div>
        {selectedKeywords.length > 0 && (
          <span className="text-xs text-green-600 font-medium">
            {selectedKeywords.length} selected
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {displayKeywords.map((keyword, index) => {
          const isSelected = selectedKeywords.includes(keyword);
          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (isSelected && onKeywordRemove) {
                  onKeywordRemove(keyword);
                } else if (!isSelected && onKeywordSelect) {
                  onKeywordSelect(keyword);
                }
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                isSelected
                  ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              )}
            >
              {isSelected ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <TrendingUp className="w-3 h-3" />
              )}
              {keyword}
            </button>
          );
        })}
      </div>

      {hasMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-xs"
        >
          {expanded ? 'Show Less' : `Show All ${keywords.length} Keywords`}
        </Button>
      )}

      {selectedKeywords.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Selected Keywords:</p>
          <div className="flex flex-wrap gap-2">
            {selectedKeywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium"
              >
                {keyword}
                {onKeywordRemove && (
                  <button
                    type="button"
                    onClick={() => onKeywordRemove(keyword)}
                    className="hover:bg-green-200 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

