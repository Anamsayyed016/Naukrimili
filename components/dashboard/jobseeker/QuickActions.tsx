'use client';

import type { DashboardStats } from './types';

interface QuickActionsProps {
  stats: DashboardStats | null;
}

/**
 * Quick links removed — same destinations are available via stat cards,
 * hero CTA, profile widget, and Top Job Matches empty states.
 */
export default function QuickActions(_props: QuickActionsProps) {
  return null;
}
