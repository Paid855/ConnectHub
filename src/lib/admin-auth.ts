import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminSession, AdminSession } from "@/lib/admin-session";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";

export interface AuthedAdminContext {
  session: AdminSession;
  ip: string;
  userAgent: string;
}

/**
 * Verify admin session + DB role + ban status. Returns context or 401 response.
 * Use at the top of every /api/admin/* route handler.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthedAdminContext | NextResponse> {
  const token = req.cookies.get("admin_session")?.value;
  const session = verifyAdminSession(token);
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  // Re-verify role + ban status from DB on EVERY request (defense in depth)
  const u = await prisma.user.findUnique({
    where: { id: session.id },
    select: { role: true, banned: true }
  });
  if (!u || u.role !== "admin" || u.banned) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  return {
    session,
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent") || ""
  };
}

/** Helper to log + return — keeps route handlers clean */
export async function adminAction(
  ctx: AuthedAdminContext,
  action: string,
  meta?: { targetId?: string; targetType?: string; details?: string }
): Promise<void> {
  await logAdminAction({
    adminId: ctx.session.id,
    adminEmail: ctx.session.email,
    action,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    ...meta
  });
}
