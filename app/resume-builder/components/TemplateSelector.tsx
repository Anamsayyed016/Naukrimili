'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TEMPLATE_OPTIONS, COLOR_SCHEMES } from '../utils/constants';
import { TemplateStyle } from '../types';
import { motion } from 'framer-motion';
import TemplatePreview from './TemplatePreview';

interface TemplateSelectorProps {
  selectedTemplate: TemplateStyle;
  onTemplateSelect: (template: TemplateStyle) => void;
  selectedColorScheme?: string;
  onColorSchemeChange?: (color: string) => void;
  experienceLevel?: string;
}


export default function TemplateSelector({ 
  selectedTemplate, 
  onTemplateSelect,
  selectedColorScheme = 'blue',
  onColorSchemeChange,
  experienceLevel = 'mid'
}: TemplateSelectorProps) {
  const [selectedColor, setSelectedColor] = useState(selectedColorScheme);
  const [previousExperienceLevel, setPreviousExperienceLevel] = useState<string | undefined>(experienceLevel);

  // Determine which templates are recommended based on experience level
  const getRecommendedTemplates = (): TemplateStyle[] => {
    if (!experienceLevel) return ['modern', 'corporate'];
    if (experienceLevel === 'mid') return ['modern', 'corporate'];
    if (experienceLevel === 'fresher' || experienceLevel === 'entry') return ['minimal', 'fresher-friendly'];
    if (experienceLevel === 'senior' || experienceLevel === 'executive') return ['executive', 'corporate'];
    return ['modern', 'corporate'];
  };

  // Update local state when prop changes
  useEffect(() => {
    setSelectedColor(selectedColorScheme);
  }, [selectedColorScheme]);

  // Auto-select recommended template when experience level changes
  useEffect(() => {
    if (!experienceLevel) {
      setPreviousExperienceLevel(undefined);
      return;
    }

    const recommended = getRecommendedTemplates();
    
    // Only auto-select if experience level actually changed
    if (experienceLevel !== previousExperienceLevel && recommended.length > 0) {
      // If current template is not in recommended list, auto-select first recommended
      if (!recommended.includes(selectedTemplate)) {
        onTemplateSelect(recommended[0]);
      }
      setPreviousExperienceLevel(experienceLevel);
    } else if (previousExperienceLevel === undefined && experienceLevel) {
      // First time setting experience level - initialize previous
      setPreviousExperienceLevel(experienceLevel);
    }
  }, [experienceLevel, selectedTemplate, onTemplateSelect, previousExperienceLevel]);

  // Dynamic sample resume data based on experience level
  const getSampleResumeData = () => {
    const baseData = {
      fullName: 'Saanvi Patel',
      email: 's.patel@email.com',
      phone: '+91 11 5555 3345',
      location: 'New Delhi, India 110034',
    };

    if (experienceLevel === 'fresher' || experienceLevel === 'entry') {
      return {
        ...baseData,
        jobTitle: 'Recent Graduate',
        summary: 'Motivated recent graduate with strong academic background and internship experience. Eager to apply learned skills in a professional environment and contribute to team success.',
        skills: ['Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Microsoft Office', 'Basic Programming'],
        experience: [],
        education: [
          {
            degree: "Bachelor's",
            field: 'Computer Science',
            institution: 'University of Delhi',
            location: 'New Delhi, India',
            date: '2024',
          },
        ],
      };
    } else if (experienceLevel === 'mid') {
      return {
        ...baseData,
        jobTitle: 'Software Developer',
        summary: 'Experienced Software Developer with 3+ years of experience in building scalable web applications. Proficient in modern technologies and agile methodologies.',
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Git', 'Agile'],
        experience: [
          {
            position: 'Software Developer',
            company: 'Tech Solutions Inc',
            location: 'New Delhi, India',
            startDate: '2021-06',
            endDate: 'Current',
            current: true,
            bullets: [
              'Developed and maintained 10+ web applications',
              'Collaborated with cross-functional teams',
              'Improved application performance by 30%',
            ],
          },
        ],
        education: [
          {
            degree: "Bachelor's",
            field: 'Computer Science',
            institution: 'University of Delhi',
            location: 'New Delhi, India',
            date: '2020',
          },
        ],
      };
    } else if (experienceLevel === 'senior' || experienceLevel === 'executive') {
      return {
        ...baseData,
        jobTitle: 'Senior Software Engineer',
        summary: 'Senior Software Engineer with 8+ years of experience leading development teams and architecting enterprise solutions. Proven track record of delivering high-quality software products.',
        skills: ['Leadership', 'System Architecture', 'Cloud Computing', 'DevOps', 'Team Management', 'Strategic Planning'],
        experience: [
          {
            position: 'Senior Software Engineer',
            company: 'Enterprise Tech Corp',
            location: 'New Delhi, India',
            startDate: '2016-05',
            endDate: 'Current',
            current: true,
            bullets: [
              'Led team of 8+ developers on critical projects',
              'Architected scalable systems serving 1M+ users',
              'Reduced system downtime by 40%',
            ],
          },
        ],
        education: [
          {
            degree: "Master's",
            field: 'Computer Science',
            institution: 'IIT Delhi',
            location: 'New Delhi, India',
            date: '2015',
          },
        ],
      };
    }

    // Default for mid-level
    return {
      ...baseData,
      jobTitle: 'Software Developer',
      summary: 'Experienced professional with strong technical skills and proven ability to deliver results in fast-paced environments.',
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Git'],
      experience: [
        {
          position: 'Software Developer',
          company: 'Tech Solutions Inc',
          location: 'New Delhi, India',
          startDate: '2021-06',
          endDate: 'Current',
          current: true,
          bullets: [
            'Developed and maintained web applications',
            'Collaborated with cross-functional teams',
          ],
        },
      ],
      education: [
        {
          degree: "Bachelor's",
          field: 'Computer Science',
          institution: 'University of Delhi',
          location: 'New Delhi, India',
          date: '2020',
        },
      ],
    };
  };

  const sampleResumeData = getSampleResumeData();

  const recommendedTemplates = getRecommendedTemplates();

  // Get experience level display text
  const getExperienceLevelText = (): string => {
    if (!experienceLevel) return 'your experience level';
    if (experienceLevel === 'mid') return '3-5 years';
    if (experienceLevel === 'fresher') return '0-1 years';
    if (experienceLevel === 'entry') return '1-2 years';
    if (experienceLevel === 'senior') return '5-10 years';
    if (experienceLevel === 'executive') return '10+ years';
    return 'your experience level';
  };

  // Sort templates to show recommended first, then limit to 3
  const sortedTemplates = [...TEMPLATE_OPTIONS].sort((a, b) => {
    const aRecommended = recommendedTemplates.includes(a.id);
    const bRecommended = recommendedTemplates.includes(b.id);
    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;
    return 0;
  }).slice(0, 3); // Limit to 3 templates

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="text-center px-2 sm:px-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words">
          {experienceLevel ? (
            <>Best templates for <span className="text-blue-600">{getExperienceLevelText()}</span> of experience</>
          ) : (
            'Choose Your Resume Template'
          )}
        </h2>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg">
          {experienceLevel 
            ? 'Templates tailored to your experience level. You can always change your template later.'
            : 'Select an experience level first to see recommended templates. You can always change your template later.'}
        </p>
      </div>

      {/* Main Content Area - Templates */}
      <div className="w-full max-w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-6 xl:gap-7 w-full auto-rows-fr">
          {sortedTemplates.map((template, index) => {
              const isRecommended = recommendedTemplates.includes(template.id);
              const isSelected = selectedTemplate === template.id;

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex flex-col w-full min-w-0 max-w-full"
                >
                  <Card
                    className={cn(
                      'transition-all duration-300 hover:shadow-xl border-2 group overflow-hidden flex flex-col h-full w-full max-w-full',
                      'min-h-[500px] sm:min-h-[520px] md:min-h-[540px] lg:min-h-[560px] xl:min-h-[580px] 2xl:min-h-[600px]',
                      isSelected
                        ? 'border-blue-600 shadow-lg ring-2 ring-blue-200 ring-offset-2'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    )}
                  >
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Template Header - Recommended Badge & Selection */}
                      <div className="flex items-center justify-between px-3 sm:px-4 md:px-4 lg:px-5 pt-3 sm:pt-4 lg:pt-4 xl:pt-5 pb-2 bg-white border-b border-gray-100">
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
                      <div className="bg-white w-full overflow-hidden flex-1 flex items-center justify-center min-h-0 py-3 sm:py-4 lg:py-4 xl:py-5 border-b border-gray-100 max-w-full">
                        <TemplatePreview
                          template={template.id}
                          data={sampleResumeData}
                          colorScheme={selectedColor}
                          isRecommended={isRecommended}
                        />
                      </div>

                      {/* Template Info */}
                      <div className="p-3 sm:p-4 md:p-4 lg:p-4 xl:p-5 bg-white flex-shrink-0 flex flex-col space-y-2 sm:space-y-3">
                        <div>
                          <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg lg:text-xl xl:text-xl">{template.name}</h3>
                          <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">{template.description}</p>
                        </div>

                        {/* Color Swatches */}
                        <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-3 flex-wrap">
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
                                'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 rounded-full border-2 transition-all hover:scale-110',
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

                        {/* Choose Template Button */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTemplateSelect(template.id as TemplateStyle);
                          }}
                          className={cn(
                            'w-full mt-2 py-3 sm:py-4 lg:py-4 xl:py-5 text-xs sm:text-sm lg:text-sm xl:text-base font-semibold shadow-sm',
                            isSelected
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          )}
                          variant="default"
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-2" />
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
  );
}
