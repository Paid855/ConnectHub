import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getUserId(req: NextRequest) {
  try {
    const c = req.cookies.get("session")?.value;
    if (!c) return null;
    const p = JSON.parse(c);
    return p.id || p.userId || null;
  } catch { return null; }
}

// POST — mark messages as read
export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { senderId } = await req.json();
  if (!senderId) return NextResponse.json({ error: "No senderId" }, { status: 400 });

  // Always mark as read internally (for unread count)
  await prisma.message.updateMany({
    where: { senderId, receiverId: id, read: false },
    data: { read: true, readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

// GET — check if read receipts are visible to this user
export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  // Only Premium/Gold can see read receipts
  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
  const tier = user?.tier || "free";
  const canSeeReadReceipts = tier === "premium" || tier === "gold";

  return NextResponse.json({ canSeeReadReceipts });
}
