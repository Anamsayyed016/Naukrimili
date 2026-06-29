'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function trackMetaPageView(): void {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
}

/**
 * Fires Meta Pixel PageView on App Router client navigations.
 * Initial PageView is sent by ThirdPartyScripts init — skip first mount to avoid duplicates.
 */
export default function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);
  const query = searchParams.toString();

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    trackMetaPageView();
  }, [pathname, query]);

  return null;
}
