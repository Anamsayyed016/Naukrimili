'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Step = 'template' | 'experience' | 'form' | 'preview' | 'download';

interface StepFlowProps {
  currentStep: Step;
  onStepChange: (step: Step) => void;
  steps: Array<{ id: Step; label: string; description: string }>;
  children: React.ReactNode;
  canGoNext?: boolean;
  canGoBack?: boolean;
}

export default function StepFlow({
  currentStep,
  onStepChange,
  steps,
  children,
  canGoNext = true,
  canGoBack = true,
}: StepFlowProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  const prevStep = currentIndex > 0 ? steps[currentIndex - 1] : null;

  const handleNext = () => {
    if (nextStep && canGoNext) {
      onStepChange(nextStep.id);
    }
  };

  const handleBack = () => {
    if (prevStep && canGoBack) {
      onStepChange(prevStep.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between overflow-x-auto pb-4">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;
          
          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => onStepChange(step.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                  isActive && 'bg-blue-50 text-blue-600 font-medium',
                  isCompleted && !isActive && 'text-green-600',
                  !isActive && !isCompleted && 'text-gray-400 hover:text-gray-600'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                    isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  )}>
                    {index + 1}
                  </div>
                )}
                <span className="hidden sm:inline text-sm">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn(
                  'h-0.5 flex-1 mx-2',
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="w-full overflow-visible">
        <CardContent className="p-4 sm:p-5 md:p-6 lg:p-4 xl:p-6 w-full">
          {children}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={!prevStep || !canGoBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="text-sm text-gray-500">
          Step {currentIndex + 1} of {steps.length}
        </div>

        <Button
          onClick={handleNext}
          disabled={!nextStep || !canGoNext}
          className="flex items-center gap-2"
        >
          {nextStep ? nextStep.label : 'Complete'}
          {nextStep && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

