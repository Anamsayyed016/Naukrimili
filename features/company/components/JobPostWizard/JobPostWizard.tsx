import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { JobPostForm } from '../../types/jobs.d';
import { DetailsForm } from './Steps/DetailsForm';
import { RequirementsForm } from './Steps/RequirementsForm';
import { PreviewStep } from './Steps/PreviewStep';

const jobPostSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  remotePolicy: z.enum(['remote', 'hybrid', 'onsite']),
  salaryRange: z.tuple([z.number(), z.number()]),
  skills: z.array(z.string()).min(1),
});

const steps = [
  { label: 'Details', component: DetailsForm },
  { label: 'Requirements', component: RequirementsForm },
  { label: 'Preview', component: PreviewStep },
];

export default function JobPostWizard() {
  const [step, setStep] = useState(0);
  const methods = useForm<JobPostForm>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: {
      title: '',
      description: '',
      remotePolicy: undefined,
      salaryRange: [0, 0],
      skills: [],
    },
    mode: 'onTouched',
  });

  const CurrentStep = steps[step].component;

  const onNext = async () => {
    const valid = await methods.trigger();
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const onBack = () => setStep((s) => Math.max(s - 1, 0));
  const onSubmit = methods.handleSubmit((data) => {
    // TODO: handle job post submission
    alert('Job posted! ' + JSON.stringify(data, null, 2));
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 space-y-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, i) => (
            <div key={s.label} className="flex-1 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${i === step ? 'bg-company-500' : 'bg-company-200'}`}>{i + 1}</div>
              <span className={`mt-2 text-xs font-medium ${i === step ? 'text-company-700' : 'text-company-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>
        {/* Step Content */}
        <CurrentStep />
        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={onBack}
            disabled={step === 0}
            className="px-4 py-2 rounded bg-company-100 text-company-600 disabled:opacity-50"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={onNext}
              className="px-4 py-2 rounded bg-company-500 text-white"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 rounded bg-company-500 text-white"
            >
              Submit
            </button>
          )}
        </div>
      </form>
    </FormProvider>
  );
} 