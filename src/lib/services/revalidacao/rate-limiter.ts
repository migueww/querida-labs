interface LimitState {
  attempts: number;
  lockUntil: number;
}

export class ClearBaseRateLimiter {
  private static limitMap = new Map<string, LimitState>();
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  private static getOrCreateState(key: string): LimitState {
    let state = this.limitMap.get(key);
    if (!state) {
      state = { attempts: 0, lockUntil: 0 };
      this.limitMap.set(key, state);
    }
    return state;
  }

  /**
   * Checks if the key is allowed to perform the action.
   * Handles lock expiration automatically.
   */
  public static checkLimit(key: string): {
    allowed: boolean;
    remainingAttempts: number;
    lockTimeRemainingMs: number;
  } {
    const state = this.getOrCreateState(key);
    const now = Date.now();

    if (state.lockUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockTimeRemainingMs: state.lockUntil - now,
      };
    }

    // If lock expired, reset attempts
    if (state.lockUntil > 0 && state.lockUntil <= now) {
      state.attempts = 0;
      state.lockUntil = 0;
    }

    return {
      allowed: true,
      remainingAttempts: Math.max(0, this.MAX_ATTEMPTS - state.attempts),
      lockTimeRemainingMs: 0,
    };
  }

  /**
   * Records a failed attempt for the key.
   * If attempts reach MAX_ATTEMPTS, locks the key.
   */
  public static recordFailure(key: string): {
    remainingAttempts: number;
    lockTimeRemainingMs: number;
  } {
    const state = this.getOrCreateState(key);
    const now = Date.now();

    // If already locked, just return the state
    if (state.lockUntil > now) {
      return {
        remainingAttempts: 0,
        lockTimeRemainingMs: state.lockUntil - now,
      };
    }

    state.attempts += 1;

    if (state.attempts >= this.MAX_ATTEMPTS) {
      state.lockUntil = now + this.LOCK_DURATION_MS;
      return {
        remainingAttempts: 0,
        lockTimeRemainingMs: this.LOCK_DURATION_MS,
      };
    }

    return {
      remainingAttempts: this.MAX_ATTEMPTS - state.attempts,
      lockTimeRemainingMs: 0,
    };
  }

  /**
   * Resets the attempts and locks for the key upon success.
   */
  public static recordSuccess(key: string): void {
    this.limitMap.delete(key);
  }

  /**
   * For testing purposes, allows resetting the entire map or a key.
   */
  public static reset(key?: string): void {
    if (key) {
      this.limitMap.delete(key);
    } else {
      this.limitMap.clear();
    }
  }
}
