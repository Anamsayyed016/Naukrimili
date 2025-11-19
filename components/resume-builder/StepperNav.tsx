'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Step = 'contacts' | 'experience' | 'education' | 'skills' | 'summary' | 'finalize';

interface StepperNavProps {
  currentStep: Step;
  completedSteps: Step[];
  onStepClick?: (step: Step) => void;
  className?: string;
}

const steps: { id: Step; label: string; number: number }[] = [
  { id: 'contacts', label: 'Contacts', number: 1 },
  { id: 'experience', label: 'Experience', number: 2 },
  { id: 'education', label: 'Education', number: 3 },
  { id: 'skills', label: 'Skills', number: 4 },
  { id: 'summary', label: 'Summary', number: 5 },
  { id: 'finalize', label: 'Finalize', number: 6 },
];

export default function StepperNav({
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: StepperNavProps) {
  const getStepStatus = (stepId: Step) => {
    if (completedSteps.includes(stepId)) {
      return 'completed';
    }
    if (currentStep === stepId) {
      return 'active';
    }
    return 'pending';
  };

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn('flex flex-col', className)}>
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const isCompleted = status === 'completed';
        const isActive = status === 'active';
        const isClickable = onStepClick && (isCompleted || index <= currentStepIndex + 1);

        return (
          <div key={step.id} className="relative flex items-start">
            {/* Connector Line - Before step circle */}
            {index > 0 && (
              <div
                className={cn(
                  'absolute left-5 top-0 w-0.5 transition-colors',
                  index <= currentStepIndex || completedSteps.includes(steps[index - 1].id)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                )}
                style={{ height: '2.5rem', marginTop: '-2.5rem' }}
              />
            )}

            {/* Step Content */}
            <div
              className={cn(
                'flex items-center space-x-3 pb-6',
                isClickable && 'cursor-pointer',
                !isClickable && 'opacity-50'
              )}
              onClick={() => isClickable && onStepClick?.(step.id)}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all flex-shrink-0 z-10 relative',
                  isCompleted &&
                    'bg-green-500 border-green-500 text-white',
                  isActive &&
                    'bg-blue-600 border-blue-600 text-white',
                  !isCompleted &&
                    !isActive &&
                    'bg-white border-gray-300 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="flex-1 pt-2">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isActive && 'text-blue-600',
                    isCompleted && 'text-green-600',
                    !isActive && !isCompleted && 'text-gray-500'
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

