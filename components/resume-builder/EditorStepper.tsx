'use client';

import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EditorStep = 'personal' | 'experience' | 'skills' | 'education' | 'summary' | 'additional';

interface EditorStepperProps {
  currentStep: EditorStep;
  completedSteps: EditorStep[];
  onStepClick: (step: EditorStep) => void;
  completeness?: number;
}

export default function EditorStepper({
  currentStep,
  completedSteps,
  onStepClick,
  completeness = 0,
}: EditorStepperProps) {
  // Define steps inside component to avoid module-level initialization issues
  const steps: { id: EditorStep; label: string; number: number; icon?: string }[] = [
    { id: 'personal', label: 'Personal Info', number: 1 },
    { id: 'experience', label: 'Work History', number: 2 },
    { id: 'skills', label: 'Skills', number: 3 },
    { id: 'education', label: 'Education', number: 4 },
    { id: 'summary', label: 'Summary', number: 5 },
    { id: 'additional', label: 'Additional', number: 6 },
  ];
  return (
    <div className="space-y-1">
      {/* Completeness Indicator */}
      {completeness !== undefined && (
        <div className="mb-6 pb-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Resume Completeness
            </span>
            <span className="text-lg font-bold text-gray-900">{completeness}%</span>
          </div>
          <div className="w-full bg-gray-200/50 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-1.5">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isClickable = isActive || isCompleted || completedSteps.length >= step.number - 1;
          const isUpcoming = !isActive && !isCompleted && !isClickable;

          return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200",
                "flex items-center gap-3.5 group",
                "border-2",
                isActive
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500/50 text-blue-900 shadow-md shadow-blue-500/10"
                  : isCompleted
                  ? "bg-white/50 border-green-300/50 text-gray-700 hover:bg-green-50/50 hover:border-green-400/50 cursor-pointer"
                  : isClickable
                  ? "bg-white/30 border-gray-200/50 text-gray-600 hover:bg-white/50 hover:border-gray-300/50 cursor-pointer"
                  : "bg-gray-50/30 border-gray-200/30 text-gray-400 cursor-not-allowed opacity-60"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-200",
                  "shadow-sm",
                  isActive
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                    : isCompleted
                    ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                    : isUpcoming
                    ? "bg-gray-200 text-gray-400"
                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span className={cn(
                "flex-1 font-medium transition-colors",
                isActive && "font-semibold",
                isUpcoming && "opacity-50"
              )}>
                {step.label}
              </span>
              {isActive && (
                <ChevronRight className="w-4 h-4 text-blue-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

