import { api } from './client';

// ─────────────────────────────────────────────────────────────────────────────
// In-memory GET cache — deduplicates simultaneous requests and caches responses
// for CACHE_TTL_MS ms to prevent redundant API calls across components.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 30_000; // 30 seconds

interface CacheEntry { data: unknown; expiresAt: number }
const requestCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function buildCacheKey(url: string, params?: unknown): string {
  return params ? `${url}::${JSON.stringify(params)}` : url;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cachedGet<T = any>(url: string, params?: unknown, ttl = CACHE_TTL_MS): Promise<T> {
  const key = buildCacheKey(url, params);
  const cached = requestCache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.data as T;
  const inflight = inFlightRequests.get(key);
  if (inflight) return inflight as Promise<T>;
  const promise = api
    .get<T>(url, params ? { params } : undefined)
    .then(res => {
      requestCache.set(key, { data: res.data, expiresAt: Date.now() + ttl });
      inFlightRequests.delete(key);
      return res.data;
    })
    .catch(err => { inFlightRequests.delete(key); throw err; });
  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Invalidate cached GET responses whose key starts with `pathPrefix`.
 * Call after create / update / delete mutations. Omit to clear entire cache.
 */
export function invalidateApiCache(pathPrefix?: string): void {
  if (!pathPrefix) { requestCache.clear(); return; }
  for (const key of requestCache.keys()) {
    if (key.startsWith(pathPrefix)) requestCache.delete(key);
  }
}
