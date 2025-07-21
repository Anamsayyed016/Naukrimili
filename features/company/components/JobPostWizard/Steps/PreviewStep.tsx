import { useFormContext } from 'react-hook-form';
import type { JobPostForm } from '../../../types/jobs.d';

export function PreviewStep() {
  const { getValues } = useFormContext<JobPostForm>();
  const values = getValues();

  return (
    <div className="space-y-4 p-4 bg-company-50 border border-company-200 rounded">
      <h2 className="text-lg font-bold text-company-700 mb-2">Preview Job Post</h2>
      <div>
        <strong>Title:</strong> {values.title}
      </div>
      <div>
        <strong>Remote Policy:</strong> {values.remotePolicy}
      </div>
      <div>
        <strong>Salary Range:</strong> {values.salaryRange?.[0]} - {values.salaryRange?.[1]}
      </div>
      <div>
        <strong>Skills:</strong> {values.skills?.join(', ')}
      </div>
      <div>
        <strong>Description:</strong>
        <div className="whitespace-pre-line mt-1">{values.description}</div>
      </div>
    </div>
  );
} 