'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import type { ReactNode } from 'react';

/** Smaller framer-motion bundle — same animations via `m.*` components. */
export { m, domAnimation };

export function LazyMotionShell({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
