'use client';

import Link from 'next/link';
import { Upload, CheckCircle, Edit, Search } from 'lucide-react';
import type { DashboardStats } from './types';

interface QuickActionsProps {
  stats: DashboardStats | null;
}

export default function QuickActions({ stats }: QuickActionsProps) {
  const items =
    stats && stats.totalResumes > 0
      ? [
          { href: '/dashboard/jobseeker/resumes', icon: CheckCircle, label: 'Resume Studio' },
          { href: '/dashboard/jobseeker/profile', icon: Edit, label: 'Edit profile' },
          { href: '/jobs', icon: Search, label: 'Browse jobs' },
        ]
      : [
          { href: '/resumes/upload', icon: Upload, label: 'Upload resume' },
          { href: '/dashboard/jobseeker/profile', icon: Edit, label: 'Edit profile' },
          { href: '/jobs', icon: Search, label: 'Browse jobs' },
        ];

  return (
    <section className="border-t border-slate-200/80 pt-5">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200/80 transition-all hover:bg-slate-50 hover:text-slate-900 hover:ring-slate-300"
          >
            <item.icon className="h-4 w-4 text-slate-500" />
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
