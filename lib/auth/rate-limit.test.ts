import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, clearRateLimits, resetRateLimit } from "./rate-limit";

describe("Authentication rate limiter", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it("allows requests under the limit", () => {
    const res1 = checkRateLimit("user:123", 3, 60_000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit("user:123", 3, 60_000);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit("user:123", 3, 60_000);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests that exceed the limit", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("ip:1.2.3.4", 5, 60_000);
    }
    const blocked = checkRateLimit("ip:1.2.3.4", 5, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets limits when explicitly requested", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("user:reset", 3, 60_000);
    }
    expect(checkRateLimit("user:reset", 3, 60_000).allowed).toBe(false);

    resetRateLimit("user:reset");
    expect(checkRateLimit("user:reset", 3, 60_000).allowed).toBe(true);
  });
});
