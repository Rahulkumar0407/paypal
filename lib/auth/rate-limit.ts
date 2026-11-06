/**
 * In-memory sliding-window rate limiter for sensitive authentication actions.
 * Protects against brute-force password guessing and registration flooding.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

/**
 * Checks whether an action keyed by `key` exceeds `limit` within `windowMs`.
 * Returns { allowed: boolean, remaining: number, retryAfterSeconds: number }.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const record = store.get(key) ?? { timestamps: [] };
  // Filter out timestamps outside the active window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0] ?? now;
    const retryAfterMs = oldest + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.timestamps.push(now);
  store.set(key, record);

  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Resets rate limit for a specific key (useful after successful login or in tests).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Clears all rate limit records (for testing).
 */
export function clearRateLimits(): void {
  store.clear();
}
