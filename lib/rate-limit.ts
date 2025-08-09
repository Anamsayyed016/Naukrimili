import { NextRequest } from 'next/server';

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
};

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const configs: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  api: { windowMs: 60 * 1000, maxRequests: 100 },
  upload: { windowMs: 60 * 1000, maxRequests: 10 },
  search: { windowMs: 60 * 1000, maxRequests: 50 },
  default: { windowMs: 60 * 1000, maxRequests: 60 },
};

export function checkRateLimit(req: NextRequest, type: keyof typeof configs = 'api'): RateLimitResult {
  const config = configs[type] ?? configs.default;
  const identifier = getClientIdentifier(req);
  const key = `${type}:${identifier}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + config.windowMs };
    rateLimitStore.set(key, record);
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: record.resetTime };
  }

  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetTime: record.resetTime, retryAfter };
  }

  record.count += 1;
  rateLimitStore.set(key, record);
  return { allowed: true, remaining: config.maxRequests - record.count, resetTime: record.resetTime };
}

function getClientIdentifier(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}

// Legacy class (optional)
export class RateLimiter {
  private readonly requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly max: number;

  constructor(options: { windowMs: number; max: number }) {
    this.windowMs = options.windowMs;
    this.max = options.max;
  }

  async check(key: string): Promise<{ success: boolean; retryAfter?: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let requests = this.requests.get(key) || [];
    requests = requests.filter((timestamp) => timestamp > windowStart);

    if (requests.length < this.max) {
      requests.push(now);
      this.requests.set(key, requests);
      return { success: true };
    }

    this.requests.set(key, requests);
    const oldestRequest = requests[0] ?? now;
    const retryAfter = Math.ceil((oldestRequest + this.windowMs - now) / 1000);
    return { success: false, retryAfter };
  }

  clear(key: string): void {
    this.requests.delete(key);
  }

  clearAll(): void {
    this.requests.clear();
  }
}

// Cleanup expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) rateLimitStore.delete(key);
  }
}, 60000);

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };
  if (result.retryAfter) headers['Retry-After'] = result.retryAfter.toString();
  return headers;
}

export function isRateLimited(result: RateLimitResult): boolean {
  return !result.allowed;
}