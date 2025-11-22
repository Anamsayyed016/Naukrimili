'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[] | Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  className?: string;
  allowCustom?: boolean;
  searchPlaceholder?: string;
}

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
  className,
  allowCustom = true,
  searchPlaceholder = 'Search...',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);

  // Normalize options to array of {value, label}
  const normalizedOptions = useMemo(() => 
    options.map(opt => 
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    ), [options]
  );

  // Filter options based on search query
  const filteredOptions = useMemo(() => 
    normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    ), [normalizedOptions, searchQuery]
  );

  // Get display value - use strict equality for matching
  const displayValue = useMemo(() => {
    const found = normalizedOptions.find(opt => opt.value === value);
    return found ? found.label : value;
  }, [normalizedOptions, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if we're in the middle of selecting
      if (isSelectingRef.current) {
        return;
      }
      
      const target = event.target as Node;
      // Check if click is outside the container
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      // Use mousedown with a slight delay to allow click events to process first
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
      
      // Focus search input when dropdown opens
      setTimeout(() => inputRef.current?.focus(), 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Mark that we're selecting to prevent click-outside from interfering
    isSelectingRef.current = true;
    
    // Ensure we're passing the actual value, not the label
    const selectedOption = normalizedOptions.find(opt => opt.value === optionValue || opt.label === optionValue);
    const finalValue = selectedOption ? selectedOption.value : optionValue;
    
    // Call onChange with the selected value
    onChange(finalValue);
    
    // Close dropdown and reset
    setIsOpen(false);
    setSearchQuery('');
    
    // Reset selection flag after a brief delay
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={cn('space-y-2 relative', className)} ref={containerRef}>
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "hover:border-gray-400 transition-colors",
            !value && "text-muted-foreground"
          )}
        >
          <span className={cn("truncate", !value && "text-gray-400")}>
            {value ? displayValue : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Clear selection"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 opacity-50 transition-transform",
              isOpen && "transform rotate-180"
            )} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[60vh] sm:max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200">
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Options List */}
            <div className="overflow-y-auto overflow-x-hidden max-h-[calc(60vh-4rem)] sm:max-h-48 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(option.value, e);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm",
                        "hover:bg-gray-100 focus:bg-gray-100",
                        "flex items-center gap-2",
                        "transition-colors",
                        "cursor-pointer",
                        isSelected && "bg-blue-50 text-blue-700"
                      )}
                    >
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      <span className={cn(!isSelected && "ml-6")}>{option.label}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  {allowCustom && searchQuery ? (
                    <button
                      type="button"
                      onClick={(e) => handleSelect(searchQuery, e)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add "{searchQuery}" as custom
                    </button>
                  ) : (
                    'No options found'
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

