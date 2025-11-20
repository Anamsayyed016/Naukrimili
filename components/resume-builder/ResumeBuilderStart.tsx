'use client';

import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/components/ui/use-mobile';
import ResumePreviewCard from './ResumePreviewCard';
import ResumeStartFeatures from './ResumeStartFeatures';
import { cn } from '@/lib/utils';

export default function ResumeBuilderStart() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();

  const handleCreateNew = () => {
    // Navigate to template selection page
    router.push('/resume-builder/templates');
  };

  const handleImport = () => {
    // Placeholder - will navigate to resume import flow
    router.push('/resumes/upload');
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className={cn(
        "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50",
        "rounded-2xl p-6 md:p-8 lg:p-12",
        "shadow-lg"
      )}>
        <div className={cn(
          "grid gap-8 lg:gap-12",
          isMobile ? "grid-cols-1" : isTablet ? "grid-cols-[60%_40%]" : "grid-cols-[55%_45%]"
        )}>
          {/* Left Column - Content */}
          <div className="flex flex-col justify-center space-y-6 md:space-y-8">
            {/* Headline */}
            <div className="space-y-4">
              <h1 className={cn(
                "font-bold text-gray-900 leading-tight",
                "text-4xl md:text-5xl lg:text-6xl"
              )}>
                Create Your Perfect Resume
              </h1>
              <p className={cn(
                "text-gray-600",
                "text-base md:text-lg lg:text-xl",
                "max-w-2xl"
              )}>
                Build a professional, ATS-optimized resume in minutes with our AI-powered resume builder.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className={cn(
              "flex flex-col sm:flex-row gap-4",
              isMobile && "w-full"
            )}>
              <Button
                onClick={handleCreateNew}
                size="lg"
                className={cn(
                  "bg-gradient-to-r from-blue-600 to-purple-700",
                  "hover:from-blue-700 hover:to-purple-800",
                  "text-white font-semibold",
                  "shadow-lg hover:shadow-xl",
                  "transition-all duration-300",
                  "h-12 md:h-14",
                  "text-base md:text-lg",
                  "px-6 md:px-8",
                  isMobile && "w-full"
                )}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Resume
              </Button>
              
              <Button
                onClick={handleImport}
                size="lg"
                variant="outline"
                className={cn(
                  "bg-white border-2 border-gray-300",
                  "hover:bg-gray-50 hover:border-gray-400",
                  "text-gray-700 font-semibold",
                  "shadow-md hover:shadow-lg",
                  "transition-all duration-300",
                  "h-12 md:h-14",
                  "text-base md:text-lg",
                  "px-6 md:px-8",
                  isMobile && "w-full"
                )}
              >
                <Upload className="w-5 h-5 mr-2" />
                Import Resume
              </Button>
            </div>

            {/* Features - Mobile: Below buttons, Desktop: Below content */}
            {isMobile && (
              <div className="pt-4">
                <ResumeStartFeatures />
              </div>
            )}
          </div>

          {/* Right Column - Preview Card */}
          <div className={cn(
            "flex items-center justify-center",
            isMobile && "order-first" // Show preview first on mobile
          )}>
            <ResumePreviewCard 
              variant={isMobile ? 'compact' : 'default'}
              className="w-full"
            />
          </div>
        </div>

        {/* Features - Desktop: Below hero */}
        {!isMobile && (
          <div className="mt-8 lg:mt-12">
            <ResumeStartFeatures />
          </div>
        )}
      </div>
    </div>
  );
}

