/**
 * Animated Counter Hook
 * Provides smooth number counting animations for stats displays
 */

import { useEffect, useState, useRef } from 'react';

interface UseCounterOptions {
  start?: number;
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  onComplete?: () => void;
  easingFn?: (t: number) => number;
}

// Easing functions
const easingFunctions = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeIn: (t: number) => Math.pow(t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

export function useCounter({
  start = 0,
  end,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  onComplete,
  easingFn = easingFunctions.easeOut,
}: UseCounterOptions) {
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    setIsAnimating(true);
    startTimeRef.current = undefined;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = easingFn(progress);
      const currentCount = start + (end - start) * easedProgress;

      setCount(currentCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        if (onComplete) {
          onComplete();
        }
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, start, easingFn, onComplete]);

  const formatNumber = (value: number) => {
    const fixed = value.toFixed(decimals);
    const parts = fixed.split('.');
    
    // Add thousand separators
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    
    const formatted = parts.join('.');
    return `${prefix}${formatted}${suffix}`;
  };

  return {
    value: count,
    formattedValue: formatNumber(count),
    isAnimating,
    reset: () => setCount(start),
  };
}

// Presets for common use cases
export const useCounterPresets = {
  currency: (end: number, symbol = '$') => 
    useCounter({ end, decimals: 2, prefix: symbol, duration: 1500 }),
  
  percentage: (end: number) => 
    useCounter({ end, decimals: 1, suffix: '%', duration: 1500 }),
  
  compact: (end: number) => {
    const formatCompact = (n: number) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
      return n.toFixed(0);
    };
    return { 
      ...useCounter({ end, duration: 1500 }),
      compactValue: formatCompact(end)
    };
  },
};

export default useCounter;

