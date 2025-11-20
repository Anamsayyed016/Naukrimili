'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import templatesData from '@/lib/resume-builder/templates.json';
import type { Template, ColorVariant } from '@/lib/resume-builder/template-loader';
import ColorPicker from './ColorPicker';
import LivePreview from './LivePreview';

interface ChangeTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplateId: string;
  currentColorId: string;
  formData: Record<string, any>;
  onTemplateChange: (templateId: string, colorId: string) => void;
}

export default function ChangeTemplateModal({
  open,
  onOpenChange,
  currentTemplateId,
  currentColorId,
  formData,
  onTemplateChange,
}: ChangeTemplateModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(currentTemplateId);
  const [selectedColorId, setSelectedColorId] = useState<string>(currentColorId);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const templates = useMemo(() => {
    return (templatesData.templates || []) as Template[];
  }, []);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [selectedTemplateId, templates]);

  // Reset selections when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTemplateId(currentTemplateId);
      setSelectedColorId(currentColorId);
    }
  }, [open, currentTemplateId, currentColorId]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // Set to default color of new template, or first color if default not found
      const defaultColor = template.colors.find((c) => c.id === template.defaultColor) || template.colors[0];
      setSelectedColorId(defaultColor?.id || template.colors[0]?.id || '');
    }
  };

  const handleColorSelect = (colorId: string) => {
    setSelectedColorId(colorId);
  };

  const handleApply = () => {
    onTemplateChange(selectedTemplateId, selectedColorId);
    onOpenChange(false);
  };

  const handleImageError = (templateId: string) => {
    setImageErrors((prev) => ({ ...prev, [templateId]: true }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Change Template</DialogTitle>
          <DialogDescription>
            Select a new template and color scheme. Your resume data will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 p-6">
          {/* Left Side - Template Selection */}
          <div className="flex flex-col space-y-6 overflow-hidden">
            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto pr-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Select Template</h3>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => {
                  const isSelected = template.id === selectedTemplateId;
                  const hasImageError = imageErrors[template.id];

                  return (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={cn(
                        "relative group rounded-lg overflow-hidden border-2 transition-all",
                        "hover:shadow-md",
                        isSelected
                          ? "border-blue-600 shadow-md ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100">
                        {!hasImageError && template.thumbnail ? (
                          <Image
                            src={template.thumbnail}
                            alt={template.name}
                            fill
                            className="object-cover"
                            onError={() => handleImageError(template.id)}
                            unoptimized
                          />
                        ) : !hasImageError && template.preview ? (
                          <Image
                            src={template.preview}
                            alt={template.name}
                            fill
                            className="object-cover"
                            onError={() => handleImageError(template.id)}
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                            <div className="text-center p-2">
                              <div className="w-8 h-8 mx-auto mb-1 bg-blue-100 rounded flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-blue-600" />
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2">{template.name}</p>
                            </div>
                          </div>
                        )}

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-1 right-1">
                            <div className="bg-blue-600 rounded-full p-1">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Recommended Badge */}
                        {template.recommended && (
                          <div className="absolute top-1 left-1">
                            <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 text-[10px] px-1.5 py-0">
                              ★
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Template Name */}
                      <div className="p-2 bg-white border-t">
                        <p className="text-xs font-medium text-gray-900 line-clamp-1">
                          {template.name}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            {selectedTemplate && selectedTemplate.colors && selectedTemplate.colors.length > 0 && (
              <div className="border-t pt-4">
                <ColorPicker
                  colors={selectedTemplate.colors}
                  selectedColorId={selectedColorId}
                  onColorChange={handleColorSelect}
                />
              </div>
            )}
          </div>

          {/* Right Side - Live Preview */}
          <div className="flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Preview</h3>
              <Badge variant="secondary" className="text-xs">
                {selectedTemplate.name}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              <LivePreview
                templateId={selectedTemplateId}
                formData={formData}
                selectedColorId={selectedColorId}
                className="min-h-[600px]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Apply Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

