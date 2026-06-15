'use client';

import { Check } from 'lucide-react';
import { PLAN_DISPLAY_NAMES, type PlanKey } from '@/lib/services/razorpay-plans';
import { CouponUsageProgress } from './CouponStatusBadge';

export interface CouponPreviewData {
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number | null;
  applicablePlanKeys: string[];
  maxRedemptions?: number | null;
  redemptionCount?: number;
  validUntil: string;
}

function formatDiscount(type: string, value: number) {
  if (type === 'percentage') return `${value}% OFF`;
  return `₹${(value / 100).toLocaleString('en-IN')} OFF`;
}

export function CouponPreviewCard({ coupon }: { coupon: CouponPreviewData }) {
  const plans = coupon.applicablePlanKeys.map(
    (k) => PLAN_DISPLAY_NAMES[k as PlanKey] ?? k
  );

  return (
    <div className="rounded-xl border-2 border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-white to-indigo-50/50 dark:from-gray-900 dark:to-indigo-950/20 p-6 shadow-md h-full">
      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
        Preview
      </p>
      <p className="font-mono text-lg font-bold text-gray-900 dark:text-gray-100">
        {coupon.code || 'COUPON'}
      </p>
      <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
        {formatDiscount(coupon.discountType, coupon.discountValue)}
      </p>
      {coupon.name && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{coupon.name}</p>
      )}
      <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/40 space-y-3 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400 mb-1">Applicable Plans</p>
          <ul className="space-y-0.5">
            {plans.length === 0 ? (
              <li className="text-gray-400">Select plans</li>
            ) : (
              plans.map((p) => (
                <li key={p} className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                  <Check className="h-3.5 w-3.5 text-green-500 shrink-0" aria-hidden />
                  {p}
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 mb-1">Usage</p>
          <CouponUsageProgress
            used={coupon.redemptionCount ?? 0}
            max={coupon.maxRedemptions ?? null}
          />
        </div>
        {coupon.minOrderAmount != null && coupon.minOrderAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Min Purchase</span>
            <span className="font-medium">₹{(coupon.minOrderAmount / 100).toLocaleString('en-IN')}</span>
          </div>
        )}
        {coupon.validUntil && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Expires</span>
            <span className="font-medium">
              {new Date(coupon.validUntil).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
