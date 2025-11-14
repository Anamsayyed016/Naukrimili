'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TEMPLATE_OPTIONS, COLOR_SCHEMES } from '../utils/constants';
import { TemplateStyle } from '../types';
import { cn } from '@/lib/utils';

interface CompactTemplateSelectorProps {
  selectedTemplate: TemplateStyle;
  onTemplateSelect: (template: TemplateStyle) => void;
  selectedColorScheme: string;
  onColorSchemeChange: (color: string) => void;
}

export default function CompactTemplateSelector({
  selectedTemplate,
  onTemplateSelect,
  selectedColorScheme,
  onColorSchemeChange,
}: CompactTemplateSelectorProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Template & Style</h3>
        
        <div className="space-y-4">
          {/* Template Selection */}
          <div>
            <Label htmlFor="template-select" className="text-sm font-medium text-gray-700 mb-2 block">
              Resume Template
            </Label>
            <Select
              value={selectedTemplate}
              onValueChange={(value) => onTemplateSelect(value as TemplateStyle)}
            >
              <SelectTrigger id="template-select" className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_OPTIONS.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {TEMPLATE_OPTIONS.find(t => t.id === selectedTemplate)?.description}
            </p>
          </div>

          {/* Color Scheme Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Color Scheme
            </Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_SCHEMES.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onColorSchemeChange(color.value)}
                  className={cn(
                    'w-10 h-10 rounded-full border-2 transition-all hover:scale-110',
                    selectedColorScheme === color.value
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
            <p className="text-xs text-gray-500 mt-1">
              Selected: {COLOR_SCHEMES.find(c => c.value === selectedColorScheme)?.label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

