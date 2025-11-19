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
        "cursor-pointer transition-all duration-300 hover:shadow-lg",
        isSelected && "ring-2 ring-blue-600 shadow-lg bg-blue-50/50"
      )}
      onClick={() => onSelect(type.id)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              "p-3 rounded-lg flex-shrink-0",
              isSelected
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            )}
          >
            <Icon className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-lg">{type.title}</h3>
              {isSelected && (
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">{type.description}</p>

            {/* Fields Preview */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Includes:</p>
              <div className="flex flex-wrap gap-1.5">
                {type.fields.slice(0, 4).map((field, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                  >
                    {field}
                  </span>
                ))}
                {type.fields.length > 4 && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
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

