'use client';

import { useRef, useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import {
  Plus,
  Upload,
  Wallet,
  Sparkles,
  ShieldCheck,
  Download,
  BarChart3,
  Wand2,
  FileCheck2,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/components/ui/use-mobile';
import ResumeStartFeatures from './ResumeStartFeatures';
import { cn } from '@/lib/utils';

const HERO_IMAGE =
  'https://res.cloudinary.com/drot7xb9m/image/upload/q_auto/f_auto/v1779366031/naukrimilimg_bqeki3.png';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

const floatLoop = {
  y: [0, -10, 0],
  transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
};

function GradientOrbs({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl"
        animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-300/25 blur-3xl"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  );
}

function HeroBadgeRow() {
  const items = [
    { icon: ShieldCheck, label: 'ATS-friendly structure', tone: 'teal' },
    { icon: Sparkles, label: 'AI writing assist', tone: 'violet' },
    { icon: Download, label: 'Instant PDF export', tone: 'sky' },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ icon: Icon, label, tone }) => (
        <Badge
          key={label}
          variant="outline"
          className={cn(
            'gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md',
            tone === 'teal' && 'border-teal-200/80 bg-teal-50/80 text-teal-800',
            tone === 'violet' && 'border-violet-200/80 bg-violet-50/80 text-violet-800',
            tone === 'sky' && 'border-sky-200/80 bg-sky-50/80 text-sky-800'
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label}
        </Badge>
      ))}
    </div>
  );
}

function GlassMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
  delay = 0,
  reduced,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  className?: string;
  delay?: number;
  reduced: boolean;
}) {
  const cardClass = cn(
    'rounded-2xl border border-slate-100/90 bg-white/95 p-3 shadow-[0_8px_24px_-8px_rgba(148,163,184,0.25)] backdrop-blur-sm',
    className
  );

  if (reduced) {
    return (
      <div className={cardClass}>
        <MetricCardContent title={title} value={value} subtitle={subtitle} Icon={Icon} />
      </div>
    );
  }

  return (
    <motion.div
      className={cardClass}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <MetricCardContent title={title} value={value} subtitle={subtitle} Icon={Icon} />
    </motion.div>
  );
}

function MetricCardContent({
  title,
  value,
  subtitle,
  Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  Icon: LucideIcon;
}) {
  return (
    <>
      <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5 text-teal-600" aria-hidden />
        {title}
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </>
  );
}

function MagneticCta({
  children,
  onClick,
  className,
  variant = 'primary',
  reduced,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  reduced: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (reduced || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      x.set((e.clientX - rect.left - rect.width / 2) * 0.12);
      y.set((e.clientY - rect.top - rect.height / 2) * 0.12);
    },
    [reduced, x, y]
  );

  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const base =
    variant === 'primary'
      ? 'bg-gradient-to-r from-teal-600 via-teal-600 to-violet-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30'
      : variant === 'outline'
        ? 'border-2 border-slate-200/90 bg-white/80 text-slate-800 hover:border-teal-300 hover:bg-white'
        : 'border border-slate-200/80 bg-slate-50/90 text-slate-700 hover:bg-white';

  if (reduced) {
    return (
      <Button onClick={onClick} size="lg" className={cn('h-12 rounded-xl px-6 font-semibold', base, className)}>
        {children}
      </Button>
    );
  }

  return (
    <motion.div style={{ x: springX, y: springY }} className="inline-flex">
      <Button
        ref={ref}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        size="lg"
        className={cn(
          'h-12 rounded-xl px-6 text-base font-semibold transition-shadow md:h-14 md:px-8',
          base,
          className
        )}
      >
        {children}
      </Button>
    </motion.div>
  );
}

/** Landscape hero asset — intrinsic sizing avoids portrait crop + harsh box shadow */
const HERO_IMAGE_WIDTH = 960;
const HERO_IMAGE_HEIGHT = 620;

function HeroResumeImage() {
  const [useNativeImg, setUseNativeImg] = useState(false);
  const alt = 'Professional resume preview built with Naukrimili Resume Builder';
  const imgClass = 'h-auto w-full max-w-full object-contain object-center';

  if (useNativeImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={HERO_IMAGE} alt={alt} width={HERO_IMAGE_WIDTH} height={HERO_IMAGE_HEIGHT} className={imgClass} />
    );
  }

  return (
    <Image
      src={HERO_IMAGE}
      alt={alt}
      width={HERO_IMAGE_WIDTH}
      height={HERO_IMAGE_HEIGHT}
      className={imgClass}
      priority
      unoptimized
      sizes="(max-width: 768px) 100vw, 520px"
      onError={() => setUseNativeImg(true)}
    />
  );
}

function HeroVisual({ reduced, isMobile }: { reduced: boolean; isMobile: boolean }) {
  const imageBlock = (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-teal-100/40 via-white to-violet-100/30 blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-slate-100 sm:p-3 sm:rounded-3xl">
        <HeroResumeImage />
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-xl">
      {reduced ? (
        imageBlock
      ) : (
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          animate={floatLoop}
        >
          {imageBlock}
        </motion.div>
      )}

      <GlassMetricCard
        reduced={reduced}
        title="ATS score"
        value="92%"
        subtitle="Keyword alignment"
        icon={FileCheck2}
        className="absolute -left-2 top-8 z-10 w-[140px] md:-left-6 md:w-[155px]"
        delay={0.2}
      />
      <GlassMetricCard
        reduced={reduced}
        title="AI suggest"
        value="12 tips"
        subtitle="Role-tailored edits"
        icon={Wand2}
        className="absolute -right-1 bottom-24 z-10 w-[140px] md:-right-4 md:w-[155px]"
        delay={0.35}
      />
      {!isMobile && (
        <GlassMetricCard
          reduced={reduced}
          title="Analytics"
          value="4.8×"
          subtitle="More recruiter views"
          icon={BarChart3}
          className="absolute -bottom-2 left-8 z-10 w-[155px]"
          delay={0.5}
        />
      )}

      <motion.div
        aria-hidden
        className="absolute -right-3 top-16 hidden rounded-full border border-amber-200/80 bg-amber-50/95 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-[0_4px_14px_-4px_rgba(251,191,36,0.35)] sm:flex"
        {...(!reduced && {
          animate: { scale: [1, 1.04, 1] },
          transition: { duration: 3, repeat: Infinity },
        })}
      >
        <Zap className="mr-1 inline h-3.5 w-3.5" />
        Live preview
      </motion.div>
    </div>
  );
}

export default function ResumeBuilderStart() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const reduced = useReducedMotion();

  const handleCreateNew = () => router.push('/resume-builder/templates');
  const handleImport = () => router.push('/resumes/upload?intent=builder');
  const handlePricing = () => router.push('/pricing');

  const MotionSection = reduced ? 'section' : motion.section;
  const motionProps = reduced
    ? {}
    : { initial: 'hidden', animate: 'visible', variants: { visible: { transition: { staggerChildren: 0.06 } } } };

  return (
    <MotionSection
      {...motionProps}
      className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_4px_32px_-8px_rgba(148,163,184,0.22)]"
      aria-labelledby="resume-builder-hero-title"
    >
      <GradientOrbs reduced={!!reduced} />

      <div className="relative px-5 py-10 sm:px-8 md:px-10 md:py-14 lg:px-14 lg:py-16">
        <div
          className={cn(
            'grid items-center gap-10 lg:gap-14',
            isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_0.95fr]'
          )}
        >
          {/* Copy + CTAs */}
          <div className="flex flex-col justify-center space-y-6 md:space-y-8">
            <motion.div variants={fadeUp} className="space-y-4">
              <HeroBadgeRow />
              <h1
                id="resume-builder-hero-title"
                className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
              >
                Build a resume that{' '}
                <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-violet-600 bg-clip-text text-transparent">
                  clears ATS
                </span>{' '}
                and wins interviews
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                Naukrimili&apos;s resume studio pairs recruiter-ready templates with AI guidance and
                real-time scoring—so every section earns attention, not silence.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap', isMobile && 'w-full')}
            >
              <MagneticCta reduced={!!reduced} onClick={handleCreateNew} className={isMobile ? 'w-full' : ''}>
                <Plus className="mr-2 h-5 w-5" aria-hidden />
                Start new resume
              </MagneticCta>
              <MagneticCta
                reduced={!!reduced}
                variant="outline"
                onClick={handleImport}
                className={isMobile ? 'w-full' : ''}
              >
                <Upload className="mr-2 h-5 w-5" aria-hidden />
                Import existing
              </MagneticCta>
              <MagneticCta
                reduced={!!reduced}
                variant="ghost"
                onClick={handlePricing}
                className={isMobile ? 'w-full' : ''}
              >
                <Wallet className="mr-2 h-5 w-5" aria-hidden />
                View plans
              </MagneticCta>
            </motion.div>

            {isMobile && (
              <motion.div variants={fadeUp}>
                <HeroVisual reduced={!!reduced} isMobile />
              </motion.div>
            )}

            <motion.div variants={fadeUp}>
              <ResumeStartFeatures />
            </motion.div>
          </div>

          {/* Hero visual — desktop */}
          {!isMobile && (
            <motion.div variants={fadeUp} className="flex justify-center lg:justify-end">
              <HeroVisual reduced={!!reduced} isMobile={false} />
            </motion.div>
          )}
        </div>

        {/* Trust strip */}
        <motion.footer
          variants={fadeUp}
          className="mt-12 border-t border-slate-200/80 pt-8 text-center md:mt-14"
        >
          <p className="text-sm font-medium text-slate-600">
            Trusted by job seekers building careers across India
          </p>
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 md:text-sm">
            <li className="flex items-center gap-1.5">
              <span className="text-teal-600" aria-hidden>
                ✓
              </span>{' '}
              Free to start
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-teal-600" aria-hidden>
                ✓
              </span>{' '}
              ATS-compatible exports
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-teal-600" aria-hidden>
                ✓
              </span>{' '}
              PDF &amp; DOCX download
            </li>
            <li>
              <Link
                href="/resume-builder/templates"
                className="font-medium text-teal-700 underline-offset-4 hover:underline"
              >
                Browse templates
              </Link>
            </li>
          </ul>
        </motion.footer>
      </div>
    </MotionSection>
  );
}
