import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// ===== DEBOUNCE UTILITY =====
export function useDebounce<T extends (...args: Record<string, unknown>[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {;
        clearTimeout(timeoutRef.current)}
      timeoutRef.current = setTimeout(() => callback(...args), delay)},
    [callback, delay]
  ) as T}

// ===== THROTTLE UTILITY =====
export function useThrottle<T extends (...args: Record<string, unknown>[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const lastCallTimer = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {;
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        callback(...args);
        lastCall.current = now} else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current)}
        lastCallTimer.current = setTimeout(() => {
          callback(...args);
          lastCall.current = Date.now()}, delay - (now - lastCall.current))}
    },
    [callback, delay]
  ) as T}

// ===== LAZY LOADING UTILITY =====
export function useLazyLoad<T>(
  items: T[],
  pageSize: number = 10
) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const endIndex = page * pageSize;
    const newItems = items.slice(0, endIndex);
    setDisplayedItems(newItems);
    setHasMore(endIndex < items.length)}, [items, page, pageSize]);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setPage(prev => prev + 1)}
  }, [hasMore]);

  return {
    displayedItems,
    hasMore,
    loadMore,
    reset: () => setPage(1)}}

// ===== MEMOIZATION UTILITY =====
export function useDeepMemo<T>(value: T, deps: Record<string, unknown>[]): T {
  return useMemo(() => value, deps)}

// ===== INTERSECTION OBSERVER HOOK =====
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const elementRef = useCallback((node: Element | null) => {
    if (node !== null) {
      const observer = new IntersectionObserver(([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry)}, options);

      observer.observe(node);
      return () => observer.disconnect()}
  }, [options]);

  return { elementRef, isIntersecting, entry }}

// ===== VIRTUALIZATION UTILITY =====
export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },}))}, [items, itemHeight, containerHeight, scrollTop]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {;
      setScrollTop(e.currentTarget.scrollTop)},
  }}

// ===== IMAGE OPTIMIZATION =====
export function useImageOptimization(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png'} = {}
) {
  const { width, height, quality = 75, format = 'webp' } = options;

  const optimizedSrc = useMemo(() => {
    if (!src) return src;

    // If using Next.js Image optimization
    if (src.startsWith('/') || src.startsWith('http')) {
      const params = new URLSearchParams();
      if (width) params.append('w', width.toString());
      if (height) params.append('h', height.toString());
      params.append('q', quality.toString());
      params.append('f', format);

      return `${src}?${params.toString()}`}

    return src}, [src, width, height, quality, format]);

  return optimizedSrc}

// ===== BUNDLE SIZE OPTIMIZATION =====
export function useDynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
) {
  const [Component, setComponent] = useState<T | null>(fallback || null);
  const [loading, setLoading] = useState(!fallback);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!fallback) {
      setLoading(true);
      importFn()
        .then((module) => {
          setComponent(module.default);
          setError(null)})
        .catch((err) => {
          setError(err);
          console.error('Dynamic import failed:', err)})
        .finally(() => {
          setLoading(false)})}
  }, [importFn, fallback]);

  return { Component, loading, error }}

// ===== PERFORMANCE MONITORING =====
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    
    if (process.env.NODE_ENV === 'development') {}
    
    lastRenderTime.current = currentTime});

  return {
    renderCount: renderCount.current,
    timeSinceLastRender: performance.now() - lastRenderTime.current,}}

// ===== MEMORY LEAK PREVENTION =====
export function useCleanupEffect(
  effect: () => void | (() => void),
  deps: Record<string, unknown>[] = []
) {
  useEffect(() => {
    const cleanup = effect();
    return () => {
      if (typeof cleanup === 'function') {;
        cleanup()}
    }}, deps)}

// ===== REQUEST CACHING =====
const cache = new Map<string, { data: Record<string, unknown>; timestamp: number; ttl: number }>();

export function useCachedRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeRequest = useCallback(async () => {
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < cached.ttl) {
      setData(cached.data);
      return}

    setLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      cache.set(key, { data: result, timestamp: now, ttl });
      setData(result)} catch (err) {
      setError(err instanceof Error ? err : new Error('Request failed'))} finally {
      setLoading(false)}
  }, [key, requestFn, ttl]);

  useEffect(() => {
    executeRequest()}, [executeRequest]);

  return { data, loading, error, refetch: executeRequest }} 