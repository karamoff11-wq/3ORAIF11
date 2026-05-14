/**
 * lib/security/rateLimit.ts
 * ─────────────────────────
 * In-memory sliding-window rate limiter.
 * No Redis dependency required for current scale.
 * Each Next.js server process maintains its own map.
 * For multi-instance deployments, swap the Map for an Upstash Redis client.
 */

interface RateEntry {
  count: number
  windowStart: number
}

// Key: `${endpoint}:${identifier}` → rate entry
const store = new Map<string, RateEntry>()

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > 3_600_000) {
      store.delete(key)
    }
  }
}, 300_000)

export interface RateLimitConfig {
  /** Number of requests allowed per window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  /** Remaining requests in this window */
  remaining: number
  /** Seconds until the window resets */
  retryAfter: number
}

/**
 * Check & increment rate limit for a given identifier.
 *
 * @param identifier  User ID or IP address
 * @param endpoint    Logical endpoint name, e.g. 'generate-questions'
 * @param config      Limit rules
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${endpoint}:${identifier}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= config.windowMs) {
    // Start a fresh window
    store.set(key, { count: 1, windowStart: now })
    return { success: true, remaining: config.limit - 1, retryAfter: 0 }
  }

  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((config.windowMs - (now - entry.windowStart)) / 1000)
    return { success: false, remaining: 0, retryAfter }
  }

  entry.count += 1
  return {
    success: true,
    remaining: config.limit - entry.count,
    retryAfter: 0,
  }
}

// ── Pre-configured limits ────────────────────────────────────────────────

/** Game question generation: max 10 per user per hour */
export const GENERATE_QUESTIONS_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
}

/** Admin AI generator: max 20 per user per hour */
export const ADMIN_GENERATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowMs: 60 * 60 * 1000,
}

/** Generic IP fallback: max 60 per IP per minute */
export const IP_BURST_LIMIT: RateLimitConfig = {
  limit: 60,
  windowMs: 60 * 1000,
}
