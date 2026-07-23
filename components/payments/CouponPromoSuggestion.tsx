'use client';

import { useCallback, useState } from 'react';
import { Caveat } from 'next/font/google';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Check,
  ClipboardCopy,
  Clock,
  Lock,
  Scissors,
  Sparkles,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

const PROMO_CODE = 'FLAT25';

interface CouponPromoSuggestionProps {
  className?: string;
  couponCode?: string;
  onCodeCopied?: (code: string) => void;
}

function ConfettiDot({
  className,
  color,
}: {
  className?: string;
  color: 'amber' | 'indigo' | 'violet';
}) {
  const fill =
    color === 'amber'
      ? 'bg-amber-400'
      : color === 'indigo'
        ? 'bg-indigo-500'
        : 'bg-violet-500';
  return (
    <span
      aria-hidden
      className={cn('absolute h-1.5 w-1.5 rounded-full opacity-80', fill, className)}
    />
  );
}

function ConfettiTri({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'absolute h-0 w-0 border-l-[4px] border-r-[4px] border-b-[7px]',
        'border-l-transparent border-r-transparent border-b-amber-400/90',
        className
      )}
    />
  );
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
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? undefined : { y: -4 }}
    >
      {/* Ambient glow — blue/purple + gold */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-[26px] bg-[radial-gradient(circle_at_20%_15%,rgba(251,191,36,0.45),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(99,102,241,0.28),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.18),transparent_55%)] blur-xl"
        animate={
          reduced
            ? undefined
            : { opacity: [0.45, 0.75, 0.45], scale: [1, 1.03, 1] }
        }
        transition={
          reduced ? undefined : { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      <div
        className={cn(
          'relative overflow-hidden rounded-[22px] sm:rounded-[24px]',
          'border border-amber-200/60 bg-white/95',
          'shadow-[0_16px_40px_-12px_rgba(49,46,129,0.22),0_8px_20px_-10px_rgba(180,83,9,0.28)]',
          'ring-1 ring-inset ring-white/80 backdrop-blur-md'
        )}
      >
        {/* Soft sunburst / rays */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'repeating-conic-gradient(from 0deg at 28% 22%, transparent 0deg 8deg, rgba(148,163,184,0.12) 8deg 9deg)',
          }}
        />

        {/* Soft orange wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-50/90 via-white/40 to-indigo-50/70"
        />

        {/* Corner accents */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-amber-300/30 to-transparent blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-gradient-to-tl from-indigo-400/25 via-violet-300/15 to-transparent blur-2xl"
        />

        {/* Decorative confetti */}
        <ConfettiDot className="left-3 top-14" color="amber" />
        <ConfettiDot className="left-8 top-[4.5rem]" color="indigo" />
        <ConfettiDot className="right-4 top-16" color="violet" />
        <ConfettiDot className="right-8 top-24" color="amber" />
        <ConfettiTri className="left-5 top-20 rotate-12" />
        <ConfettiTri className="right-6 top-[5.5rem] -rotate-45 border-b-indigo-400/80" />
        <Sparkles
          aria-hidden
          className="absolute right-3 top-3 h-3.5 w-3.5 text-amber-500/80"
        />
        <Star
          aria-hidden
          className="absolute bottom-16 left-2.5 h-3 w-3 fill-amber-300 text-amber-400/90"
        />

        {/* Dot grid corner */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-3 grid grid-cols-4 gap-1 opacity-40"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-slate-400/70" />
          ))}
        </div>

        {!reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/45 to-transparent"
            animate={{ x: ['0%', '280%'] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              repeatDelay: 3.5,
              ease: 'easeInOut',
            }}
          />
        )}

        <div className="relative z-[1] space-y-3 px-3.5 py-3.5 sm:px-4 sm:py-4">
          {/* Limited-time ribbon + clock */}
          <div className="flex items-start justify-between gap-2">
            <div className="relative">
              <div className="inline-flex flex-col overflow-hidden rounded-md shadow-md shadow-indigo-900/20">
                <span className="bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white sm:text-[10px]">
                  🔥 Limited Time
                </span>
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-2.5 py-0.5 text-center text-[11px] font-black uppercase tracking-wide text-slate-900 sm:text-xs">
                  Offer!
                </span>
              </div>
            </div>
            <motion.div
              aria-hidden
              className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-800 bg-white shadow-sm sm:h-11 sm:w-11"
              animate={reduced ? undefined : { rotate: [0, 4, 0, -4, 0] }}
              transition={
                reduced
                  ? undefined
                  : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
              }
            >
              <span className="absolute inset-[3px] rounded-full bg-[conic-gradient(from_-90deg,#f59e0b_0deg_90deg,transparent_90deg_360deg)] opacity-90" />
              <span className="absolute inset-[7px] rounded-full bg-white" />
              <Clock className="relative z-[1] h-4 w-4 text-slate-800 sm:h-[18px] sm:w-[18px]" />
            </motion.div>
          </div>

          {/* Headline */}
          <div className="text-center">
            <p
              className={cn(
                caveat.className,
                'text-[1.65rem] font-bold leading-none text-slate-900 sm:text-[1.85rem]'
              )}
            >
              Don&apos;t Miss Out!
            </p>
            <div className="mx-auto mt-2 flex max-w-[11rem] items-center gap-2">
              <span className="h-px flex-1 bg-slate-200" />
              <Star className="h-3 w-3 fill-amber-400 text-amber-500" aria-hidden />
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </div>

          {/* Coupon box */}
          <div className="space-y-1.5">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800 sm:text-[11px]">
              Use Coupon
            </p>
            <motion.button
              type="button"
              onClick={() => void handleCopy()}
              whileHover={
                reduced
                  ? undefined
                  : {
                      scale: 1.015,
                      boxShadow:
                        '0 0 0 3px rgba(251,191,36,0.35), 0 10px 28px -8px rgba(49,46,129,0.55)',
                    }
              }
              whileTap={reduced ? undefined : { scale: 0.985 }}
              className={cn(
                'group relative flex w-full items-center justify-center overflow-hidden',
                'rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950',
                'px-3 py-3 shadow-[0_10px_24px_-8px_rgba(49,46,129,0.55)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2'
              )}
              aria-label={`Copy coupon code ${couponCode}`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-[5px] rounded-lg border border-dashed border-white/55"
              />
              <span className="relative font-mono text-xl font-black tracking-[0.28em] text-white sm:text-2xl">
                {couponCode}
              </span>
              <Scissors
                aria-hidden
                className="absolute bottom-1.5 right-2 h-3.5 w-3.5 text-white/70 transition-colors group-hover:text-amber-300"
              />
              <ClipboardCopy
                aria-hidden
                className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/50 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-70"
              />
            </motion.button>
          </div>

          {/* Discount hierarchy */}
          <div className="space-y-1.5 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-6 bg-orange-400/80" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                Get
              </span>
              <span className="h-px w-6 bg-orange-400/80" />
            </div>
            <p className="bg-gradient-to-b from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-[2rem] font-black leading-none tracking-tight text-transparent sm:text-[2.25rem]">
              25% OFF
            </p>
            <span className="inline-flex rounded-full bg-gradient-to-r from-slate-900 to-indigo-950 px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-sm">
              Instantly
            </span>
            <p className="pt-0.5 text-[12px] font-semibold text-slate-800 sm:text-[13px]">
              <span className="mr-1 text-emerald-600" aria-hidden>
                ✔
              </span>
              Save{' '}
              <span className="font-extrabold text-orange-600">₹50</span> Today
            </p>
          </div>

          {/* Copy CTA */}
          <motion.button
            type="button"
            onClick={() => void handleCopy()}
            whileHover={reduced ? undefined : { y: -2, scale: 1.01 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            animate={
              reduced
                ? undefined
                : {
                    boxShadow: [
                      '0 8px 22px -6px rgba(234,88,12,0.45)',
                      '0 12px 28px -6px rgba(245,158,11,0.55)',
                      '0 8px 22px -6px rgba(234,88,12,0.45)',
                    ],
                  }
            }
            transition={
              reduced
                ? undefined
                : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
            }
            className={cn(
              'relative flex w-full min-h-11 items-center justify-center gap-2 overflow-hidden',
              'rounded-full px-4 py-2.5',
              'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500',
              'text-[13px] font-extrabold uppercase tracking-wide text-slate-900',
              'transition-[filter] hover:brightness-105',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'
            )}
            aria-label={
              copied
                ? 'Coupon copied to clipboard'
                : `Copy coupon code ${couponCode} to clipboard`
            }
          >
            {!reduced && (
              <motion.span
                key={rippleKey}
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full bg-white/35"
                initial={{ scale: 0, opacity: 0.7 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-700" aria-hidden />
                  <span>Coupon Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-4 w-4" aria-hidden />
                  <span>Copy Coupon</span>
                </>
              )}
            </span>
            <span
              aria-hidden
              className="relative ml-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white"
            >
              →
            </span>
          </motion.button>

          <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 sm:text-[11px]">
            <Lock className="h-3 w-3 shrink-0" aria-hidden />
            Offer valid for limited time only.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default CouponPromoSuggestion;
