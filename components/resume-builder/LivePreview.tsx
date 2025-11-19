'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Grid3x3, ZoomIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TemplateRenderer from './TemplateRenderer';
import { cn } from '@/lib/utils';

interface LivePreviewProps {
  templateId: string;
  formData: Record<string, any>;
  selectedColorId?: string;
  resumeScore?: number;
  className?: string;
}

export default function LivePreview({
  templateId,
  formData,
  selectedColorId,
  resumeScore = 0,
  className,
}: LivePreviewProps) {
  const router = useRouter();
  const [isZoomed, setIsZoomed] = useState(false);

  const handleChangeTemplate = () => {
    router.push(`/resume-builder/templates?returnTo=editor&template=${templateId}`);
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-lg border border-gray-200', className)}>
      {/* Preview Header */}
      <div className="flex items-center justify-end p-4 border-b border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={handleChangeTemplate}
          className="flex items-center gap-2"
        >
          <Grid3x3 className="w-4 h-4" />
          Change Template
        </Button>
      </div>

      {/* Preview Content */}
      <div className="relative p-4 bg-gray-50">
        <div
          className={cn(
            'transition-all duration-300',
            isZoomed ? 'scale-150 origin-top-left' : 'scale-100'
          )}
        >
          <TemplateRenderer
            templateId={templateId}
            formData={formData}
            selectedColorId={selectedColorId}
            className="min-h-[600px] bg-white rounded shadow-sm"
          />
        </div>

        {/* Zoom Control */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute bottom-4 right-4 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full shadow-lg"
          title={isZoomed ? 'Zoom Out' : 'Zoom In'}
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
      </div>

    </div>
  );
}

