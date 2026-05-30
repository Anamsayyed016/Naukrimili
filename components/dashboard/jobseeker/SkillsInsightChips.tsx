'use client';

import { Badge } from '@/components/ui/badge';

interface SkillsInsightChipsProps {
  skills: string[];
}

export default function SkillsInsightChips({ skills }: SkillsInsightChipsProps) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Skills Insights</h2>
      <p className="mt-1 text-sm text-slate-500">Extracted from your resume</p>

      {skills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.slice(0, 24).map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {skill}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
          Upload a resume to see your skills here.
        </div>
      )}
    </section>
  );
}
