import React from 'react';
import { HiringMetrics } from './HiringMetrics';
import { SourceChart } from './SourceChart';

export default function HiringAnalytics() {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold text-company-700 mb-4">Hiring Analytics</h2>
      <HiringMetrics />
      <SourceChart />
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-company-700 mb-2">Cost-per-Hire Calculator</h3>
        <div className="bg-company-50 border border-company-100 rounded p-4 text-company-400">[CostPerHireCalculator Placeholder]</div>
      </div>
    </div>
  );
} 