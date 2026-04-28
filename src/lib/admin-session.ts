import crypto from "crypto";

const SECRET = process.env.ADMIN_SECRET || "";
if (!SECRET || SECRET.length < 32) {
  console.error("ADMIN_SECRET missing or too short");
}

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export function signAdminSession(payload: Omit<AdminSession, "iat" | "exp">, ttlSeconds = 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const data: AdminSession = { ...payload, iat: now, exp: now + ttlSeconds };
  const json = JSON.stringify(data);
  const body = Buffer.from(json).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return body + "." + sig;
}

export function verifyAdminSession(token: string | undefined): AdminSession | null {
  if (!token || !SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data: AdminSession = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (Math.floor(Date.now() / 1000) > data.exp) return null;
    if (data.role !== "admin") return null;
    return data;
  } catch { return null; }
}
