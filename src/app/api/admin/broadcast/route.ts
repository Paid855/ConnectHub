import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

function getAdminId(req: NextRequest): string | null {
  try {
    const c = req.cookies.get("admin_session")?.value;
    if (!c) return null;
    return JSON.parse(c).id || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const adminId = getAdminId(req);
  if (!adminId) return NextResponse.json({ error: "Not admin" }, { status: 401 });

  const { title, message, type } = await req.json();
  if (!title || !message) return NextResponse.json({ error: "Title and message required" }, { status: 400 });

  const users = await prisma.user.findMany({
    where: { tier: { not: "banned" }, email: { not: "admin@connecthub.com" } },
    select: { id: true }
  });

  let sent = 0;
  for (const user of users) {
    try {
      await createNotification(user.id, type || "announcement", title, message, null);
      sent++;
    } catch {}
  }

  return NextResponse.json({ success: true, sent, total: users.length });
}
