import { RateLimitError } from "@/lib/errors";

type Bucket = { count: number; resetAt: number };

/**
 * Minimal fixed-window rate limiter kept in module memory. It is intentionally
 * simple: good enough to blunt abuse of the (paid) AI endpoints in a single
 * instance. For multi-instance production, swap the Map for Redis/Upstash —
 * the call sites do not change.
 */
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): void {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return;
  }

  if (existing.count >= opts.limit) {
    const secs = Math.ceil((existing.resetAt - now) / 1000);
    throw new RateLimitError(`Rate limit exceeded. Try again in ${secs}s.`);
  }

  existing.count += 1;
}

// Opportunistic cleanup so the Map doesn't grow unbounded.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }, 60_000).unref?.();
}
