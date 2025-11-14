'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TEMPLATE_OPTIONS } from '../utils/constants';
import { TemplateStyle } from '../types';
import Image from 'next/image';

interface TemplateSelectorProps {
  selectedTemplate: TemplateStyle;
  onTemplateSelect: (template: TemplateStyle) => void;
}

export default function TemplateSelector({ selectedTemplate, onTemplateSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Template</h2>
        <p className="text-gray-600">Select a professional template that matches your style</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATE_OPTIONS.map((template) => (
          <Card
            key={template.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg border-2',
              selectedTemplate === template.id
                ? 'border-blue-600 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            )}
            onClick={() => onTemplateSelect(template.id as TemplateStyle)}
          >
            <CardContent className="p-4">
              <div className="relative aspect-[3/4] bg-gray-50 rounded-lg mb-4 overflow-hidden">
                {/* Template Preview Placeholder */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl font-bold mb-2">{template.name.charAt(0)}</div>
                    <div className="text-sm">{template.name}</div>
                  </div>
                </div>
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

