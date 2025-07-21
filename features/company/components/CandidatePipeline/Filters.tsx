import React from 'react';

export function CandidatePipelineFilters() {
  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {/* Status Filter */}
      <select className="border border-company-200 rounded px-3 py-2 text-company-700">
        <option value="">All Statuses</option>
        <option value="new">New</option>
        <option value="reviewed">Reviewed</option>
        <option value="interview">Interview</option>
        <option value="hired">Hired</option>
        <option value="rejected">Rejected</option>
      </select>
      {/* Skills Filter (placeholder) */}
      <div className="bg-company-50 border border-company-200 rounded px-3 py-2 text-company-400">[SkillsFilter]</div>
      {/* Experience Filter (placeholder) */}
      <div className="bg-company-50 border border-company-200 rounded px-3 py-2 text-company-400">[ExperienceFilter]</div>
    </div>
  );
} 