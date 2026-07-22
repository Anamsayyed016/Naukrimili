'use client';

import { Badge } from '@/components/ui/badge';
import type { CouponQuote } from '@/components/payments/CouponCheckoutBox';
import { formatCouponRupee } from '@/lib/payments/coupon-quote-client';
import { cn } from '@/lib/utils';

interface CouponPlanPriceDisplayProps {
  listPriceRupees: number;
  appliedQuote: CouponQuote | null;
  className?: string;
  priceClassName?: string;
  showSavingsBadge?: boolean;
}

export function CouponPlanPriceDisplay({
  listPriceRupees,
  appliedQuote,
  className,
  priceClassName = 'text-4xl font-bold',
  showSavingsBadge = true,
}: CouponPlanPriceDisplayProps) {
  if (!appliedQuote || appliedQuote.discountPrice <= 0) {
    return (
      <div className={className}>
        <span className={cn(priceClassName, 'text-gray-900')}>
          {formatCouponRupee(listPriceRupees)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} aria-live="polite">
      <div className="space-y-1">
        <span className="text-lg text-gray-400 line-through">
          {formatCouponRupee(appliedQuote.originalPrice)}
        </span>
        <span className={cn(priceClassName, 'block text-indigo-600')}>
          {formatCouponRupee(appliedQuote.finalPrice)}
        </span>
      </div>
      {showSavingsBadge && (
        <Badge
          variant="secondary"
          className="bg-green-50 text-green-800 border border-green-200 font-semibold"
        >
          You save {formatCouponRupee(appliedQuote.discountPrice)}
        </Badge>
      )}
    </div>
  );
}

export default CouponPlanPriceDisplay;
