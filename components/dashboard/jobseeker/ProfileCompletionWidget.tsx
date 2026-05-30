'use client';

import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { ProfileUser } from './types';

interface ProfileCompletionWidgetProps {
  completion: number;
  user: ProfileUser | null;
  parsedData: Record<string, unknown> | null | undefined;
}

interface ChecklistItem {
  label: string;
  complete: boolean;
}

function buildChecklist(
  user: ProfileUser | null,
  parsedData: Record<string, unknown> | null | undefined
): ChecklistItem[] {
  const projects = parsedData?.projects;
  const certifications = parsedData?.certifications;
  const hasProjects = Array.isArray(projects) && projects.length > 0;
  const hasCertifications = Array.isArray(certifications) && certifications.length > 0;

  return [
    { label: 'Projects', complete: hasProjects },
    { label: 'Certifications', complete: hasCertifications },
    { label: 'Profile Photo', complete: Boolean(user?.profilePicture) },
    { label: 'Contact Details', complete: Boolean(user?.phone) },
  ];
}

export default function ProfileCompletionWidget({
  completion,
  user,
  parsedData,
}: ProfileCompletionWidgetProps) {
  const checklist = buildChecklist(user, parsedData);
  const missing = checklist.filter((item) => !item.complete);

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Profile Completion</h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{completion}%</p>
          <p className="mt-1 text-sm text-slate-500">Complete</p>
        </div>
      </div>

      <Progress value={completion} className="mt-4 h-2.5" />

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {missing.length > 0 ? 'Suggested next steps' : 'Looking great'}
        </p>
        <ul className="mt-3 space-y-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm text-slate-700">
              {item.complete ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-slate-300" />
              )}
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      {completion < 100 && (
        <Link href="/dashboard/jobseeker/profile" className="mt-5 block">
          <Button variant="outline" className="w-full border-slate-200">
            Complete Profile
          </Button>
        </Link>
      )}
    </section>
  );
}
