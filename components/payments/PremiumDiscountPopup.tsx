'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumDiscountPopupProps {
  className?: string;
  /** Optional; visual-only — does not apply discounts. */
  headline?: string;
  subline?: string;
}

/**
 * Decorative promotional badge for the ₹199 (Pro Job Seeker) plan card.
 * Visual only — does not change pricing, coupons, or payment flow.
 */
export function PremiumDiscountPopup({
  className,
  headline = 'FLAT 25% OFF',
  subline = 'Save ₹50 Today',
}: PremiumDiscountPopupProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={cn(
        'pointer-events-none absolute -top-3 -right-2 z-20 sm:-top-4 sm:-right-3',
        className
      )}
      initial={reduced ? false : { opacity: 0, scale: 0.9, rotate: -2 }}
      animate={
        reduced
          ? { opacity: 1, scale: 1, rotate: 0 }
          : {
              opacity: 1,
              scale: 1,
              rotate: -1.5,
              y: [0, -3, 0],
            }
      }
      transition={
        reduced
          ? { duration: 0 }
          : {
              opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
              scale: { type: 'spring', stiffness: 380, damping: 18 },
              rotate: { duration: 0.5, ease: 'easeOut' },
              y: {
                duration: 3.6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.6,
              },
            }
      }
      whileHover={
        reduced
          ? undefined
          : {
              scale: 1.04,
              y: -4,
              transition: { type: 'spring', stiffness: 400, damping: 20 },
            }
      }
      style={{ pointerEvents: 'auto' }}
      aria-label={`${headline}. ${subline}. Limited time promotional offer.`}
    >
      {/* Soft ambient glow */}
      <motion.div
        aria-hidden
        className="absolute -inset-3 rounded-[22px] bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.45),rgba(249,115,22,0.18)_55%,transparent_70%)] blur-md"
        animate={
          reduced
            ? undefined
            : {
                opacity: [0.55, 0.85, 0.55],
                scale: [1, 1.06, 1],
              }
        }
        transition={
          reduced
            ? undefined
            : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      <div
        className={cn(
          'relative overflow-hidden rounded-[18px] px-3.5 py-2.5 sm:px-4 sm:py-3',
          'min-w-[128px] sm:min-w-[142px]',
          'border border-amber-200/70',
          'bg-gradient-to-br from-amber-50/95 via-orange-50/90 to-amber-100/85',
          'shadow-[0_10px_28px_-8px_rgba(180,83,9,0.45),0_2px_8px_rgba(251,191,36,0.25)]',
          'backdrop-blur-md'
        )}
      >
        {/* Gradient rim */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/60"
        />

        {/* Shimmer sweep */}
        {!reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ['0%', '280%'] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              repeatDelay: 2.8,
              ease: 'easeInOut',
            }}
          />
        )}

        <div className="relative flex flex-col items-center text-center leading-tight">
          <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800/80">
            Limited Offer
          </span>
          <span className="flex items-center gap-1 text-[13px] font-extrabold tracking-tight text-amber-950 sm:text-sm">
            <span aria-hidden className="text-sm leading-none">
              🔥
            </span>
            <span className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 bg-clip-text text-transparent">
              {headline}
            </span>
          </span>
          <span className="mt-0.5 text-[11px] font-medium text-amber-900/75 sm:text-xs">
            {subline}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default PremiumDiscountPopup;
