'use client';

/**
 * Background Pattern Picker Component
 * Allows users to select optional background patterns for resumes
 * All patterns are lightweight, ATS-safe, and minimal
 */

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, Info, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BackgroundPattern, BackgroundCategory } from '@/lib/resume-builder/types';

interface BackgroundPickerProps {
  selectedBackgroundId?: string;
  onBackgroundChange: (backgroundId: string) => void;
  className?: string;
}

export default function BackgroundPicker({
  selectedBackgroundId = 'none',
  onBackgroundChange,
  className = '',
}: BackgroundPickerProps) {
  const [backgrounds, setBackgrounds] = useState<BackgroundPattern[]>([]);
  const [categories, setCategories] = useState<BackgroundCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBackgrounds() {
      try {
        const response = await fetch('/backgrounds.json');
        const data = await response.json();
        setBackgrounds(data.backgrounds || []);
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error loading backgrounds:', error);
        // Fallback to "none" background
        setBackgrounds([
          {
            id: 'none',
            name: 'No Background',
            description: 'Clean white background',
            thumbnail: '',
            pattern: 'none',
            opacity: 1.0,
            atsScore: 100,
            category: 'minimal',
            recommended: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadBackgrounds();
  }, []);

  const filteredBackgrounds =
    selectedCategory === 'all'
      ? backgrounds
      : backgrounds.filter((bg) => bg.category === selectedCategory);

  const selectedBackground = backgrounds.find(
    (bg) => bg.id === selectedBackgroundId
  );

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Label className="text-sm font-semibold">Background Pattern</Label>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-900">
            Background Pattern
          </Label>
          <p className="text-xs text-gray-500">
            Optional: Add a subtle background pattern
          </p>
        </div>
        {selectedBackground && selectedBackground.id !== 'none' && (
          <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md">
            <Star className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">
              ATS Score: {selectedBackground.atsScore}%
            </span>
          </div>
        )}
      </div>

      {/* ATS Information */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-semibold text-amber-900">
              ATS Compatibility
            </h4>
            <p className="text-xs text-amber-800">
              All patterns are lightweight and ATS-safe. "No Background" (100%
              ATS score) is recommended for maximum compatibility.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="text-xs"
        >
          All Patterns
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="text-xs"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Background Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        <AnimatePresence mode="wait">
          {filteredBackgrounds.map((background) => {
            const isSelected = background.id === selectedBackgroundId;
            const isRecommended = background.recommended;

            return (
              <motion.button
                key={background.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onBackgroundChange(background.id)}
                className={`
                  relative group rounded-xl overflow-hidden border-2 transition-all duration-200
                  ${
                    isSelected
                      ? 'border-blue-600 shadow-lg shadow-blue-500/30'
                      : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
                  }
                `}
                title={background.description}
              >
                {/* Thumbnail Preview */}
                <div className="aspect-square bg-white p-2">
                  <div
                    className="w-full h-full rounded-lg border border-gray-200 bg-white"
                    style={{
                      backgroundImage:
                        background.pattern !== 'none'
                          ? `url('/backgrounds/patterns/${background.pattern}.svg')`
                          : 'none',
                      backgroundSize: '20px 20px',
                      backgroundRepeat: 'repeat',
                      opacity: background.pattern !== 'none' ? 1 : 1,
                    }}
                  />
                </div>

                {/* Background Name */}
                <div className="p-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {background.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-500">
                      {background.atsScore}% ATS
                    </p>
                    {isRecommended && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 bg-blue-600 rounded-full p-1 shadow-lg"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-200" />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Selected Background Info */}
      {selectedBackground && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    selectedBackground.pattern !== 'none'
                      ? `url('/backgrounds/patterns/${selectedBackground.pattern}.svg')`
                      : 'none',
                  backgroundSize: '8px 8px',
                  backgroundRepeat: 'repeat',
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedBackground.name}
                </h3>
                {selectedBackground.recommended && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">
                {selectedBackground.description}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-500">
                  Opacity: {(selectedBackground.opacity * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs font-medium text-blue-600">
                  {selectedBackground.atsScore}% ATS Compatible
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

