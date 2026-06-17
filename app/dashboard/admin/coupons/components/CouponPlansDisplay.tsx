'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ALL_PLAN_KEYS,
  PLAN_DISPLAY_NAMES,
  type PlanKey,
} from '@/lib/services/razorpay-plans';

export function getPlanKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  return keys.filter((k): k is string => typeof k === 'string');
}

export function getPlanLabels(keys: unknown): string[] {
  return getPlanKeys(keys).map((k) => PLAN_DISPLAY_NAMES[k as PlanKey] ?? k);
}

export function formatPlansSummary(keys: unknown): {
  text: string;
  isAllPlans: boolean;
  fullList: string;
} {
  const planKeys = getPlanKeys(keys);
  const labels = getPlanLabels(keys);
  const fullList = labels.join(', ');

  if (labels.length === 0) {
    return { text: '—', isAllPlans: false, fullList: '' };
  }

  if (planKeys.length >= ALL_PLAN_KEYS.length) {
    return { text: 'All Plans', isAllPlans: true, fullList };
  }

  if (labels.length === 1) {
    return { text: labels[0], isAllPlans: false, fullList };
  }

  if (labels.length <= 3) {
    const shown = labels.slice(0, 2).join(', ');
    const extra = labels.length - 2;
    return {
      text: extra > 0 ? `${shown} +${extra} more` : shown,
      isAllPlans: false,
      fullList,
    };
  }

  return {
    text: `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`,
    isAllPlans: false,
    fullList,
  };
}

export function CouponPlansDisplay({
  planKeys,
  className,
}: {
  planKeys: unknown;
  className?: string;
}) {
  const { text, isAllPlans, fullList } = formatPlansSummary(planKeys);

  if (text === '—') {
    return <span className={className}>—</span>;
  }

  const content = isAllPlans ? (
    <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 font-medium">
      All Plans
    </Badge>
  ) : (
    <span className={className}>{text}</span>
  );

  if (!fullList || fullList === text) {
    return content;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">{content}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {fullList}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
