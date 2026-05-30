'use client';

import Link from 'next/link';
import {
  User,
  Target,
  Send,
  Bookmark,
  FileText,
} from 'lucide-react';
import type { DashboardStats } from './types';

interface DashboardStatCardsProps {
  stats: DashboardStats;
  recommendedCount: number;
  resumeScore: number | null;
}

const cardClass =
  'rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md';

export default function DashboardStatCards({
  stats,
  recommendedCount,
  resumeScore,
}: DashboardStatCardsProps) {
  const items = [
    {
      label: 'Profile Completion',
      value: `${stats.profileCompletion}%`,
      icon: User,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      href: '/dashboard/jobseeker/profile',
    },
    {
      label: 'Recommended Jobs',
      value: recommendedCount,
      icon: Target,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      href: '#top-job-matches',
    },
    {
      label: 'Applied Jobs',
      value: stats.totalApplications,
      icon: Send,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      href: '/dashboard/jobseeker/applications',
    },
    {
      label: 'Saved Jobs',
      value: stats.totalBookmarks,
      icon: Bookmark,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      href: '/dashboard/jobseeker/bookmarks',
    },
    {
      label: 'Resume Score',
      value: resumeScore != null ? `${resumeScore}` : '—',
      icon: FileText,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      href: '/dashboard/jobseeker/resumes',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      {items.map((item) => (
        <Link key={item.label} href={item.href} className={cardClass}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">{item.label}</p>
              <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {item.value}
                {item.label === 'Profile Completion' ? '' : item.label === 'Resume Score' && resumeScore != null ? '' : ''}
              </p>
            </div>
            <div className={`rounded-lg p-2 ${item.iconBg}`}>
              <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.iconColor}`} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
