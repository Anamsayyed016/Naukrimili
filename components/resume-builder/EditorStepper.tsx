'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EditorStep = 'personal' | 'experience' | 'skills' | 'education' | 'summary' | 'additional';

interface EditorStepperProps {
  currentStep: EditorStep;
  completedSteps: EditorStep[];
  onStepClick: (step: EditorStep) => void;
}

const steps: { id: EditorStep; label: string; number: number }[] = [
  { id: 'personal', label: 'Personal Info', number: 1 },
  { id: 'experience', label: 'Experience', number: 2 },
  { id: 'skills', label: 'Skills', number: 3 },
  { id: 'education', label: 'Education', number: 4 },
  { id: 'summary', label: 'Summary', number: 5 },
  { id: 'additional', label: 'Additional', number: 6 },
];

export default function EditorStepper({
  currentStep,
  completedSteps,
  onStepClick,
}: EditorStepperProps) {
  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.includes(step.id);
        const isClickable = isActive || isCompleted || completedSteps.length >= step.number - 1;

        return (
          <button
            key={step.id}
            onClick={() => isClickable && onStepClick(step.id)}
            disabled={!isClickable}
            className={cn(
              "w-full text-left px-4 py-3 rounded-lg transition-all",
              "flex items-center gap-3",
              isActive
                ? "bg-blue-50 border-2 border-blue-600 text-blue-900 font-medium"
                : isCompleted
                ? "bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100 cursor-pointer"
                : isClickable
                ? "bg-gray-50 border-2 border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer"
                : "bg-gray-50 border-2 border-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                isActive
                  ? "bg-blue-600 text-white"
                  : isCompleted
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-600"
              )}
            >
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                step.number
              )}
            </div>
            <span className="flex-1">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}

