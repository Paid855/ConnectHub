import { NextRequest } from "next/server";

export function getUserId(req: NextRequest): string | null {
  const cookie = req.cookies.get("session");
  if (!cookie) return null;

  try {
    // Plain JSON
    const data = JSON.parse(cookie.value);
    if (data?.id) return data.id;
  } catch {}

  try {
    // URL-encoded JSON
    const decoded = decodeURIComponent(cookie.value);
    const data = JSON.parse(decoded);
    if (data?.id) return data.id;
  } catch {}

  try {
    // Signed session (base64.signature)
    if (cookie.value.includes(".")) {
      const payload = Buffer.from(cookie.value.split(".")[0], "base64").toString("utf-8");
      const data = JSON.parse(payload);
      if (data?.id) return data.id;
    }
  } catch {}

  return null;
}
