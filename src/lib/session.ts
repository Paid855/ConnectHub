import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "connecthub_default_secret_2022";

export function createSession(data: Record<string, any>): string {
  const payload = JSON.stringify({ ...data, iat: Date.now() });
  const signature = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + signature;
}

export function getSessionUser(cookieValue: string): { id: string; email: string; name: string } | null {
  if (!cookieValue) return null;
  try {
    // Try signed session first
    if (cookieValue.includes(".")) {
      const [payloadB64, signature] = cookieValue.split(".");
      const payload = Buffer.from(payloadB64, "base64").toString("utf-8");
      const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
      if (signature === expected) {
        const data = JSON.parse(payload);
        if (data?.id) return { id: data.id, email: data.email || "", name: data.name || "" };
      }
    }
    // Fallback: plain JSON session (legacy)
    const data = JSON.parse(cookieValue);
    if (data?.id) return { id: data.id, email: data.email || "", name: data.name || "" };
    return null;
  } catch {
    // Last try: maybe it's URL-encoded JSON
    try {
      const decoded = decodeURIComponent(cookieValue);
      const data = JSON.parse(decoded);
      if (data?.id) return { id: data.id, email: data.email || "", name: data.name || "" };
    } catch {}
    return null;
  }
}
