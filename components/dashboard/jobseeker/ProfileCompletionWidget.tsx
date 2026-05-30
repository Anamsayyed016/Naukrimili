'use client';

import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
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
    { label: 'Profile photo', complete: Boolean(user?.profilePicture) },
    { label: 'Contact details', complete: Boolean(user?.phone) },
  ];
}

export default function ProfileCompletionWidget({
  completion,
  user,
  parsedData,
}: ProfileCompletionWidgetProps) {
  const checklist = buildChecklist(user, parsedData);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (completion / 100) * circumference;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative mx-auto h-24 w-24 shrink-0 sm:mx-0">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="url(#progressGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{completion}%</span>
          <span className="text-[10px] font-medium uppercase text-slate-500">done</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-slate-900">Profile completion</h3>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5 text-xs text-slate-600">
              {item.complete ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              )}
              {item.label}
            </li>
          ))}
        </ul>
        {completion < 100 && (
          <Link href="/dashboard/jobseeker/profile" className="mt-3 inline-block">
            <Button size="sm" variant="outline" className="h-8 text-xs">
              Complete profile
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
