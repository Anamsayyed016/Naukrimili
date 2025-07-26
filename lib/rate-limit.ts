import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const configs: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15min
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per min
  upload: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per min
  search: { windowMs: 60 * 1000, maxRequests: 50 }, // 50 per min
};

export function checkRateLimit(
  req: NextRequest,
  type: keyof typeof configs = 'api'
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = configs[type];
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
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetTime: record.resetTime };
}

function getClientIdentifier(req: NextRequest): string {
  return req.ip || req.headers.get('x-forwarded-for') || 'unknown';
}

// Cleanup expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);