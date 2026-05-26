'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Sparkles,
  ArrowRight,
  Bookmark,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  Layers,
  Loader2,
  Wand2,
  ScrollText,
  Award,
  Check,
} from 'lucide-react';

import AuthGuard from '@/components/auth/AuthGuard';
import { cn } from '@/lib/utils';
import {
  WORKSPACE_ROUTES,
  WorkspaceId,
  persistWorkspacePreference,
  refreshWorkspacePreferenceFromServer,
  setCachedWorkspacePreference,
} from '@/lib/preferences/workspace-preference';

type WorkspaceCardDef = {
  id: WorkspaceId;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  route: string;
  gradient: string;
  ringGradient: string;
  iconGradient: string;
  accent: string;
  icon: typeof Briefcase;
  features: Array<{ icon: typeof Briefcase; label: string }>;
};

const WORKSPACES: WorkspaceCardDef[] = [
  {
    id: 'jobs',
    emoji: '\uD83D\uDCBC',
    title: 'Find Jobs',
    subtitle: 'Job Seeker Dashboard',
    description:
      'AI-matched roles, application tracking, saved jobs, top companies and live interview updates — all in one workspace.',
    cta: 'Go to Job Dashboard',
    route: WORKSPACE_ROUTES.jobs,
    gradient: 'from-sky-500 via-indigo-500 to-violet-600',
    ringGradient: 'from-sky-400/70 via-indigo-400/70 to-violet-400/70',
    iconGradient: 'from-sky-500 via-indigo-500 to-violet-600',
    accent: 'text-indigo-600',
    icon: Briefcase,
    features: [
      { icon: Sparkles, label: 'AI Job Matching' },
      { icon: CheckCircle2, label: 'Track Applications' },
      { icon: Bookmark, label: 'Saved Jobs' },
      { icon: Building2, label: 'Companies' },
      { icon: CalendarClock, label: 'Interview Updates' },
    ],
  },
  {
    id: 'resume-builder',
    emoji: '\u2728',
    title: 'Build Premium Resume',
    subtitle: 'Resume Studio',
    description:
      'ATS-optimized builder, AI rewriting, premium templates, smart cover letters and a real-time resume score.',
    cta: 'Open Resume Studio',
    route: WORKSPACE_ROUTES['resume-builder'],
    gradient: 'from-rose-500 via-fuchsia-500 to-violet-600',
    ringGradient: 'from-rose-400/70 via-fuchsia-400/70 to-violet-400/70',
    iconGradient: 'from-rose-500 via-fuchsia-500 to-violet-600',
    accent: 'text-fuchsia-600',
    icon: Wand2,
    features: [
      { icon: FileText, label: 'ATS Resume Builder' },
      { icon: Sparkles, label: 'AI Resume Optimization' },
      { icon: Layers, label: 'Premium Templates' },
      { icon: ScrollText, label: 'Cover Letter Generator' },
      { icon: Award, label: 'Resume Score' },
    ],
  },
];

function WorkspaceSelectorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [remember, setRemember] = useState(true);
  const [pendingId, setPendingId] = useState<WorkspaceId | null>(null);

  // Sync the server-side saved preference into the local cache on first paint.
  // If the user already saved a preference and arrives here via the navbar's
  // "Switch Workspace" link, we still let them choose — but the cache stays
  // accurate so future logins respect it.
  useEffect(() => {
    void refreshWorkspacePreferenceFromServer();
  }, []);

  const firstName = useMemo(() => {
    const user = session?.user as { firstName?: string; name?: string | null } | undefined;
    const direct = user?.firstName?.trim();
    if (direct) return direct;
    const fromName = user?.name?.trim().split(/\s+/)[0];
    return fromName || 'there';
  }, [session]);

  const handleSelect = async (workspace: WorkspaceCardDef) => {
    if (pendingId) return;
    setPendingId(workspace.id);

    // Update the local cache immediately so this device feels instant.
    setCachedWorkspacePreference(remember ? workspace.id : null);

    // Fire-and-forget DB write (the redirect should never block on it).
    void persistWorkspacePreference(workspace.id, remember);

    // Honor an explicit ?redirect= override if provided (e.g. payment flow).
    const explicit = searchParams?.get('redirect') ?? null;
    const target =
      explicit && explicit.startsWith('/') ? explicit : workspace.route;

    router.push(target);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04060f] text-white">
      {/* Ambient background — matches the new hero aesthetic for product consistency */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(20,184,166,0.18), transparent 55%),' +
            'radial-gradient(circle at 85% 80%, rgba(217,70,239,0.18), transparent 55%),' +
            'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.12), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-teal-400/35 via-indigo-500/25 to-fuchsia-500/25 blur-3xl opacity-70 animate-[hero-orb_18s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-fuchsia-500/30 via-indigo-500/20 to-teal-500/20 blur-3xl opacity-60 animate-[hero-orb_22s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage:
            'radial-gradient(circle at 50% 35%, black 50%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(circle at 50% 35%, black 50%, transparent 80%)',
        }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {/* Floating AI badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/85 ring-1 ring-white/15 backdrop-blur-md sm:text-xs"
        >
          <Sparkles className="h-3.5 w-3.5 text-teal-300" aria-hidden />
          AI Career Workspace
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-300" />
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
        >
          Welcome back,{' '}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-teal-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
              {firstName}
            </span>
            <span
              aria-hidden
              className="absolute inset-x-0 -bottom-1 h-1 rounded-full bg-gradient-to-r from-teal-400/0 via-indigo-400/70 to-fuchsia-400/0 blur-sm"
            />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-xl text-center text-sm font-light text-white/65 sm:text-base"
        >
          What would you like to do today? Pick a workspace to get started — you can switch any time from the navbar.
        </motion.p>

        {/* Workspace cards */}
        <div className="mt-10 grid w-full grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
          {WORKSPACES.map((ws, idx) => {
            const Icon = ws.icon;
            const isPending = pendingId === ws.id;
            const isOtherPending = pendingId !== null && !isPending;

            return (
              <motion.button
                key={ws.id}
                type="button"
                onClick={() => handleSelect(ws)}
                disabled={isOtherPending}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.18 + idx * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.985 }}
                className={cn(
                  'group/card relative block w-full overflow-visible rounded-3xl text-left transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30',
                  isOtherPending && 'pointer-events-none opacity-50'
                )}
                aria-label={`Open ${ws.title}`}
              >
                {/* Animated glow ring */}
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -inset-[2px] rounded-3xl bg-gradient-to-r opacity-50 blur-md transition-opacity duration-500 group-hover/card:opacity-90',
                    ws.ringGradient
                  )}
                />
                {/* Card surface — dark glass */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-3xl bg-slate-950/65 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-white/12"
                />
                {/* Subtle inner gradient sheen */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_60%)]"
                />

                <div className="relative flex h-full flex-col p-6 sm:p-7">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)] sm:h-14 sm:w-14',
                        'bg-gradient-to-br',
                        ws.iconGradient
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'absolute -inset-1 rounded-2xl bg-gradient-to-br opacity-60 blur-md transition-opacity duration-300 group-hover/card:opacity-90',
                          ws.iconGradient
                        )}
                      />
                      <Icon className="relative h-6 w-6 text-white sm:h-7 sm:w-7" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                        {ws.subtitle}
                      </div>
                      <h2 className="mt-0.5 flex items-center gap-2 text-lg font-bold tracking-tight text-white sm:text-xl">
                        <span aria-hidden className="text-base sm:text-lg">
                          {ws.emoji}
                        </span>
                        {ws.title}
                      </h2>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-white/70">
                    {ws.description}
                  </p>

                  {/* Feature list */}
                  <ul className="mt-5 space-y-2.5">
                    {ws.features.map((feature) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <li
                          key={feature.label}
                          className="flex items-center gap-2.5 text-[13px] text-white/80"
                        >
                          <span
                            className={cn(
                              'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/8 ring-1 ring-white/15',
                              ws.accent
                            )}
                          >
                            <FeatureIcon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <span>{feature.label}</span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA row */}
                  <div className="mt-6 flex items-center justify-between gap-3 pt-2">
                    <span className="text-sm font-semibold text-white/90">
                      {ws.cta}
                    </span>
                    <span
                      className={cn(
                        'relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition-all duration-300',
                        'group-hover/card:bg-white group-hover/card:ring-white/40'
                      )}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-white transition-colors duration-300 group-hover/card:text-slate-900" aria-hidden />
                      )}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Remember choice */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-white/8 px-4 py-2 ring-1 ring-white/12 backdrop-blur-md"
        >
          <button
            type="button"
            role="checkbox"
            aria-checked={remember}
            onClick={() => setRemember((v) => !v)}
            className={cn(
              'relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all duration-200',
              remember
                ? 'bg-gradient-to-br from-teal-400 to-indigo-500 ring-1 ring-white/40 shadow-[0_4px_12px_-4px_rgba(99,102,241,0.6)]'
                : 'bg-white/10 ring-1 ring-white/25 hover:bg-white/15'
            )}
          >
            {remember && <Check className="h-3.5 w-3.5 text-white" aria-hidden />}
          </button>
          <label
            className="cursor-pointer text-xs font-medium text-white/85 sm:text-sm"
            onClick={() => setRemember((v) => !v)}
          >
            Remember my choice for next time
          </label>
        </motion.div>

        <p className="mt-3 text-center text-[11px] text-white/40 sm:text-xs">
          You can switch workspaces any time from the navbar.
        </p>
      </main>
    </div>
  );
}

export default function WorkspaceSelectorPage() {
  return (
    <AuthGuard allowedRoles={['jobseeker']} redirectTo="/auth/signin">
      <WorkspaceSelectorContent />
    </AuthGuard>
  );
}
