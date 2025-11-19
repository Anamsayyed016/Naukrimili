'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Check, GraduationCap, Briefcase, BookOpen, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeType {
  id: string;
  title: string;
  icon: string;
  description: string;
  fields: string[];
}

interface ResumeTypeCardProps {
  type: ResumeType;
  isSelected: boolean;
  onSelect: (typeId: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  GraduationCap,
  Briefcase,
  BookOpen,
  Award,
};

export default function ResumeTypeCard({ type, isSelected, onSelect }: ResumeTypeCardProps) {
  const Icon = iconMap[type.icon] || Briefcase;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-lg relative",
        isSelected 
          ? "ring-2 ring-blue-600 shadow-lg bg-blue-50 border-blue-600" 
          : "bg-white border-gray-200"
      )}
      onClick={() => onSelect(type.id)}
    >
      <CardContent className="p-6">
        {/* Checkmark in top-right corner when selected */}
        {isSelected && (
          <div className="absolute top-4 right-4">
            <Check className="w-5 h-5 text-blue-600" />
          </div>
        )}

        <div className="flex items-start gap-4">
          {/* Icon - Blue square with white icon when selected, grey when not */}
          <div
            className={cn(
              "p-3 rounded-lg flex-shrink-0 w-12 h-12 flex items-center justify-center",
              isSelected
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            )}
          >
            <Icon className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-lg mb-2",
              isSelected ? "text-gray-900" : "text-gray-900"
            )}>
              {type.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{type.description}</p>

            {/* Fields Preview */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Includes:</p>
              <div className="flex flex-wrap gap-1.5">
                {type.fields.slice(0, 4).map((field, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full",
                      isSelected
                        ? "bg-gray-200 text-gray-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {field}
                  </span>
                ))}
                {type.fields.length > 4 && (
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full",
                    isSelected
                      ? "bg-gray-200 text-gray-700"
                      : "bg-gray-100 text-gray-700"
                  )}>
                    +{type.fields.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

