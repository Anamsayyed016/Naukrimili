/**
 * @deprecated This implementation is deprecated. Please use checkRateLimit from rate-limit.ts instead.
 * The rate-limit.ts implementation provides better integration with Next.js and predefined configurations
 * for different types of endpoints.
 */

interface RateLimiterOptions {
  windowMs: number;  // The time window in milliseconds
  max: number;      // Max number of requests in the time window
}

interface RateLimitResult {
  success: boolean;
  retryAfter?: number;
}

export class RateLimiter {
  private readonly requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly max: number;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.max = options.max;
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this key
    let requests = this.requests.get(key) || [];

    // Filter out requests outside the current time window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // If within limit, add new request
    if (requests.length < this.max) {
      requests.push(now);
      this.requests.set(key, requests);
      return { success: true };
    }

    // Since we're over the limit, update the list but don't add new request
    this.requests.set(key, requests);

    // Calculate retry after time based on the oldest request
    // We can safely use requests[0] here because we know requests.length >= this.max
    const oldestRequest = requests[0]!;
    const retryAfter = Math.ceil((oldestRequest + this.windowMs - now) / 1000);

    return {
      success: false,
      retryAfter
    };

    /**
     * Note: This implementation will be deprecated in favor of rate-limit.ts.
     * Please update your code to use the checkRateLimit function from rate-limit.ts
     * @deprecated Use checkRateLimit from rate-limit.ts instead
     */
  }

  // Method to clear rate limit data for a key
  clear(key: string): void {
    this.requests.delete(key);
  }

  // Method to clear all rate limit data
  clearAll(): void {
    this.requests.clear();
  }
}
