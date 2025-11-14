'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXPERIENCE_LEVELS, ExperienceLevel } from '../utils/constants';

interface ExperienceLevelSelectorProps {
  selectedLevel: ExperienceLevel;
  onLevelSelect: (level: ExperienceLevel) => void;
}

export default function ExperienceLevelSelector({ selectedLevel, onLevelSelect }: ExperienceLevelSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Experience Level</h2>
        <p className="text-gray-600">This helps us tailor your resume for the right opportunities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPERIENCE_LEVELS.map((level) => (
          <Card
            key={level.value}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg border-2',
              selectedLevel === level.value
                ? 'border-blue-600 shadow-md bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
            onClick={() => onLevelSelect(level.value as ExperienceLevel)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{level.label}</h3>
                  <p className="text-sm text-gray-600">{level.description}</p>
                </div>
                {selectedLevel === level.value && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

