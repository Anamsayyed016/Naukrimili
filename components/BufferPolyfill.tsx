"use client";

import { useEffect } from 'react';

export default function BufferPolyfill() {
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined' && !window.Buffer) {
      try {
        // Dynamic import to avoid SSR issues
        import('buffer').then(({ Buffer }) => {
          window.Buffer = Buffer;
        }).catch(() => {
          // Silently fail if buffer module is not available
          console.warn('Buffer polyfill not available');
        });
      } catch (error) {
        // Silently fail
        console.warn('Failed to load Buffer polyfill:', error);
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
