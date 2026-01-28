function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple API-driven rate limiter that spaces requests evenly across the window
export const rateLimiter = {
  remaining: 100, // Local estimate (decremented on start, synced on response)
  limit: 100,
  minRemaining: 1, // Buffer to avoid hitting exact limit
  resetAt: 0, // Unix timestamp in seconds
  nextAllowedAt: 0, // Next request allowed at (ms timestamp)
  running: 0,
  maxConcurrent: 5,
  acquireLock: Promise.resolve(), // Serialize acquire calls

  async waitIfNeeded() {
    // Serialize access so requests are released one at a time with proper spacing
    const previousLock = this.acquireLock;
    let releaseLock: () => void;
    this.acquireLock = new Promise<void>(resolve => {
      releaseLock = resolve;
    });

    await previousLock;

    try {
      // Wait if too many concurrent requests
      while (this.running >= this.maxConcurrent) {
        await sleep(50);
      }

      // If rate limit is exhausted, wait for reset
      if (this.remaining <= this.minRemaining && this.resetAt > 0) {
        const waitMs = this.resetAt * 1000 - Date.now() + 1000; // +1s buffer
        if (waitMs > 0) {
          // console.log(`[Rate Limit] Waiting ${(waitMs / 1000).toFixed(1)}s for API reset (${this.remaining}/${this.limit} remaining)`);
          await sleep(waitMs);
          this.remaining = this.limit;
          this.nextAllowedAt = 0;
        }
      }

      // Wait until next allowed time (spaced evenly)
      const now = Date.now();
      if (this.nextAllowedAt > now) {
        await sleep(this.nextAllowedAt - now);
      }

      // Calculate interval for next request
      if (this.resetAt > 0 && this.remaining > 0) {
        const msUntilReset = this.resetAt * 1000 - Date.now();
        if (msUntilReset > 0) {
          const interval = msUntilReset / this.remaining;
          this.nextAllowedAt = Date.now() + interval;
        }
      }

      // Decrement remaining NOW (API counts on receive, not on response)
      this.remaining--;
      this.running++;
    } finally {
      releaseLock();
    }
  },

  update(headers: { get: (name: string) => string | null }) {
    const remaining = headers.get('x-ratelimit-remaining');
    const limit = headers.get('x-ratelimit-limit');
    const reset = headers.get('x-ratelimit-reset');

    if (remaining !== null) {
      this.remaining = parseInt(remaining);
      this.limit = parseInt(limit) || 100;
      this.resetAt = parseInt(reset) || 0;

      // const msUntilReset = this.resetAt * 1000 - Date.now();
      // const interval = msUntilReset > 0 && this.remaining > 0 ? (msUntilReset / this.remaining).toFixed(0) : '?';
      // console.log(`[Rate Limit] ${this.remaining}/${this.limit} remaining, ${(msUntilReset / 1000).toFixed(0)}s until reset, ~${interval}ms/req | ${this.running} running`);
    }
  },

  done() {
    this.running--;
  },
};
