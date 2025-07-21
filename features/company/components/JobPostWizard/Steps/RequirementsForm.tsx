import { useFormContext } from 'react-hook-form';
import type { JobPostForm } from '../../../types/jobs.d';

export function RequirementsForm() {
  const { register, setValue, watch } = useFormContext<JobPostForm>();

  return (
    <div className="space-y-6">
      <label className="block text-sm font-medium text-company-700">Required Skills</label>
      <div className="bg-company-50 border border-company-200 rounded p-4 text-company-400">[SkillsChipsInput Component]</div>
      <label className="block text-sm font-medium text-company-700">Job Description</label>
      <textarea
        className="w-full border border-company-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-company-500"
        rows={6}
        {...register('description', { required: true })}
        placeholder="Describe the job requirements, responsibilities, etc."
      />
      <button type="button" className="mt-2 bg-company-100 text-company-600 px-4 py-2 rounded flex items-center gap-2">
        {/* <MagicWandIcon /> */}
        Generate with AI
      </button>
    </div>
  );
} 