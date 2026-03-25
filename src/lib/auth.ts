import { NextRequest } from "next/server";
import { getSessionUser } from "./session";

export function getUserId(req: NextRequest): string | null {
  const cookie = req.cookies.get("session");
  if (!cookie) return null;

  // Try the new signed session
  const session = getSessionUser(cookie.value);
  if (session?.id) return session.id;

  // Try plain JSON parse
  try {
    const data = JSON.parse(cookie.value);
    if (data?.id) return data.id;
  } catch {}

  // Try URL-decoded JSON
  try {
    const decoded = decodeURIComponent(cookie.value);
    const data = JSON.parse(decoded);
    if (data?.id) return data.id;
  } catch {}

  return null;
}
