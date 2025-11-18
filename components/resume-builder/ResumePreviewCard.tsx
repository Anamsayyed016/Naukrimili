'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';

interface ResumePreviewCardProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export default function ResumePreviewCard({ 
  variant = 'default',
  className 
}: ResumePreviewCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden shadow-2xl border-2 border-gray-200",
        "bg-white",
        variant === 'compact' ? "w-full max-w-xs" : "w-full max-w-sm md:max-w-md",
        className
      )}
    >
      <CardContent className="p-0">
        {/* Resume Preview Mockup */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 md:p-8">
          {/* Header Section */}
          <div className="mb-6">
            <div className="h-2 w-20 bg-blue-600 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-800 rounded"></div>
              <div className="h-3 w-24 bg-gray-600 rounded"></div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-4">
            {/* Section 1 */}
            <div>
              <div className="h-2 w-16 bg-blue-600 rounded mb-2"></div>
              <div className="space-y-1.5">
                <div className="h-2.5 w-full bg-gray-300 rounded"></div>
                <div className="h-2.5 w-5/6 bg-gray-300 rounded"></div>
                <div className="h-2.5 w-4/6 bg-gray-300 rounded"></div>
              </div>
            </div>

            {/* Section 2 */}
            <div>
              <div className="h-2 w-16 bg-blue-600 rounded mb-2"></div>
              <div className="space-y-1.5">
                <div className="h-2.5 w-full bg-gray-300 rounded"></div>
                <div className="h-2.5 w-5/6 bg-gray-300 rounded"></div>
              </div>
            </div>

            {/* Skills Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="h-5 w-16 bg-blue-100 rounded-full"></div>
              <div className="h-5 w-20 bg-blue-100 rounded-full"></div>
              <div className="h-5 w-18 bg-blue-100 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Footer Badge */}
        <div className="absolute bottom-4 right-4 bg-white rounded-full p-2 shadow-lg border border-gray-200">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  );
}

