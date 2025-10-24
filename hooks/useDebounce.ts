import { useState, useEffect, useRef, useCallback } from 'react';

// Simple value debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Debounced callback
// Debounced callback with strict type safety
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(callback: T, delay: number): T {
  const cbRef = useRef<T>(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => { 
    cbRef.current = callback; 
  }, [callback]);
  
  useEffect(() => { 
    return () => { 
      if (timeoutRef.current) clearTimeout(timeoutRef.current); 
    }; 
  }, []);
  
  const fn = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => cbRef.current(...args), delay);
  }, [delay]);
  
  return fn as T;
}

// Throttle value
export function useThrottle<T>(value: T, limit: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastRan = useRef(Date.now());
  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottled(value);
        lastRan.current = Date.now();
      }
    }, Math.max(0, limit - (Date.now() - lastRan.current)));
    return () => clearTimeout(handler);
  }, [value, limit]);
  return throttled;
}

// Throttled callback
// Throttled callback with strict type safety
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(callback: T, limit: number): T {
  const cbRef = useRef<T>(callback);
  const lastRan = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => { 
    cbRef.current = callback; 
  }, [callback]);
  
  const fn = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = limit - (now - lastRan.current);
    if (remaining <= 0) {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      lastRan.current = now;
      cbRef.current(...args);
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        lastRan.current = Date.now();
        timeoutRef.current = null;
        cbRef.current(...args);
      }, remaining);
    }
  }, [limit]);
  
  useEffect(() => { 
    return () => { 
      if (timeoutRef.current) clearTimeout(timeoutRef.current); 
    }; 
  }, []);
  
  return fn as T;
}

// Advanced debounce (leading/trailing + maxWait)
interface AdvancedOptions { leading?: boolean; trailing?: boolean; maxWait?: number }
export function useAdvancedDebounce<T>(value: T, delay: number, options: AdvancedOptions = {}): T {
  const { leading = false, trailing = true, maxWait } = options;
  const [debounced, setDebounced] = useState(value);
  const lastInvokeRef = useRef<number>(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const invoke = useCallback(() => {
    setDebounced(valueRef.current);
    lastInvokeRef.current = Date.now();
  }, []);

  useEffect(() => {
    const now = Date.now();
    const timeSince = now - lastInvokeRef.current;
    const shouldLead = leading && !timeoutRef.current;
    if (shouldLead) invoke();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (trailing && (!leading || timeSince >= delay)) invoke();
      timeoutRef.current = null;
    }, delay);
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        if (!leading || timeSince >= maxWait) invoke();
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        if (maxTimeoutRef.current) { clearTimeout(maxTimeoutRef.current); maxTimeoutRef.current = null; }
      }, maxWait);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
      timeoutRef.current = null;
      maxTimeoutRef.current = null;
    };
  }, [value, delay, leading, trailing, maxWait, invoke]);

  return debounced;
}
