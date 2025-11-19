'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Template {
  id: string;
  name: string;
  categories: string[];
  layout: string;
  color: string;
  previewImage: string;
  recommended: boolean;
  description: string;
}

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export default function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 cursor-pointer group",
        "hover:shadow-xl hover:scale-[1.02]",
        isSelected && "ring-2 ring-blue-600 shadow-lg"
      )}
      onClick={() => onSelect(template.id)}
    >
      <CardContent className="p-0">
        {/* Preview Image */}
        <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden">
          {/* Placeholder for template preview - replace with actual image */}
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: template.color + '20' }}
          >
            <div className="text-center p-4">
              <div 
                className="w-16 h-16 mx-auto mb-2 rounded"
                style={{ backgroundColor: template.color }}
              />
              <p className="text-xs text-gray-600 font-medium">{template.name}</p>
            </div>
          </div>
          
          {/* Recommended Badge */}
          {template.recommended && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Recommended
              </Badge>
            </div>
          )}

          {/* Selected Overlay */}
          {isSelected && (
            <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
              <div className="bg-blue-600 text-white rounded-full p-2">
                <Check className="w-6 h-6" />
              </div>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>

        {/* Template Info */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            {isSelected && (
              <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
          
          {/* Categories */}
          <div className="flex flex-wrap gap-1 pt-1">
            {template.categories.slice(0, 2).map((cat) => (
              <Badge key={cat} variant="outline" className="text-xs">
                {cat}
              </Badge>
            ))}
            {template.categories.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{template.categories.length - 2}
              </Badge>
            )}
          </div>

          {/* Choose Button */}
          <Button
            className={cn(
              "w-full mt-3",
              isSelected && "bg-blue-600 hover:bg-blue-700"
            )}
            variant={isSelected ? "default" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(template.id);
            }}
          >
            {isSelected ? 'Selected' : 'Choose Template'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

