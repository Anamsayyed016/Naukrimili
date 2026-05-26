'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Wand2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  WORKSPACE_ROUTES,
  WorkspaceId,
  setCachedWorkspacePreference,
} from '@/lib/preferences/workspace-preference';

/**
 * Compact segmented control for jobseekers — surfaces the two workspaces in
 * the navbar so users can move between Job Search and Resume Studio without
 * re-login or hunting through menus.
 *
 * Tapping a workspace also writes it to the local cache so the *next* login
 * lands here directly (without needing to revisit the workspace selector).
 * The DB row is only written from the explicit "Remember my choice" flow on
 * the selector screen — clicking here is a soft hint, not a persistent vote.
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

  const handleClick = (workspace: WorkspaceId) => {
    // Soft preference update: writes only to the local cache. The "official"
    // persistent preference still requires the explicit Remember-my-choice
    // checkbox on the workspace selector page.
    setCachedWorkspacePreference(workspace);
  };

  if (variant === 'mobile') {
    return (
      <div
        className={cn(
          'grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-200/70',
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
              onClick={() => handleClick(tab.id)}
              className={cn(
                'group/wstab relative flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-white text-slate-900 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.12)] ring-1 ring-slate-200'
                  : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
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
        'relative inline-flex items-center rounded-full bg-slate-100/80 p-0.5 ring-1 ring-slate-200/70 backdrop-blur-sm',
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
            onClick={() => handleClick(tab.id)}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'group/wstab relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-tight transition-all duration-200 sm:text-[13px]',
              isActive
                ? 'bg-white text-slate-900 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.8)]'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 transition-colors duration-200',
                isActive ? 'text-indigo-600' : 'text-slate-400 group-hover/wstab:text-slate-700'
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
