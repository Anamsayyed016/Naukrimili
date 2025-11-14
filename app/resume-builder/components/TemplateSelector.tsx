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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-10 2xl:gap-12 w-full auto-rows-fr">
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
                      'transition-all duration-300 hover:shadow-xl border-2 group overflow-hidden flex flex-col h-full w-full',
                      'min-h-[500px] sm:min-h-[520px] md:min-h-[540px] lg:min-h-[600px] xl:min-h-[640px] 2xl:min-h-[680px]',
                      isSelected
                        ? 'border-blue-600 shadow-lg ring-2 ring-blue-200 ring-offset-2'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    )}
                  >
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Template Header - Recommended Badge & Selection */}
                      <div className="flex items-center justify-between px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-2 bg-white border-b border-gray-100">
                        {isRecommended ? (
                          <Badge className="bg-pink-500 text-white border-0 shadow-sm text-xs sm:text-sm px-2.5 sm:px-3 py-1">
                            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
                            RECOMMENDED
                          </Badge>
                        ) : (
                          <div />
                        )}
                        {isSelected && (
                          <div className="ml-auto flex items-center gap-2 text-blue-600 text-sm sm:text-base font-medium">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Selected</span>
                          </div>
                        )}
                      </div>

                      {/* Template Preview - Clean without overlays */}
                      <div className="bg-white w-full overflow-hidden flex-1 flex items-center justify-center min-h-0 py-4 sm:py-5 lg:py-6 border-b border-gray-100">
                        <TemplatePreview
                          template={template.id}
                          data={sampleResumeData}
                          colorScheme={selectedColor}
                          isRecommended={isRecommended}
                        />
                      </div>

                      {/* Template Info */}
                      <div className="p-4 sm:p-5 lg:p-6 xl:p-7 bg-white flex-shrink-0 flex flex-col space-y-4">
                        <div>
                          <h3 className="font-bold text-gray-900 mb-2 text-lg sm:text-xl lg:text-2xl">{template.name}</h3>
                          <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">{template.description}</p>
                        </div>

                        {/* Color Swatches */}
                        <div className="flex items-center gap-2.5 sm:gap-3 md:gap-3.5 lg:gap-4 flex-wrap">
                          <span className="text-xs sm:text-sm lg:text-base text-gray-500 font-medium">Colors:</span>
                          {COLOR_SCHEMES.map((color) => (
                            <button
                              key={color.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedColor(color.value);
                                onColorSchemeChange?.(color.value);
                              }}
                              className={cn(
                                'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 xl:w-11 xl:h-11 rounded-full border-2 transition-all hover:scale-110',
                                selectedColor === color.value
                                  ? 'border-gray-900 shadow-lg ring-2 ring-gray-400 scale-110'
                                  : 'border-gray-300 hover:border-gray-500'
                              )}
                              style={{
                                backgroundColor: (color as any).hex || '#000000',
                              }}
                              title={color.label}
                            />
                          ))}
                        </div>

                        {/* Choose Template Button */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTemplateSelect(template.id as TemplateStyle);
                          }}
                          className={cn(
                            'w-full mt-2 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-sm',
                            isSelected
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          )}
                          variant="default"
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-5 h-5 mr-2" />
                              Template Selected
                            </>
                          ) : (
                            'Choose template'
                          )}
                        </Button>
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
