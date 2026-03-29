import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  // Get sender names for real notifications
  const fromIds = notifications.map(n => n.fromUserId).filter(Boolean) as string[];
  const fromUsers = fromIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: fromIds } },
    select: { id: true, name: true, profilePhoto: true }
  }) : [];

  const enriched = notifications.map(n => {
    const sender = fromUsers.find(u => u.id === n.fromUserId);
    return {
      ...n,
      senderName: sender?.name || null,
      senderPhoto: sender?.profilePhoto || null,
    };
  });

  const unreadCount = await prisma.notification.count({ where: { userId: id, read: false } });
  return NextResponse.json({ notifications: enriched, unreadCount });
}

export async function PUT(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  await prisma.notification.updateMany({ where: { userId: id, read: false }, data: { read: true } });
  return NextResponse.json({ success: true });
}
