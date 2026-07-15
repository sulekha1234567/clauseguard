import { describe, expect, it } from "vitest";

import { RateLimitError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests up to the limit, then throws", () => {
    const key = `test-${Math.random()}`;
    const opts = { limit: 3, windowMs: 10_000 };

    expect(() => rateLimit(key, opts)).not.toThrow();
    expect(() => rateLimit(key, opts)).not.toThrow();
    expect(() => rateLimit(key, opts)).not.toThrow();
    expect(() => rateLimit(key, opts)).toThrow(RateLimitError);
  });

  it("tracks separate keys independently", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    const opts = { limit: 1, windowMs: 10_000 };

    expect(() => rateLimit(a, opts)).not.toThrow();
    expect(() => rateLimit(b, opts)).not.toThrow(); // different key, fresh bucket
    expect(() => rateLimit(a, opts)).toThrow(RateLimitError);
  });
});
