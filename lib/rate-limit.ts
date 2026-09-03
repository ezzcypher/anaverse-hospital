/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Scope: a single server instance. Counters reset on redeploy and are not
 * shared between instances — for a multi-instance deployment, swap the Map for
 * a shared store (Upstash Redis / Vercel KV) behind this same interface.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 20_000;

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (0 when allowed). */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    if (buckets.size > MAX_KEYS) {
      for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }

  existing.count += 1;
  return { ok: true, retryAfter: 0 };
}

/**
 * Apply several named limits at once; the first breach wins. Lets an endpoint
 * enforce both a burst limit and a slower sustained limit.
 */
export function rateLimitMany(
  checks: { key: string; limit: number; windowMs: number }[],
): RateLimitResult {
  let worst: RateLimitResult = { ok: true, retryAfter: 0 };
  for (const c of checks) {
    const r = rateLimit(c.key, c.limit, c.windowMs);
    if (!r.ok) return r;
    if (r.retryAfter > worst.retryAfter) worst = r;
  }
  return worst;
}
