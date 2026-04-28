import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  const session = verifyAdminSession(token);
  if (session) {
    await logAdminAction({
      adminId: session.id, adminEmail: session.email,
      action: "logout", ip: getClientIp(req)
    });
  }
  const r = NextResponse.json({ success: true });
  r.cookies.set("admin_session", "", {
    path: "/", maxAge: 0,
    domain: process.env.NODE_ENV === "production" ? ".connecthub.love" : undefined
  });
  return r;
}
