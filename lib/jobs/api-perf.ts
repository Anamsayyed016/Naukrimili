/**
 * Lightweight timing helpers for job API routes (no duplicate cache/logger).
 */

export const EXTERNAL_API_TIMEOUT_MS = parseInt(
  process.env.EXTERNAL_API_TIMEOUT_MS || '10000',
  10
);
export const EXTERNAL_COUNTRY_CAP = 2;

export type JobApiTimings = {
  totalMs?: number;
  prismaMs?: number;
  externalMs?: number;
  upsertMs?: number;
  cacheHit?: boolean;
};

/**
 * Wait for all promises; each may time out individually — never drops already-finished results.
 */
export function settleAllWithTimeout<T>(
  promises: Promise<T>[],
  ms: number
): Promise<PromiseSettledResult<T>[]> {
  if (promises.length === 0) return Promise.resolve([]);
  return Promise.allSettled(
    promises.map((p) =>
      Promise.race([
        p,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), ms)
        ),
      ])
    )
  );
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = 'operation'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function logJobApiTiming(
  route: string,
  timings: JobApiTimings,
  extra?: Record<string, unknown>
): void {
  const parts = [
    `[jobs-perf] ${route}`,
    timings.cacheHit ? 'cache=hit' : 'cache=miss',
    timings.prismaMs != null ? `prisma=${timings.prismaMs}ms` : null,
    timings.externalMs != null ? `external=${timings.externalMs}ms` : null,
    timings.upsertMs != null ? `upsert=${timings.upsertMs}ms` : null,
    timings.totalMs != null ? `total=${timings.totalMs}ms` : null,
  ].filter(Boolean);
  console.log(parts.join(' '), extra ?? '');
}

export function buildUnlimitedCacheKey(params: Record<string, string | number | boolean>): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('|');
}
