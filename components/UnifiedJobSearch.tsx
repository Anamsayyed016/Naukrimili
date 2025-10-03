'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface UnifiedJobSearchProps {
  variant?: 'default' | 'hero' | 'homepage';
  showAdvancedFilters?: boolean;
  showSuggestions?: boolean;
  showLocationCategories?: boolean;
  autoSearch?: boolean;
  className?: string;
  placeholder?: string;
}

export default function UnifiedJobSearch({ 
  variant = 'default',
  showAdvancedFilters = true,
  showSuggestions = true,
  showLocationCategories = true,
  autoSearch = false,
  className = '', 
  placeholder = 'Search jobs...' 
}: UnifiedJobSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    if (searchTerm.trim()) {
      window.location.href = `/jobs?q=${encodeURIComponent(searchTerm)}`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1"
      />
      <Button onClick={handleSearch} className="px-6">
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
    </div>
  );
}