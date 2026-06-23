'use client';

import { useEffect } from 'react';

/**
 * Passive scroll listeners only — avoids willChange/MutationObserver overhead
 * that previously touched every animated node on the page.
 */
export function ScrollOptimization(): null {
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
        });
      }
      ticking = true;
    };

    document.addEventListener('touchmove', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('touchmove', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return null;
}
