import React, { useState } from 'react';
import { CandidatePipelineFilters } from './Filters';
import { CandidateTable } from './Table';
import type { Candidate } from '../../types/candidates.d';

const mockCandidates: Candidate[] = [
  { id: '1', name: 'Alice Smith', resumeScore: 92, status: 'new', appliedDate: new Date() },
  { id: '2', name: 'Bob Lee', resumeScore: 85, status: 'reviewed', appliedDate: new Date() },
  { id: '3', name: 'Carol Jones', resumeScore: 78, status: 'interview', appliedDate: new Date() },
];

export default function CandidatePipeline() {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  // TODO: Add filter and bulk action logic

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold text-company-700 mb-4">Candidate Pipeline</h2>
      <CandidatePipelineFilters />
      <div className="mb-4 flex gap-2">
        <button className="bg-company-100 text-company-600 px-3 py-1 rounded">Shortlist</button>
        <button className="bg-company-100 text-company-600 px-3 py-1 rounded">Reject</button>
      </div>
      <CandidateTable candidates={candidates} />
    </div>
  );
} 