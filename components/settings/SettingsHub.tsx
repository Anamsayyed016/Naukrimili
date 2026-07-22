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
    <div className="space-y-3">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
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
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
      <div className="mb-4">
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
