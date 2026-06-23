'use client';

import dynamic from 'next/dynamic';

const ShadcnToaster = dynamic(
  () => import('@/components/ui/toaster').then((m) => m.Toaster),
  { ssr: false }
);

const SonnerToaster = dynamic(() => import('sonner').then((m) => m.Toaster), {
  ssr: false,
});

/** Toast UI deferred to reduce main-thread work during first paint. */
export default function DeferredToasters() {
  return (
    <>
      <ShadcnToaster />
      <SonnerToaster richColors position="top-right" />
    </>
  );
}
