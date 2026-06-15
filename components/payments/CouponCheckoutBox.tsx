'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface CouponQuote {
  code: string;
  name: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  originalPrice: number;
  discountPrice: number;
  finalPrice: number;
  planKey: string;
}

interface CouponCheckoutBoxProps {
  planKey: string;
  listPriceRupees: number;
  appliedQuote: CouponQuote | null;
  onApplied: (quote: CouponQuote) => void;
  onRemoved: () => void;
  disabled?: boolean;
  className?: string;
}

function formatRupee(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function CouponCheckoutBox({
  planKey,
  listPriceRupees,
  appliedQuote,
  onApplied,
  onRemoved,
  disabled = false,
  className = '',
}: CouponCheckoutBoxProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Enter a coupon code');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ couponCode: trimmed, planKey }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.error || 'Invalid coupon');
        return;
      }
      onApplied({
        code: data.code,
        name: data.name,
        originalAmount: data.originalAmount,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
        originalPrice: data.originalPrice,
        discountPrice: data.discountPrice,
        finalPrice: data.finalPrice,
        planKey: data.planKey,
      });
      setCode(data.code);
    } catch {
      setError('Failed to validate coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [code, planKey, onApplied]);

  const handleRemove = () => {
    setCode('');
    setError(null);
    onRemoved();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleApply();
    }
  };

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 ${className}`}
      aria-label="Coupon code section"
    >
      {!appliedQuote ? (
        <div className="space-y-3">
          <Label htmlFor={`coupon-${planKey}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Coupon Code
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <Input
              id={`coupon-${planKey}`}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter code"
              disabled={disabled || loading}
              className="font-mono uppercase flex-1 min-w-0"
              aria-label="Coupon code"
              aria-invalid={!!error}
              aria-describedby={error ? `coupon-error-${planKey}` : undefined}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleApply()}
              disabled={disabled || loading || !code.trim()}
              className="shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 min-h-11"
              aria-label="Apply coupon"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
          {error && (
            <p id={`coupon-error-${planKey}`} className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="applied"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-sm font-medium">Coupon Applied</span>
              <span className="ml-auto flex items-center gap-1 font-mono text-xs bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">
                <Tag className="h-3 w-3" aria-hidden />
                {appliedQuote.code}
              </span>
            </div>
            <div className="space-y-1.5 text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Original Price</span>
                <span className="line-through">{formatRupee(appliedQuote.originalPrice)}</span>
              </div>
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>-{formatRupee(appliedQuote.discountPrice)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100 text-base pt-1">
                <span>Final Price</span>
                <span>{formatRupee(appliedQuote.finalPrice)}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="w-full text-gray-500 hover:text-red-600 min-h-11"
              aria-label="Remove coupon"
            >
              <X className="h-4 w-4 mr-1" aria-hidden />
              Remove Coupon
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
      {!appliedQuote && listPriceRupees > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 sr-only">
          List price {formatRupee(listPriceRupees)}
        </p>
      )}
    </div>
  );
}

export default CouponCheckoutBox;
