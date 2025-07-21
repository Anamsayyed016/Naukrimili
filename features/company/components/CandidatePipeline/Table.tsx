import React from 'react';
import type { Candidate } from '../../types/candidates.d';

interface Props {
  candidates: Candidate[];
  onBulkAction?: (ids: string[], action: string) => void;
}

export function CandidateTable({ candidates, onBulkAction }: Props) {
  return (
    <table className="w-full bg-white rounded-xl shadow text-company-700">
      <thead>
        <tr>
          <th className="p-2"><input type="checkbox" /></th>
          <th className="p-2 text-left">Name</th>
          <th className="p-2 text-left">Resume Score</th>
          <th className="p-2 text-left">Status</th>
          <th className="p-2 text-left">Applied</th>
          <th className="p-2 text-left">Notes</th>
        </tr>
      </thead>
      <tbody>
        {candidates.map((c) => (
          <tr key={c.id} className="border-t border-company-100">
            <td className="p-2"><input type="checkbox" /></td>
            <td className="p-2">{c.name}</td>
            <td className="p-2">{c.resumeScore}</td>
            <td className="p-2 capitalize">{c.status}</td>
            <td className="p-2">{c.appliedDate.toLocaleDateString()}</td>
            <td className="p-2 text-company-400">[Notes]</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
} 