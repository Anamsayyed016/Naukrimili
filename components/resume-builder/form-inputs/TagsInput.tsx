'use client';

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';

interface TagsInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function TagsInput({
  label,
  value,
  onChange,
  placeholder = 'Type a skill and press Enter or click Add',
  required = false,
  className,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const { isMobile, isTablet } = useResponsive();

  const addTag = (tagToAdd?: string) => {
    const tag = tagToAdd || inputValue.trim();
    if (!tag) return;

    // Case-insensitive duplicate check
    const normalizedTag = tag.toLowerCase();
    const isDuplicate = value.some(existingTag => existingTag.toLowerCase() === normalizedTag);
    
    if (!isDuplicate) {
      onChange([...value, tag]);
      setInputValue('');
    } else {
      // Clear input even if duplicate to give user feedback
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag();
    }
    // Allow comma as alternative to Enter
    if (e.key === ',' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim().replace(/,$/, ''); // Remove trailing comma if any
      if (newTag) {
        addTag(newTag);
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {/* Input with Add Button */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size={isMobile ? "default" : "sm"}
          onClick={() => addTag()}
          disabled={!inputValue.trim()}
          className={cn(
            "shrink-0",
            isMobile && "min-w-[60px] px-4",
            !isMobile && "px-3"
          )}
          aria-label="Add skill"
        >
          <Plus className={cn("w-4 h-4", isMobile && "mr-1")} />
          {isMobile && <span className="text-sm">Add</span>}
        </Button>
      </div>

      {/* Skills Display - Responsive Grid */}
      {value.length > 0 && (
        <div className={cn(
          "mt-3",
          "flex flex-wrap gap-2",
          isMobile && "gap-2",
          !isMobile && "gap-2.5"
        )}>
          {value.map((tag, index) => (
            <Badge
              key={`${tag}-${index}`}
              variant="secondary"
              className={cn(
                "flex items-center gap-1.5",
                "transition-all duration-200",
                "hover:bg-gray-200",
                isMobile 
                  ? "px-3 py-1.5 text-sm min-h-[44px]" 
                  : "px-2.5 py-1 text-sm",
                "max-w-full"
              )}
            >
              <span className="truncate flex-1" title={tag}>
                {tag}
              </span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className={cn(
                  "shrink-0 rounded-full transition-colors",
                  "hover:bg-red-200 active:bg-red-300",
                  "focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1",
                  isMobile 
                    ? "p-2 min-w-[44px] min-h-[44px]" 
                    : "p-0.5 hover:bg-gray-300 min-w-[24px] min-h-[24px]",
                  "flex items-center justify-center"
                )}
                aria-label={`Remove ${tag}`}
              >
                <X className={cn(
                  isMobile ? "w-4 h-4" : "w-3 h-3",
                  "text-gray-600 hover:text-red-600"
                )} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {value.length === 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {isMobile 
            ? "Type a skill and tap 'Add' or press Enter" 
            : "Type a skill and press Enter or click Add"}
        </p>
      )}
    </div>
  );
}

