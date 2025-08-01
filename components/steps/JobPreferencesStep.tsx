import React from 'react';

interface JobPreferencesStepProps {
  data: {
    jobTypes: string[];
    salaryRange: { min: number; max: number };
    remoteWork: boolean;
    travelWillingness: boolean;
  };
  onUpdate: (updates: Partial<JobPreferencesStepProps['data']>) => void;
}

export function JobPreferencesStep({ data, onUpdate }: JobPreferencesStepProps) {
  const jobTypeOptions = [
    'Full-time',
    'Part-time',
    'Contract',
    'Freelance',
    'Internship',
    'Remote'
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">🎯 Job Preferences</h2>
      
      <div>
        <label className="block text-white text-sm font-medium mb-2">Job Types</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {jobTypeOptions.map((type) => (
            <label
              key={type}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                data.jobTypes.includes(type)
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-purple-300 hover:bg-white/20'
              }`}
            >
              <input
                type="checkbox"
                checked={data.jobTypes.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onUpdate({ jobTypes: [...data.jobTypes, type] });
                  } else {
                    onUpdate({
                      jobTypes: data.jobTypes.filter((t) => t !== type)
                    });
                  }
                }}
                className="sr-only"
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <label className="block text-white text-sm font-medium">Salary Range</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-purple-300 text-xs mb-1">Minimum</label>
            <input
              type="number"
              value={data.salaryRange.min}
              onChange={(e) => onUpdate({
                salaryRange: { ...data.salaryRange, min: parseInt(e.target.value) || 0 }
              })}
              min="0"
              step="1000"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-purple-300 text-xs mb-1">Maximum</label>
            <input
              type="number"
              value={data.salaryRange.max}
              onChange={(e) => onUpdate({
                salaryRange: { ...data.salaryRange, max: parseInt(e.target.value) || 0 }
              })}
              min={data.salaryRange.min}
              step="1000"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={data.remoteWork}
              onChange={(e) => onUpdate({ remoteWork: e.target.checked })}
              className="rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-white">Open to Remote Work</span>
          </label>
        </div>
        
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={data.travelWillingness}
              onChange={(e) => onUpdate({ travelWillingness: e.target.checked })}
              className="rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-white">Willing to Travel</span>
          </label>
        </div>
      </div>
    </div>
  );
}
