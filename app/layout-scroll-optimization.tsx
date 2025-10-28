'use client';

import { useEffect } from 'react';

/**
 * Client-side scroll performance optimization
 * Applies smooth scroll behavior and performance hints
 */
export function ScrollOptimization(): null {
  useEffect(() => {
    // Add passive event listeners for better scroll performance
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
        });
      }
      ticking = true;
    };

    // Use passive listeners for better performance
    document.addEventListener('touchmove', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    // Optimize heavy elements
    const optimizeElements = () => {
      // Add GPU acceleration hints to animated elements
      const animatedElements = document.querySelectorAll('[class*="motion-"], .group, [class*="animate-"]');
      animatedElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.willChange = 'transform, opacity';
          el.style.transform = 'translateZ(0)';
        }
      });
    };

    // Run initial optimization
    optimizeElements();

    // Re-optimize after navigation
    const observer = new MutationObserver(optimizeElements);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener('touchmove', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return null;
}

