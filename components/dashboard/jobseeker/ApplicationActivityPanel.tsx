'use client';

import Link from 'next/link';
import { Send, Calendar, Bookmark, Eye } from 'lucide-react';

interface ApplicationActivityPanelProps {
  appliedJobs: number;
  interviewInvites: number;
  savedJobs: number;
  resumeViews: number;
}

export default function ApplicationActivityPanel({
  appliedJobs,
  interviewInvites,
  savedJobs,
  resumeViews,
}: ApplicationActivityPanelProps) {
  const items = [
    { label: 'Applied', value: appliedJobs, icon: Send, href: '/dashboard/jobseeker/applications' },
    { label: 'Interviews', value: interviewInvites, icon: Calendar, href: '/dashboard/jobseeker/applications' },
    { label: 'Saved', value: savedJobs, icon: Bookmark, href: '/dashboard/jobseeker/bookmarks' },
    { label: 'Views', value: resumeViews, icon: Eye, href: '/dashboard/jobseeker/resumes' },
  ];

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Activity
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl bg-white/90 px-3 py-3 ring-1 ring-slate-200/60 transition-colors hover:bg-white hover:ring-slate-300"
          >
            <item.icon className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-lg font-bold leading-none text-slate-900">{item.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
