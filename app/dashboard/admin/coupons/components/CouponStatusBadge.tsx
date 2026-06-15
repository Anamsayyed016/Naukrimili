'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type CouponStatus = 'active' | 'expired' | 'scheduled' | 'inactive';

const STATUS_STYLES: Record<CouponStatus, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function CouponStatusBadge({
  status,
  className,
}: {
  status: CouponStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn('capitalize border-0', STATUS_STYLES[status], className)}>
      {status}
    </Badge>
  );
}

export function CouponUsageProgress({
  used,
  max,
  className,
}: {
  used: number;
  max: number | null;
  className?: string;
}) {
  if (max == null) {
    return (
      <span className={cn('text-xs text-gray-500 dark:text-gray-400', className)}>
        {used} / ∞
      </span>
    );
  }
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const barColor =
    pct >= 90 ? '[&>div]:bg-red-500' : pct >= 70 ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500';

  return (
    <div className={cn('space-y-1 min-w-[80px]', className)}>
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>{used} / {max}</span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} className={cn('h-1.5', barColor)} />
    </div>
  );
}
