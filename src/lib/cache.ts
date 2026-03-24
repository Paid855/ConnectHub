// Simple in-memory cache for frequently accessed data
const cache: Record<string, { data: any; expires: number }> = {};

export function getCache(key: string) {
  const item = cache[key];
  if (!item || Date.now() > item.expires) return null;
  return item.data;
}

export function setCache(key: string, data: any, ttlMs: number = 30000) {
  cache[key] = { data, expires: Date.now() + ttlMs };
}

export function clearCache(prefix?: string) {
  if (prefix) {
    Object.keys(cache).forEach(k => { if (k.startsWith(prefix)) delete cache[k]; });
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
  }
}
