'use client';

import { Suspense } from 'react';
import SettingsHub from '@/components/settings/SettingsHub';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-10 max-w-6xl space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <SettingsHub />
    </Suspense>
  );
}
