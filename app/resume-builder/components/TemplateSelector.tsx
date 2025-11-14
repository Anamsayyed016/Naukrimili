'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TEMPLATE_OPTIONS } from '../utils/constants';
import { TemplateStyle } from '../types';
import { motion } from 'framer-motion';

interface TemplateSelectorProps {
  selectedTemplate: TemplateStyle;
  onTemplateSelect: (template: TemplateStyle) => void;
}

export default function TemplateSelector({ selectedTemplate, onTemplateSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Templates we recommend for you</h2>
        <p className="text-gray-600 text-lg">You can always change your template later</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATE_OPTIONS.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={cn(
                'cursor-pointer transition-all duration-300 hover:shadow-2xl border-2 group overflow-hidden',
                selectedTemplate === template.id
                  ? 'border-blue-600 shadow-xl ring-2 ring-blue-200 ring-offset-2'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
              )}
              onClick={() => onTemplateSelect(template.id as TemplateStyle)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                  {/* Modern Template Preview */}
                  <div className="w-full h-full flex items-center justify-center bg-white">
                    <div className="text-center p-6">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <span className="text-3xl font-bold text-white">{template.name.charAt(0)}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">{template.name}</div>
                    </div>
                  </div>
                  
                  {/* Selection Indicator */}
                  {selectedTemplate === template.id && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-200">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-300" />
                </div>
                
                <div className="p-5 bg-white">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{template.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

