'use client';

import { Target } from 'lucide-react';

interface CareerInsightsPanelProps {
  titles: string[];
}

export default function CareerInsightsPanel({ titles }: CareerInsightsPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-violet-600" />
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Career Insights</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">You qualify for</p>

      {titles.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {titles.map((title) => (
            <li
              key={title}
              className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-800"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" />
              {title}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
          Career role suggestions appear after your resume is parsed.
        </div>
      )}
    </section>
  );
}
