// Simple in-memory fixed-window rate limiter, per process.
// Fine for a single-instance deployment; if this app ever moves to multiple
// instances/serverless, this needs to move to a shared store instead.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

let callsSinceSweep = 0;
const SWEEP_INTERVAL = 500;

const sweepExpired = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export const checkRateLimit = (key: string, limit: number, windowMs: number): RateLimitResult => {
  const now = Date.now();

  callsSinceSweep += 1;
  if (callsSinceSweep >= SWEEP_INTERVAL) {
    callsSinceSweep = 0;
    sweepExpired(now);
  }

  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
};

export const getClientIp = (request: Request): string => {
  const ipFromRuntime = (request as { ip?: string }).ip;
  if (ipFromRuntime) {
    return ipFromRuntime;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
};
