'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CouponPromoSuggestion } from '@/components/payments/CouponPromoSuggestion';
import {
  formatCouponRupee,
  mapValidateCouponResponse,
} from '@/lib/payments/coupon-quote-client';

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
  /** Show FLAT25 promo suggestion card above the coupon input (pricing page only). */
  showPromoSuggestion?: boolean;
}

function formatRupee(amount: number) {
  return formatCouponRupee(amount);
}

export function CouponCheckoutBox({
  planKey,
  listPriceRupees,
  appliedQuote,
  onApplied,
  onRemoved,
  disabled = false,
  className = '',
  showPromoSuggestion = false,
}: CouponCheckoutBoxProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showPromoSuggestion && !appliedQuote) {
      setCode('FLAT25');
    }
  }, [showPromoSuggestion, appliedQuote]);

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
      const data = (await res.json()) as Record<string, unknown>;
      const mapped = mapValidateCouponResponse(data, planKey);
      if (!res.ok || !mapped.ok) {
        const message = mapped.ok ? 'Invalid coupon' : mapped.error;
        setError(message);
        toast.error(message);
        return;
      }
      onApplied(mapped.quote);
      setCode(mapped.quote.code);
      toast.success('Coupon applied', {
        description: `You save ${formatRupee(mapped.quote.discountPrice)} — pay ${formatRupee(mapped.quote.finalPrice)}`,
      });
    } catch {
      const message = 'Failed to validate coupon. Please try again.';
      setError(message);
      toast.error(message);
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
      className={`rounded-lg border border-gray-200 bg-white p-4 text-gray-900 ${className}`}
      aria-label="Coupon code section"
    >
      {!appliedQuote ? (
        <div className="space-y-3">
          {showPromoSuggestion && (
            <CouponPromoSuggestion
              onCodeCopied={(copiedCode) => {
                setCode(copiedCode);
                setError(null);
              }}
            />
          )}
          <Label htmlFor={`coupon-${planKey}`} className="text-sm font-medium text-gray-700">
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
              placeholder="ENTER CODE"
              disabled={disabled || loading}
              className="font-mono uppercase flex-1 min-w-0 border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus-visible:border-indigo-500 focus-visible:ring-indigo-500"
              aria-label="Coupon code"
              aria-invalid={!!error}
              aria-describedby={error ? `coupon-error-${planKey}` : undefined}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleApply()}
              disabled={disabled || loading || !code.trim()}
              className="shrink-0 min-h-11 border-indigo-600 bg-white font-semibold text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              aria-label="Apply coupon"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
          {error && (
            <p id={`coupon-error-${planKey}`} className="text-sm text-red-600" role="alert">
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
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-sm font-medium">Coupon Applied</span>
              <span className="ml-auto flex items-center gap-1 font-mono text-xs bg-green-50 text-green-800 px-2 py-0.5 rounded border border-green-200">
                <Tag className="h-3 w-3" aria-hidden />
                {appliedQuote.code}
              </span>
            </div>
            <div className="space-y-1.5 text-sm border-t border-gray-200 pt-3">
              <div className="flex justify-between text-gray-600">
                <span>Original Price</span>
                <span className="line-through">{formatRupee(appliedQuote.originalPrice)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span>-{formatRupee(appliedQuote.discountPrice)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 text-base pt-1">
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
              className="w-full text-gray-600 hover:bg-red-50 hover:text-red-600 min-h-11"
              aria-label="Remove coupon"
            >
              <X className="h-4 w-4 mr-1" aria-hidden />
              Remove Coupon
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
      {!appliedQuote && listPriceRupees > 0 && (
        <p className="text-xs text-gray-500 mt-2 sr-only">
          List price {formatRupee(listPriceRupees)}
        </p>
      )}
    </div>
  );
}

export default CouponCheckoutBox;
