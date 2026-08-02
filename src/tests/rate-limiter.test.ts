import { describe, it, expect, beforeEach, vi } from "vitest";
import { ClearBaseRateLimiter } from "../lib/services/revalidacao/rate-limiter";

describe("ClearBaseRateLimiter", () => {
  const testEmail = "test@example.com";

  beforeEach(() => {
    ClearBaseRateLimiter.reset();
  });

  it("should allow first checking when no attempts are made", () => {
    const check = ClearBaseRateLimiter.checkLimit(testEmail);
    expect(check.allowed).toBe(true);
    expect(check.remainingAttempts).toBe(3);
    expect(check.lockTimeRemainingMs).toBe(0);
  });

  it("should decrement attempts on failure and lock after 3 failures", () => {
    // 1st failure
    let fail = ClearBaseRateLimiter.recordFailure(testEmail);
    expect(fail.remainingAttempts).toBe(2);
    expect(fail.lockTimeRemainingMs).toBe(0);

    let check = ClearBaseRateLimiter.checkLimit(testEmail);
    expect(check.allowed).toBe(true);
    expect(check.remainingAttempts).toBe(2);

    // 2nd failure
    fail = ClearBaseRateLimiter.recordFailure(testEmail);
    expect(fail.remainingAttempts).toBe(1);

    // 3rd failure (locks the key)
    fail = ClearBaseRateLimiter.recordFailure(testEmail);
    expect(fail.remainingAttempts).toBe(0);
    expect(fail.lockTimeRemainingMs).toBeGreaterThan(0);

    // Should now be blocked
    check = ClearBaseRateLimiter.checkLimit(testEmail);
    expect(check.allowed).toBe(false);
    expect(check.remainingAttempts).toBe(0);
    expect(check.lockTimeRemainingMs).toBeGreaterThan(0);
  });

  it("should reset attempts after success", () => {
    ClearBaseRateLimiter.recordFailure(testEmail);
    ClearBaseRateLimiter.recordFailure(testEmail);

    let check = ClearBaseRateLimiter.checkLimit(testEmail);
    expect(check.remainingAttempts).toBe(1);

    // Record success
    ClearBaseRateLimiter.recordSuccess(testEmail);

    // Should reset back to 3
    check = ClearBaseRateLimiter.checkLimit(testEmail);
    expect(check.allowed).toBe(true);
    expect(check.remainingAttempts).toBe(3);
  });

  it("should unlock automatically after lock time expires", () => {
    vi.useFakeTimers();

    // Lock it
    ClearBaseRateLimiter.recordFailure(testEmail);
    ClearBaseRateLimiter.recordFailure(testEmail);
    ClearBaseRateLimiter.recordFailure(testEmail);

    let check = ClearBaseRateLimiter.checkLimit(testEmail);
    expect(check.allowed).toBe(false);

    // Fast-forward time by 15 minutes + 1 second
    vi.advanceTimersByTime(15 * 60 * 1000 + 1000);

    check = ClearBaseRateLimiter.checkLimit(testEmail);
    expect(check.allowed).toBe(true);
    expect(check.remainingAttempts).toBe(3);

    vi.useRealTimers();
  });
});
