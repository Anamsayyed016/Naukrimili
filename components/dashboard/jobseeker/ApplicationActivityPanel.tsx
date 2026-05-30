'use client';

import Link from 'next/link';
import { Send, Calendar, Bookmark, Eye } from 'lucide-react';

interface ApplicationActivityPanelProps {
  appliedJobs: number;
  interviewInvites: number;
  savedJobs: number;
  resumeViews: number;
}

const cardClass =
  'flex flex-col rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-colors hover:border-slate-200 hover:bg-white';

export default function ApplicationActivityPanel({
  appliedJobs,
  interviewInvites,
  savedJobs,
  resumeViews,
}: ApplicationActivityPanelProps) {
  const items = [
    {
      label: 'Applied Jobs',
      value: appliedJobs,
      icon: Send,
      href: '/dashboard/jobseeker/applications',
      empty: 'No applications yet',
    },
    {
      label: 'Interview Invites',
      value: interviewInvites,
      icon: Calendar,
      href: '/dashboard/jobseeker/applications',
      empty: 'No interviews scheduled',
    },
    {
      label: 'Saved Jobs',
      value: savedJobs,
      icon: Bookmark,
      href: '/dashboard/jobseeker/bookmarks',
      empty: 'No saved jobs yet',
    },
    {
      label: 'Resume Views',
      value: resumeViews,
      icon: Eye,
      href: '/dashboard/jobseeker/resumes',
      empty: 'No profile views yet',
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Application Activity</h2>
      <p className="mt-1 text-sm text-slate-500">Your recent job search momentum</p>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className={cardClass}>
            <div className="mb-3 flex items-center justify-between">
              <item.icon className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{item.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-600 sm:text-sm">{item.label}</p>
            {item.value === 0 && (
              <p className="mt-2 text-xs text-slate-400">{item.empty}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
