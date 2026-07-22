'use client';

import { useCallback, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ClipboardCopy, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PROMO_CODE = 'FLAT25';

interface CouponPromoSuggestionProps {
  className?: string;
  couponCode?: string;
  onCodeCopied?: (code: string) => void;
}

export function CouponPromoSuggestion({
  className,
  couponCode = PROMO_CODE,
  onCodeCopied,
}: CouponPromoSuggestionProps) {
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      onCodeCopied?.(couponCode);
      setCopied(true);
      setRippleKey((k) => k + 1);
      toast.success(`Coupon ${couponCode} copied!`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy coupon. Please copy manually.');
    }
  }, [couponCode, onCodeCopied]);

  return (
    <motion.div
      className={cn('relative', className)}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? undefined : { y: -3 }}
    >
      {/* Floating glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-0.5 rounded-[18px] bg-[radial-gradient(circle_at_50%_20%,rgba(251,191,36,0.4),rgba(249,115,22,0.1)_60%,transparent_75%)] blur-lg"
        animate={
          reduced
            ? undefined
            : { opacity: [0.35, 0.6, 0.35], scale: [1, 1.02, 1] }
        }
        transition={
          reduced ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      <div
        className={cn(
          'relative overflow-hidden rounded-[18px] border border-amber-200/75',
          'bg-gradient-to-br from-amber-50/95 via-yellow-50/90 to-orange-50/92',
          'shadow-[0_8px_24px_-8px_rgba(180,83,9,0.28),0_2px_8px_rgba(251,191,36,0.18)]',
          'backdrop-blur-md ring-1 ring-inset ring-white/70'
        )}
      >
        {!reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ['0%', '260%'] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              repeatDelay: 4,
              ease: 'easeInOut',
            }}
          />
        )}

        <div className="relative px-3 py-2.5 sm:px-3.5 sm:py-3 space-y-2">
          {/* 1. Badge */}
          <div className="flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-amber-700 shrink-0" aria-hidden />
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-800/90 sm:text-[10px]">
              Limited Time Offer
            </span>
          </div>

          {/* 2. Headline */}
          <p className="text-base font-extrabold leading-tight text-amber-950 sm:text-[17px]">
            <span aria-hidden className="mr-1">
              🔥
            </span>
            Save 25% Instantly
          </p>

          {/* 3. Coupon code */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-amber-900/80">Use Coupon Code</p>
            <motion.button
              type="button"
              onClick={() => void handleCopy()}
              whileHover={reduced ? undefined : { scale: 1.02 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
              animate={
                reduced
                  ? undefined
                  : {
                      boxShadow: [
                        '0 4px 14px -2px rgba(234,88,12,0.45)',
                        '0 6px 20px -2px rgba(234,88,12,0.55)',
                        '0 4px 14px -2px rgba(234,88,12,0.45)',
                      ],
                    }
              }
              transition={
                reduced ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
              }
              className={cn(
                'flex w-full items-center justify-center rounded-xl px-3 py-2',
                'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600',
                'font-mono text-lg font-black tracking-[0.2em] text-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2'
              )}
              aria-label={`Copy coupon code ${couponCode}`}
            >
              {couponCode}
            </motion.button>
          </div>

          {/* 4. Savings line */}
          <p className="text-[11px] font-semibold text-amber-900/85 leading-snug sm:text-xs">
            Save ₹50 on the Pro Job Seeker Plan.
          </p>

          {/* 5. Copy CTA */}
          <motion.button
            type="button"
            onClick={() => void handleCopy()}
            whileHover={reduced ? undefined : { y: -1 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            className={cn(
              'relative flex w-full min-h-9 items-center justify-center gap-1.5 overflow-hidden',
              'rounded-xl border border-amber-300/60 bg-white/75 px-2.5 py-1.5',
              'text-[11px] font-semibold text-amber-900 sm:text-xs',
              'transition-colors hover:bg-white/95 hover:border-amber-400/70',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1'
            )}
            aria-label={`Copy coupon code ${couponCode} to clipboard`}
          >
            {!reduced && (
              <motion.span
                key={rippleKey}
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-amber-200/40 rounded-xl"
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600 shrink-0" aria-hidden />
              ) : (
                <ClipboardCopy className="h-3.5 w-3.5 text-amber-700 shrink-0" aria-hidden />
              )}
              <span>{copied ? 'Copied!' : 'Click to Copy Coupon'}</span>
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default CouponPromoSuggestion;
