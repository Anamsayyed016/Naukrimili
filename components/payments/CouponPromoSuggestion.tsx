'use client';

import { useCallback, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Copy, Gift } from 'lucide-react';
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

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      onCodeCopied?.(couponCode);
      setCopied(true);
      toast.success(`Coupon ${couponCode} copied!`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy coupon. Please copy manually.');
    }
  }, [couponCode, onCodeCopied]);

  return (
    <motion.div
      className={cn('relative', className)}
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Soft ambient glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-2xl bg-[radial-gradient(circle_at_50%_30%,rgba(251,191,36,0.35),rgba(249,115,22,0.12)_55%,transparent_72%)] blur-md"
        animate={
          reduced
            ? undefined
            : {
                opacity: [0.45, 0.75, 0.45],
                scale: [1, 1.03, 1],
              }
        }
        transition={
          reduced ? undefined : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-amber-200/80',
          'bg-gradient-to-br from-amber-50/95 via-orange-50/92 to-amber-100/88',
          'shadow-[0_12px_32px_-10px_rgba(180,83,9,0.35),0_2px_10px_rgba(251,191,36,0.2)]',
          'backdrop-blur-md ring-1 ring-inset ring-white/60'
        )}
      >
        {!reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/45 to-transparent"
            animate={{ x: ['0%', '280%'] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              repeatDelay: 3.2,
              ease: 'easeInOut',
            }}
          />
        )}

        <div className="relative space-y-3 p-3.5 sm:p-4">
          <div className="flex items-start gap-2.5">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md"
              aria-hidden
            >
              <Gift className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800/85 sm:text-[11px]">
                Limited Time Offer
              </p>
              <p className="mt-1 text-sm font-medium text-amber-950/90 sm:text-[15px]">
                Use Discount Code
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            <motion.button
              type="button"
              onClick={() => void handleCopy()}
              whileHover={reduced ? undefined : { y: -2, scale: 1.02 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
              className={cn(
                'inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2',
                'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600',
                'font-mono text-lg font-extrabold tracking-wider text-white',
                'shadow-[0_6px_18px_-4px_rgba(234,88,12,0.55)]',
                'transition-shadow hover:shadow-[0_10px_24px_-6px_rgba(234,88,12,0.6)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2'
              )}
              aria-label={`Copy coupon code ${couponCode}`}
            >
              {couponCode}
            </motion.button>

            <p className="text-center text-sm font-semibold text-amber-950/90 sm:text-left">
              to get{' '}
              <span className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 bg-clip-text font-extrabold text-transparent">
                Flat 25% OFF
              </span>{' '}
              instantly.
            </p>
          </div>

          <motion.button
            type="button"
            onClick={() => void handleCopy()}
            whileHover={reduced ? undefined : { y: -1 }}
            className={cn(
              'flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300/70',
              'bg-white/70 px-3 py-2 text-sm font-semibold text-amber-900',
              'transition-colors hover:bg-white/90',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2'
            )}
            aria-label={`Copy coupon code ${couponCode} to clipboard`}
          >
            <motion.span
              animate={
                copied
                  ? { scale: [1, 1.2, 1], rotate: [0, 0, 0] }
                  : reduced
                    ? undefined
                    : { y: [0, -2, 0] }
              }
              transition={
                copied
                  ? { duration: 0.35 }
                  : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
              }
              className="inline-flex"
              aria-hidden
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-amber-700" />
              )}
            </motion.span>
            <span>{copied ? 'Copied!' : 'Click to Copy Coupon'}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default CouponPromoSuggestion;
