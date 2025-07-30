import { useState, useEffect, useRef, useCallback } from 'react';

// Debounce hook for search inputs and API calls
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

// Throttle hook for scroll events and frequent updates
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const callbackRef = useRef(callback);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= limit) {
        callbackRef.current(...args);
        lastRan.current = Date.now();
      }
    }) as T,
    [limit]
  );
}

// Advanced debounce with immediate execution option
export function useAdvancedDebounce<T>(
  value: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): T {
  const { leading = false, trailing = true, maxWait } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const maxTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCallTime = useRef<number | undefined>(undefined);
  const lastInvokeTime = useRef(0);

  const invokeFunc = useCallback(() => {
    setDebouncedValue(value);
    lastInvokeTime.current = Date.now();
  }, [value]);

  const leadingEdge = useCallback(() => {
    lastInvokeTime.current = Date.now();
    if (leading) {
      invokeFunc();
    }
  }, [leading, invokeFunc]);

  const remainingWait = useCallback((time: number) => {
    const timeSinceLastCall = time - (lastCallTime.current || 0);
    const timeSinceLastInvoke = time - lastInvokeTime.current;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }, [delay, maxWait]);

  const shouldInvoke = useCallback((time: number) => {
    const timeSinceLastCall = time - (lastCallTime.current || 0);
    const timeSinceLastInvoke = time - lastInvokeTime.current;

    return (
      lastCallTime.current === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }, [delay, maxWait]);

  const trailingEdge = useCallback(() => {
    if (trailing && lastCallTime.current !== undefined) {
      invokeFunc();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = undefined;
    }
    lastCallTime.current = undefined;
  }, [trailing, invokeFunc]);

  const timerExpired = useCallback(() => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      trailingEdge();
    } else {
      const remaining = remainingWait(time);
      timeoutRef.current = setTimeout(timerExpired, remaining);
    }
  }, [shouldInvoke, trailingEdge, remainingWait]);

  useEffect(() => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    lastCallTime.current = time;

    if (isInvoking) {
      if (timeoutRef.current === undefined) {
        leadingEdge();
      }
      if (maxWait !== undefined) {
        maxTimeoutRef.current = setTimeout(trailingEdge, maxWait);
      }
    }

    if (timeoutRef.current === undefined && lastCallTime.current !== undefined) {
      timeoutRef.current = setTimeout(timerExpired, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [value, delay, shouldInvoke, leadingEdge, trailingEdge, timerExpired, maxWait]);

  return debouncedValue;
}