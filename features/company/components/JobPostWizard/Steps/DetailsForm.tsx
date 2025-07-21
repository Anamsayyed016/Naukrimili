import { useFormContext } from 'react-hook-form';
import type { JobPostForm } from '../../../types/jobs.d';

export function DetailsForm() {
  const { register, watch, setValue } = useFormContext<JobPostForm>();

  // Placeholder options
  const REMOTE_OPTIONS = [
    { label: 'Remote', value: 'remote' },
    { label: 'Hybrid', value: 'hybrid' },
    { label: 'Onsite', value: 'onsite' },
  ];

  return (
    <div className="space-y-6">
      <label className="block text-sm font-medium text-company-700">Job Title*</label>
      <input
        className="w-full border border-company-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-company-500"
        {...register('title', { required: true })}
        placeholder="Senior Frontend Developer"
      />
      <label className="block text-sm font-medium text-company-700">Remote Policy*</label>
      <select
        className="w-full border border-company-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-company-500"
        {...register('remotePolicy', { required: true })}
      >
        <option value="">Select...</option>
        {REMOTE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {/* Placeholder for SalaryRangeSlider */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-company-700 mb-1">Salary Range</label>
        <div className="bg-company-50 border border-company-200 rounded p-4 text-company-400">[SalaryRangeSlider Component]</div>
      </div>
    </div>
  );
} 