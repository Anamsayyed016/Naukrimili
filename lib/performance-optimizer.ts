import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Debounce a callback
export function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as unknown as T;
}

// Throttle a callback
export function useThrottle<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const lastCall = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      callback(...args);
      lastCall.current = now;
    } else {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        callback(...args);
        lastCall.current = Date.now();
      }, delay - (now - lastCall.current));
    }
  }, [callback, delay]) as unknown as T;
}

// Lazy load items
export function useLazyLoad<T>(items: T[], pageSize: number = 10) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const endIndex = page * pageSize;
    const newItems = items.slice(0, endIndex);
    setDisplayedItems(newItems);
    setHasMore(endIndex < items.length);
  }, [items, page, pageSize]);

  const loadMore = useCallback(() => {
    if (hasMore) setPage((prev) => prev + 1);
  }, [hasMore]);

  return { displayedItems, hasMore, loadMore, reset: () => setPage(1) };
}

// Deep memo by dependency array (caller constructs deps)
export function useDeepMemo<T>(value: T, deps: any[]): T {
  return useMemo(() => value, deps);
}

// Intersection observer
export function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const elementRef = useCallback((node: Element | null) => {
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, options);
    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return { elementRef, isIntersecting, entry };
}

// Simple list virtualization helper
export function useVirtualization<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 1, items.length);
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop),
  };
}

// Image optimization query params
export function useImageOptimization(
  src: string,
  options: { width?: number; height?: number; quality?: number; format?: 'webp' | 'jpeg' | 'png' } = {}
) {
  const { width, height, quality = 75, format = 'webp' } = options;
  const optimizedSrc = useMemo(() => {
    if (!src) return src;
    if (src.startsWith('/') || src.startsWith('http')) {
      const params = new URLSearchParams();
      if (width) params.append('w', String(width));
      if (height) params.append('h', String(height));
      params.append('q', String(quality));
      params.append('f', format);
      return `${src}?${params.toString()}`;
    }
    return src;
  }, [src, width, height, quality, format]);
  return optimizedSrc;
}

// Dynamic import helper
export function useDynamicImport<T>(importFn: () => Promise<{ default: T }>, fallback?: T) {
  const [Component, setComponent] = useState<T | null>(fallback || null);
  const [loading, setLoading] = useState(!fallback);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!fallback) {
      setLoading(true);
      importFn()
        .then((module) => {
          if (!cancelled) {
            setComponent(module.default);
            setError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err : new Error('Dynamic import failed'));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [importFn, fallback]);

  return { Component, loading, error };
}

// Performance monitor
export function usePerformanceMonitor() {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    lastRenderTime.current = currentTime;
  });

  return {
    get renderCount() {
      return renderCount.current;
    },
    get timeSinceLastRender() {
      return performance.now() - lastRenderTime.current;
    },
  };
}

// Cleanup effect wrapper
export function useCleanupEffect(effect: () => void | (() => void), deps: any[] = []) {
  useEffect(() => {
    const cleanup = effect();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, deps);
}

// Simple request cache
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function useCachedRequest<T>(key: string, requestFn: () => Promise<T>, ttl: number = 5 * 60 * 1000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeRequest = useCallback(async () => {
    const cached = cache.get(key);
    const now = Date.now();
    if (cached && now - cached.timestamp < cached.ttl) {
      setData(cached.data as T);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await requestFn();
      cache.set(key, { data: result, timestamp: now, ttl });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Request failed'));
    } finally {
      setLoading(false);
    }
  }, [key, requestFn, ttl]);

  useEffect(() => {
    executeRequest();
  }, [executeRequest]);

  return { data, loading, error, refetch: executeRequest };
}