'use client';

import { useEffect, type ReactNode } from 'react';
import { getRouteStylesheetId, removeRouteStylesheetLinks } from '@/lib/route-stylesheet-marker';

type RouteLayoutStylesProps = {
  layoutId: string;
  children: ReactNode;
};

/**
 * Removes route-scoped stylesheet <link>s on unmount so App Router soft navigation
 * cannot leave Tailwind route bundles active on unrelated pages (e.g. homepage hero).
 */
export function RouteLayoutStyles({ layoutId, children }: RouteLayoutStylesProps) {
  useEffect(() => {
    const claimLoaded = () => {
      document.querySelectorAll('head link[rel="stylesheet"]').forEach((node) => {
        const link = node as HTMLLinkElement;
        if (getRouteStylesheetId(link) === layoutId) {
          link.dataset.nmRouteLayout = layoutId;
        }
      });
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLLinkElement && node.rel === 'stylesheet') {
            const onLoad = () => {
              if (getRouteStylesheetId(node) === layoutId) {
                node.dataset.nmRouteLayout = layoutId;
              }
            };
            if (node.sheet) {
              onLoad();
            } else {
              node.addEventListener('load', onLoad, { once: true });
            }
          }
        }
      }
    });

    observer.observe(document.head, { childList: true });
    claimLoaded();
    const t0 = window.setTimeout(claimLoaded, 0);
    const t1 = window.setTimeout(claimLoaded, 50);

    return () => {
      observer.disconnect();
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      removeRouteStylesheetLinks(layoutId);
    };
  }, [layoutId]);

  return <>{children}</>;
}
