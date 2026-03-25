import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || process.env.PAYSTACK_SECRET_KEY || "connecthub_session_secret_2022_change_me";

export function createSession(data: Record<string, any>): string {
  const payload = JSON.stringify({ ...data, iat: Date.now() });
  const signature = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + signature;
}

export function verifySession(token: string): Record<string, any> | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;

    const payload = Buffer.from(payloadB64, "base64").toString("utf-8");
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

    if (signature !== expected) return null;

    const data = JSON.parse(payload);

    // Check if session is expired (7 days)
    if (data.iat && Date.now() - data.iat > 7 * 24 * 60 * 60 * 1000) return null;

    return data;
  } catch {
    return null;
  }
}

export function getSessionUser(cookieValue: string): { id: string; email: string; name: string } | null {
  // Support both old (plain JSON) and new (signed) sessions
  try {
    if (cookieValue.includes(".")) {
      const data = verifySession(cookieValue);
      if (data?.id) return { id: data.id, email: data.email, name: data.name };
      return null;
    }
    // Legacy plain JSON session
    const data = JSON.parse(cookieValue);
    if (data?.id) return { id: data.id, email: data.email, name: data.name };
    return null;
  } catch {
    return null;
  }
}
