'use client';

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { BackButton } from '@/components/ui/back-button';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { SettingsDataProvider } from '@/components/settings/SettingsDataProvider';
import {
  isSettingsSectionId,
  type SettingsSectionId,
} from '@/components/settings/nav';

const AccountSection = lazy(
  () => import('@/components/settings/sections/AccountSection')
);
const ProfileSection = lazy(
  () => import('@/components/settings/sections/ProfileSection')
);
const JobPreferencesSection = lazy(
  () => import('@/components/settings/sections/JobPreferencesSection')
);
const ResumeSection = lazy(
  () => import('@/components/settings/sections/ResumeSection')
);
const NotificationsSection = lazy(
  () => import('@/components/settings/sections/NotificationsSection')
);
const PrivacySection = lazy(
  () => import('@/components/settings/sections/PrivacySection')
);
const SecuritySection = lazy(
  () => import('@/components/settings/sections/SecuritySection')
);
const BillingSection = lazy(
  () => import('@/components/settings/sections/BillingSection')
);
const PreferencesSection = lazy(
  () => import('@/components/settings/sections/PreferencesSection')
);
const HelpSection = lazy(
  () => import('@/components/settings/sections/HelpSection')
);

function SectionFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

function renderSection(section: SettingsSectionId) {
  switch (section) {
    case 'account':
      return <AccountSection />;
    case 'profile':
      return <ProfileSection />;
    case 'job-preferences':
      return <JobPreferencesSection />;
    case 'resume':
      return <ResumeSection />;
    case 'notifications':
      return <NotificationsSection />;
    case 'privacy':
      return <PrivacySection />;
    case 'security':
      return <SecuritySection />;
    case 'billing':
      return <BillingSection />;
    case 'preferences':
      return <PreferencesSection />;
    case 'help':
      return <HelpSection />;
    default:
      return <AccountSection />;
  }
}

function SettingsHubInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sectionParam = searchParams?.get('section');
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(
    isSettingsSectionId(sectionParam) ? sectionParam : 'account'
  );

  useEffect(() => {
    if (isSettingsSectionId(sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  const onSectionChange = useCallback(
    (id: SettingsSectionId) => {
      setActiveSection(id);
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('section', id);
      router.replace(`/settings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08),_transparent_55%),linear-gradient(to_bottom,#f8fafc,#ffffff)]"
      />
      <div className="container mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="mb-5">
          <BackButton fallbackUrl="/dashboard/jobseeker" label="Back" />
        </div>
        <SettingsShell
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        >
          <Suspense fallback={<SectionFallback />}>
            {renderSection(activeSection)}
          </Suspense>
        </SettingsShell>
      </div>
    </div>
  );
}

export default function SettingsHub() {
  return (
    <AuthGuard>
      <SettingsDataProvider>
        <SettingsHubInner />
      </SettingsDataProvider>
    </AuthGuard>
  );
}
