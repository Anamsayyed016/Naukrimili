'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TEMPLATE_OPTIONS, COLOR_SCHEMES } from '../utils/constants';
import { TemplateStyle } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import TemplatePreview from './TemplatePreview';

interface TemplateSelectorProps {
  selectedTemplate: TemplateStyle;
  onTemplateSelect: (template: TemplateStyle) => void;
  selectedColorScheme?: string;
  onColorSchemeChange?: (color: string) => void;
  experienceLevel?: string;
}

interface FilterState {
  headshot: {
    withPhoto: boolean;
    withoutPhoto: boolean;
  };
  columns: {
    one: boolean;
    two: boolean;
  };
  style: {
    traditional: boolean;
    creative: boolean;
    contemporary: boolean;
  };
}

export default function TemplateSelector({ 
  selectedTemplate, 
  onTemplateSelect,
  selectedColorScheme = 'blue',
  onColorSchemeChange,
  experienceLevel = 'mid'
}: TemplateSelectorProps) {
  const [filters, setFilters] = useState<FilterState>({
    headshot: { withPhoto: false, withoutPhoto: false },
    columns: { one: false, two: false },
    style: { traditional: false, creative: false, contemporary: false },
  });

  const [selectedColor, setSelectedColor] = useState(selectedColorScheme);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setSelectedColor(selectedColorScheme);
  }, [selectedColorScheme]);

  // Sample resume data for previews
  const sampleResumeData = {
    fullName: 'Saanvi Patel',
    jobTitle: 'Retail Sales Associate',
    email: 's.patel@email.com',
    phone: '+91 11 5555 3345',
    location: 'New Delhi, India 110034',
    summary: 'Customer-focused Retail Sales professional with 5+ years of experience in fast-paced retail environments. Proven track record of driving sales growth and delivering exceptional customer service.',
    skills: ['Store opening and closing', 'Accurate Money Handling', 'Loss prevention', 'Sales expertise', 'Store Merchandising', 'Product promotions'],
    experience: [
      {
        position: 'Retail Sales Associate',
        company: 'H&M',
        location: 'New Delhi, India',
        startDate: '2016-05',
        endDate: 'Current',
        current: true,
        bullets: [
          'Increased sales by 25% through effective customer engagement',
          'Maintained inventory accuracy of 98%',
          'Trained 5+ new team members',
        ],
      },
    ],
    education: [
      {
        degree: 'Diploma',
        field: 'Financial Accounting',
        institution: 'Oxford Software Institute & Oxford School of English',
        location: 'New Delhi, India',
        date: 'June 2016',
      },
    ],
  };

  // Determine which templates are recommended based on experience level
  const getRecommendedTemplates = (): TemplateStyle[] => {
    if (experienceLevel === 'mid') return ['modern', 'corporate'];
    if (experienceLevel === 'fresher' || experienceLevel === 'entry') return ['minimal', 'fresher-friendly'];
    if (experienceLevel === 'senior' || experienceLevel === 'executive') return ['executive', 'corporate'];
    return ['modern', 'corporate'];
  };

  const recommendedTemplates = getRecommendedTemplates();

  const clearFilters = () => {
    setFilters({
      headshot: { withPhoto: false, withoutPhoto: false },
      columns: { one: false, two: false },
      style: { traditional: false, creative: false, contemporary: false },
    });
  };

  const hasActiveFilters = Object.values(filters).some(category =>
    Object.values(category).some(value => value === true)
  );

  const renderFilters = () => (
    <div className="space-y-6">
      {/* Headshot Filter */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Headshot</h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={filters.headshot.withPhoto}
              onCheckedChange={(checked) =>
                setFilters(prev => ({
                  ...prev,
                  headshot: { ...prev.headshot, withPhoto: !!checked },
                }))
              }
            />
            <span className="text-sm text-gray-700">With photo</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={filters.headshot.withoutPhoto}
              onCheckedChange={(checked) =>
                setFilters(prev => ({
                  ...prev,
                  headshot: { ...prev.headshot, withoutPhoto: !!checked },
                }))
              }
            />
            <span className="text-sm text-gray-700">Without photo</span>
          </label>
        </div>
      </div>

      {/* Columns Filter */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Columns</h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={filters.columns.one}
              onCheckedChange={(checked) =>
                setFilters(prev => ({
                  ...prev,
                  columns: { ...prev.columns, one: !!checked },
                }))
              }
            />
            <span className="text-sm text-gray-700">1 Column</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={filters.columns.two}
              onCheckedChange={(checked) =>
                setFilters(prev => ({
                  ...prev,
                  columns: { ...prev.columns, two: !!checked },
                }))
              }
            />
            <span className="text-sm text-gray-700">2 Columns</span>
          </label>
        </div>
      </div>

      {/* Style Filter */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Style</h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={filters.style.traditional}
              onCheckedChange={(checked) =>
                setFilters(prev => ({
                  ...prev,
                  style: { ...prev.style, traditional: !!checked },
                }))
              }
            />
            <span className="text-sm text-gray-700">Traditional</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={filters.style.creative}
              onCheckedChange={(checked) =>
                setFilters(prev => ({
                  ...prev,
                  style: { ...prev.style, creative: !!checked },
                }))
              }
            />
            <span className="text-sm text-gray-700">Creative</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={filters.style.contemporary}
              onCheckedChange={(checked) =>
                setFilters(prev => ({
                  ...prev,
                  style: { ...prev.style, contemporary: !!checked },
                }))
              }
            />
            <span className="text-sm text-gray-700">Contemporary</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 w-full">
      {/* Header */}
      <div className="text-center px-2 sm:px-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words">
          Best templates for {experienceLevel === 'mid' ? '3-5 years' : experienceLevel === 'fresher' ? '0-1 years' : experienceLevel === 'entry' ? '1-2 years' : experienceLevel === 'senior' ? '5-10 years' : '10+ years'} of experience
        </h2>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg">You can always change your template later</p>
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden flex items-center justify-between px-2 sm:px-4">
        <Button
          variant="outline"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters ? 'Filters' : 'Show Filters'}
          {hasActiveFilters && (
            <Badge className="ml-1 bg-blue-600 text-white">Active</Badge>
          )}
        </Button>
      </div>

      {/* Mobile Filters Overlay */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-16 pb-4 px-4 overflow-y-auto"
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-lg shadow-xl"
            >
              <Card className="border-0 shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMobileFilters(false)}
                      className="p-1"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  {renderFilters()}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full">
        {/* Left Sidebar - Filters (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-3 xl:col-span-3">
          <Card className="sticky top-24 shadow-md">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={clearFilters}
                    className="text-blue-600 h-auto p-0 text-sm font-normal"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
              {renderFilters()}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area - Templates */}
        <div className="w-full lg:col-span-9 xl:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-6 xl:gap-8 w-full auto-rows-fr">
            {TEMPLATE_OPTIONS.slice(0, 6).map((template, index) => {
              const isRecommended = recommendedTemplates.includes(template.id);
              const isSelected = selectedTemplate === template.id;

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex flex-col w-full min-w-0"
                >
                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-300 hover:shadow-2xl border-2 group overflow-hidden flex flex-col h-full w-full',
                      'min-h-[450px] lg:min-h-[480px] xl:min-h-[500px]',
                      isSelected
                        ? 'border-blue-600 shadow-xl ring-2 ring-blue-200 ring-offset-2'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                    )}
                    onClick={() => onTemplateSelect(template.id as TemplateStyle)}
                  >
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Template Preview */}
                      <div className="relative bg-white border-b border-gray-200 w-full overflow-hidden">
                        <TemplatePreview
                          template={template.id}
                          data={sampleResumeData}
                          colorScheme={selectedColor}
                          isRecommended={isRecommended}
                        />
                        
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-blue-600 rounded-full flex items-center justify-center shadow-lg z-10 animate-in fade-in zoom-in duration-200">
                            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                        )}

                        {/* Recommended Badge */}
                        {isRecommended && (
                          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                            <Badge className="bg-pink-500 text-white border-0 shadow-md text-xs sm:text-sm px-2 sm:px-2.5 py-1 sm:py-1.5">
                              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                              RECOMMENDED
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Template Info */}
                      <div className="p-4 sm:p-5 lg:p-6 bg-white flex-1 flex flex-col">
                        <h3 className="font-bold text-gray-900 mb-2 text-lg sm:text-xl lg:text-xl">{template.name}</h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4 flex-1">{template.description}</p>

                        {/* Color Swatches */}
                        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                          <span className="text-xs sm:text-sm text-gray-500 font-medium">Colors:</span>
                          {COLOR_SCHEMES.map((color) => (
                            <button
                              key={color.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedColor(color.value);
                                onColorSchemeChange?.(color.value);
                              }}
                              className={cn(
                                'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full border-2 transition-all hover:scale-110',
                                selectedColor === color.value
                                  ? 'border-gray-900 shadow-md ring-2 ring-gray-300 scale-110'
                                  : 'border-gray-300 hover:border-gray-400'
                              )}
                              style={{
                                backgroundColor: (color as any).hex || '#000000',
                              }}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
