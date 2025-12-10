'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, CheckCircle2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Smart suggestions',
    color: 'bg-purple-100 text-purple-700 border-purple-200'
  },
  {
    icon: CheckCircle2,
    title: 'ATS Optimized',
    description: 'Passes screening',
    color: 'bg-green-100 text-green-700 border-green-200'
  },
  {
    icon: Palette,
    title: 'Professional',
    description: 'Multiple templates',
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  }
];

export default function ResumeStartFeatures() {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card
              key={index}
              className={cn(
                "border-2 transition-all duration-300 hover:shadow-md hover:scale-105",
                feature.color
              )}
            >
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={cn(
                    "p-1.5 md:p-2 rounded-lg",
                    feature.color.includes('purple') && "bg-purple-200",
                    feature.color.includes('green') && "bg-green-200",
                    feature.color.includes('blue') && "bg-blue-200"
                  )}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-semibold leading-tight">
                      {feature.title}
                    </span>
                    <span className="text-xs text-gray-600 leading-tight">
                      {feature.description}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

