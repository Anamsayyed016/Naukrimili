'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Wand2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  WORKSPACE_ROUTES,
  WorkspaceId,
} from '@/lib/preferences/workspace-preference';

/**
 * Compact segmented control for jobseekers — surfaces the two workspaces in
 * the navbar so users can move between Job Search and Resume Studio without
 * re-login or hunting through menus.
 *
 * NAVIGATION ONLY: clicking a tab is a pure route change. It deliberately
 * does NOT touch the saved workspace preference, otherwise every casual click
 * would silently opt the user out of the workspace-selector landing screen on
 * their next login. The persistent preference is set exclusively from the
 * "Remember my choice" toggle on /dashboard/workspace-selector.
 */

const WORKSPACE_TABS: Array<{
  id: WorkspaceId;
  label: string;
  shortLabel: string;
  icon: typeof Briefcase;
  hrefMatchers: RegExp[];
}> = [
  {
    id: 'jobs',
    label: 'Jobs',
    shortLabel: 'Jobs',
    icon: Briefcase,
    hrefMatchers: [/^\/dashboard\/jobseeker(\/|$)/, /^\/jobs(\/|$)/],
  },
  {
    id: 'resume-builder',
    label: 'Resume Studio',
    shortLabel: 'Studio',
    icon: Wand2,
    hrefMatchers: [/^\/resume-builder(\/|$)/],
  },
];

function detectActiveWorkspace(pathname: string | null): WorkspaceId | null {
  if (!pathname) return null;
  for (const tab of WORKSPACE_TABS) {
    if (tab.hrefMatchers.some((re) => re.test(pathname))) return tab.id;
  }
  return null;
}

interface WorkspaceSwitcherProps {
  variant?: 'desktop' | 'mobile';
  className?: string;
}

export default function WorkspaceSwitcher({
  variant = 'desktop',
  className,
}: WorkspaceSwitcherProps) {
  const pathname = usePathname();
  const [active, setActive] = useState<WorkspaceId | null>(null);

  // Defer detection until after mount to avoid hydration mismatch when the
  // server-rendered pathname differs from the client one on transitions.
  useEffect(() => {
    setActive(detectActiveWorkspace(pathname));
  }, [pathname]);

  if (variant === 'mobile') {
    return (
      <div
        className={cn(
          'grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100/70 p-1 ring-1 ring-slate-200/50',
          className
        )}
      >
        {WORKSPACE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <Link
              key={tab.id}
              href={WORKSPACE_ROUTES[tab.id]}
              className={cn(
                'group/wstab relative flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-[-0.01em] transition-all duration-200 ease-out',
                isActive
                  ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_-4px_rgba(15,23,42,0.1)] ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative inline-flex items-center rounded-full bg-slate-100/70 p-0.5 ring-1 ring-slate-200/50',
        className
      )}
      role="tablist"
      aria-label="Workspace"
    >
      {WORKSPACE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={WORKSPACE_ROUTES[tab.id]}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'group/wstab relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-[-0.01em] transition-all duration-200 ease-out sm:px-3.5 sm:py-[7px] sm:text-[13px]',
              isActive
                ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_4px_14px_-4px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-colors duration-200 ease-out',
                isActive ? 'text-slate-900' : 'text-slate-500 group-hover/wstab:text-slate-700'
              )}
              aria-hidden
            />
            <span className="hidden lg:inline">{tab.label}</span>
            <span className="lg:hidden">{tab.shortLabel}</span>
          </Link>
        );
      })}
    </div>
  );
}
