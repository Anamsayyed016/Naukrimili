'use client';

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
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">Skills from resume</h3>
      {skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.slice(0, 20).map((skill, i) => (
            <span
              key={skill}
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${CHIP_COLORS[i % CHIP_COLORS.length]}`}
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Skills appear after resume upload.</p>
      )}
    </div>
  );
}
