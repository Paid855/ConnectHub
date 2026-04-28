const URL = process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

async function redis(cmd: string[]): Promise<any> {
  if (!URL || !TOKEN) return null;
  const r = await fetch(URL + "/" + cmd.map(encodeURIComponent).join("/"), {
    headers: { Authorization: "Bearer " + TOKEN },
    cache: "no-store",
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data.result;
}

export async function checkRateLimit(key: string, maxAttempts = 5, windowSec = 900): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const k = "rl:admin:" + key;
  const count = await redis(["INCR", k]);
  if (count === null) return { allowed: true, remaining: maxAttempts, resetIn: 0 };
  if (count === 1) await redis(["EXPIRE", k, String(windowSec)]);
  const ttl = await redis(["TTL", k]);
  const remaining = Math.max(0, maxAttempts - count);
  return { allowed: count <= maxAttempts, remaining, resetIn: typeof ttl === "number" ? ttl : windowSec };
}

export async function clearRateLimit(key: string): Promise<void> {
  await redis(["DEL", "rl:admin:" + key]);
}
