'use client';

import { useEffect } from 'react';

export default function CSSLoader() {
  useEffect(() => {
    // Force CSS recomputation on client side
    if (typeof window !== 'undefined') {
      // Trigger a reflow to ensure CSS is applied
      document.body.offsetHeight;
      
      // Add a class to body to indicate CSS is loaded
      document.body.classList.add('css-loaded');
    }
  }, []);

  return null;
}