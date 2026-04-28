import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminSession } from "@/lib/admin-session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  const session = verifyAdminSession(token);
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  // Re-verify role from DB on every request
  const u = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, banned: true, adminLastLogin: true }
  });
  if (!u || u.role !== "admin" || u.banned) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  return NextResponse.json({ user: u });
}
