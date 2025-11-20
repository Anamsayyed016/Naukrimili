'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { Template } from '@/lib/resume-builder/template-loader';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export default function TemplateCard({
  template,
  isSelected,
  onSelect,
}: TemplateCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-xl border-2",
        isSelected
          ? "border-blue-600 shadow-lg"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      <CardContent className="p-0">
        {/* Thumbnail Preview */}
        <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {!imageError && template.thumbnail ? (
            <Image
              src={template.thumbnail}
              alt={template.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : !imageError && template.preview ? (
            <Image
              src={template.preview}
              alt={template.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500">{template.name}</p>
              </div>
            </div>
          )}
          
          {/* Recommended Badge */}
          {template.recommended && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                ★ Recommended
              </Badge>
            </div>
          )}

          {/* Selected Indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2">
              <div className="bg-blue-600 rounded-full p-1.5">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          )}

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        </div>

        {/* Template Info */}
        <div className="p-4 space-y-3">
          {/* Title and Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
            <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
          </div>

          {/* Tags/Categories */}
          <div className="flex flex-wrap gap-1.5">
            {template.categories?.slice(0, 3).map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="text-xs px-2 py-0.5"
              >
                {category}
              </Badge>
            ))}
            {template.layout && (
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5"
              >
                {template.layout}
              </Badge>
            )}
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => onSelect(template.id)}
            className={cn(
              "w-full",
              isSelected
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800"
            )}
            size="sm"
          >
            {isSelected ? 'Selected' : 'Use This Template'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

