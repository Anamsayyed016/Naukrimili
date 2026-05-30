'use client';

interface CareerInsightsPanelProps {
  titles: string[];
}

export default function CareerInsightsPanel({ titles }: CareerInsightsPanelProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">You qualify for</h3>
      {titles.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {titles.map((title) => (
            <li key={title} className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="flex h-6 shrink-0 items-center rounded-md bg-gradient-to-r from-violet-500 to-blue-500 px-2 text-[10px] font-bold uppercase tracking-wide text-white">
                Role
              </span>
              <span className="font-medium">{title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Career roles appear after resume parsing.</p>
      )}
    </div>
  );
}
