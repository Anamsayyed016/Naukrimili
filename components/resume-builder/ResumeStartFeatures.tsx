'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, CheckCircle2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Smart section suggestions',
    accent: 'from-violet-500/10 to-violet-600/5 border-violet-200/70',
  },
  {
    icon: CheckCircle2,
    title: 'ATS Optimized',
    description: 'Passes screening systems',
    accent: 'from-teal-500/10 to-teal-600/5 border-teal-200/70',
  },
  {
    icon: Palette,
    title: 'Pro Templates',
    description: 'Editor-ready layouts',
    accent: 'from-sky-500/10 to-sky-600/5 border-sky-200/70',
  },
];

export default function ResumeStartFeatures() {
  const reduced = useReducedMotion();

  return (
    <div className="w-full" role="list" aria-label="Resume builder highlights">
      <div className="flex flex-wrap items-stretch justify-start gap-3 md:gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const Wrapper = reduced ? 'div' : motion.div;
          const motionProps = reduced
            ? {}
            : {
                initial: { opacity: 0, y: 12 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true },
                transition: { delay: index * 0.08, duration: 0.4 },
                whileHover: { y: -3 },
              };

          return (
            <Wrapper
              key={feature.title}
              role="listitem"
              {...motionProps}
              className={cn(
                'flex min-w-[140px] flex-1 items-center gap-3 rounded-2xl border bg-gradient-to-br p-3 backdrop-blur-md sm:min-w-[160px] md:p-4',
                'shadow-sm transition-shadow hover:shadow-md',
                feature.accent
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-slate-200/60">
                <Icon className="h-5 w-5 text-slate-700" aria-hidden />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">{feature.title}</span>
                <span className="text-xs text-slate-600">{feature.description}</span>
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
