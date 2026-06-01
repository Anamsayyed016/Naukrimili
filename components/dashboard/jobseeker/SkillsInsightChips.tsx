'use client';

import { useState } from 'react';

const VISIBLE_SKILL_COUNT = 6;

const CHIP_COLORS = [
  'bg-blue-50 text-blue-800 ring-blue-100',
  'bg-violet-50 text-violet-800 ring-violet-100',
  'bg-emerald-50 text-emerald-800 ring-emerald-100',
  'bg-amber-50 text-amber-800 ring-amber-100',
  'bg-rose-50 text-rose-800 ring-rose-100',
  'bg-cyan-50 text-cyan-800 ring-cyan-100',
];

interface SkillsInsightChipsProps {
  skills: string[];
}

export default function SkillsInsightChips({ skills }: SkillsInsightChipsProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = skills.length > VISIBLE_SKILL_COUNT;
  const visibleSkills = expanded ? skills : skills.slice(0, VISIBLE_SKILL_COUNT);
  const hiddenCount = skills.length - VISIBLE_SKILL_COUNT;

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">Skills from resume</h3>
      {skills.length > 0 ? (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleSkills.map((skill, i) => (
              <span
                key={skill}
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${CHIP_COLORS[i % CHIP_COLORS.length]}`}
              >
                {skill}
              </span>
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
            >
              {expanded ? 'Show less' : `+${hiddenCount} more`}
            </button>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Skills appear after resume upload.</p>
      )}
    </div>
  );
}
