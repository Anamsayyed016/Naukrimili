'use client';

import SkillsInsightChips from './SkillsInsightChips';
import CareerInsightsPanel from './CareerInsightsPanel';

interface AiInsightsPanelProps {
  skills: string[];
  careerTitles: string[];
  /** When true, omit empty-state hint (hero banner already prompts upload). */
  suppressEmptyHint?: boolean;
}

export default function AiInsightsPanel({
  skills,
  careerTitles,
  suppressEmptyHint = false,
}: AiInsightsPanelProps) {
  const hasSkills = skills.length > 0;
  const hasTitles = careerTitles.length > 0;

  if (!hasSkills && !hasTitles) {
    if (suppressEmptyHint) {
      return null;
    }
    return (
      <section className="mb-5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 px-4 py-3 sm:mb-6 sm:px-5">
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">AI Insights</span>
          {' '}— upload your resume to see skills and role matches.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-violet-50/30 px-4 py-4 ring-1 ring-slate-200/50 sm:mb-6 sm:px-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">AI Insights</p>
      <div
        className={
          hasSkills && hasTitles
            ? 'grid gap-5 sm:grid-cols-2'
            : 'grid gap-5 grid-cols-1'
        }
      >
        {hasSkills && <SkillsInsightChips skills={skills} />}
        {hasTitles && <CareerInsightsPanel titles={careerTitles} />}
      </div>
    </section>
  );
}
