/**
 * lib/cache/questionCache.ts
 * ─────────────────────────────────────────────────────────────────────
 * 3.1 — Question Generation Cache
 *
 * Strategy: In-memory LRU cache (no Redis dependency for local dev).
 * Production: If UPSTASH_REDIS_REST_URL is set, uses Upstash Redis.
 *
 * Cache key: `questions:{categoryId}:{difficulty}`
 * Cache value: array of question IDs from the last successful generation
 * TTL: 24 hours (86400 seconds)
 *
 * Flow:
 *   1. Before calling Gemini, check cache for this category+difficulty.
 *   2. If cache has >= `minCount` IDs → return them directly (no AI call).
 *   3. After a successful Gemini call → store new IDs in cache.
 * ─────────────────────────────────────────────────────────────────────
 */

const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHED_IDS = 50

interface CacheEntry {
  ids: string[]
  expiresAt: number
}

// ── In-memory fallback (always available) ───────────────────────────
const memCache = new Map<string, CacheEntry>()

function makeKey(categoryId: string, difficulty: string): string {
  return `questions:${categoryId}:${difficulty}`
}

// ── Upstash Redis via REST API (no SDK required) ─────────────────────
interface UpstashClient {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, ttl: number) => Promise<void>
  del: (key: string) => Promise<void>
}

function getRedis(): UpstashClient | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  return {
    async get(key: string): Promise<string | null> {
      const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers })
      const json = await res.json() as { result: string | null }
      return json.result
    },
    async set(key: string, value: string, ttl: number): Promise<void> {
      await fetch(`${url}/set/${encodeURIComponent(key)}`, {
        method: 'POST', headers,
        body: JSON.stringify([value, 'EX', ttl]),
      })
    },
    async del(key: string): Promise<void> {
      await fetch(`${url}/del/${encodeURIComponent(key)}`, { method: 'POST', headers })
    },
  }
}

/**
 * Get cached question IDs for a category+difficulty.
 * Returns null if cache is cold or expired.
 */
export async function getCachedQuestionIds(
  categoryId: string,
  difficulty: string
): Promise<string[] | null> {
  const key = makeKey(categoryId, difficulty)

  // 1. Try Upstash
  const redis = getRedis()
  if (redis) {
    try {
      const raw = await redis.get(key)
      if (raw) {
        const ids = JSON.parse(raw) as string[]
        console.log(`[QuestionCache] Redis HIT — ${ids.length} IDs for ${key}`)
        return ids
      }
    } catch (err: unknown) {
      console.warn('[QuestionCache] Redis GET error — falling back to memory:', err)
    }
  }

  // 2. Try in-memory
  const entry = memCache.get(key)
  if (entry && entry.expiresAt > Date.now()) {
    console.log(`[QuestionCache] Memory HIT — ${entry.ids.length} IDs for ${key}`)
    return entry.ids
  }

  console.log(`[QuestionCache] MISS for ${key}`)
  return null
}

/**
 * Store question IDs in the cache after a successful generation.
 * Merges with existing IDs (up to MAX_CACHED_IDS) to build up a rich pool.
 */
export async function cacheQuestionIds(
  categoryId: string,
  difficulty: string,
  newIds: string[]
): Promise<void> {
  const key = makeKey(categoryId, difficulty)
  const expiresAt = Date.now() + TTL_MS

  // Merge with existing IDs
  const existing = (await getCachedQuestionIds(categoryId, difficulty)) ?? []
  const merged = [...new Set([...existing, ...newIds])].slice(-MAX_CACHED_IDS)

  // Write to in-memory
  memCache.set(key, { ids: merged, expiresAt })

  // Write to Upstash (async, fail-silent)
  const redis = getRedis()
  if (redis) {
    redis.set(key, JSON.stringify(merged), Math.floor(TTL_MS / 1000))
      .catch((err: unknown) => console.warn('[QuestionCache] Redis SET error:', err))
  }

  console.log(`[QuestionCache] Stored ${merged.length} IDs for ${key}`)
}

/**
 * Invalidate the cache for a specific category+difficulty.
 * Call this when questions are bulk-deleted from the admin panel.
 */
export async function invalidateCache(
  categoryId: string,
  difficulty?: string
): Promise<void> {
  const difficulties = difficulty ? [difficulty] : ['easy', 'medium', 'hard']
  for (const diff of difficulties) {
    const key = makeKey(categoryId, diff)
    memCache.delete(key)
    const redis = getRedis()
    if (redis) {
      redis.del(key).catch(() => {})
    }
  }
  console.log(`[QuestionCache] Invalidated cache for category ${categoryId}`)
}
