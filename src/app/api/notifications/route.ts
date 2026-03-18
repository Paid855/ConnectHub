import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const notifications = await prisma.notification.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  const fromIds = notifications.map(n => n.fromUserId).filter(Boolean) as string[];
  const users = fromIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: fromIds } },
    select: { id:true, name:true, profilePhoto:true }
  }) : [];

  const unreadCount = notifications.filter(n => !n.read).length;

  return NextResponse.json({
    notifications: notifications.map(n => ({
      ...n,
      fromUser: users.find(u => u.id === n.fromUserId)
    })),
    unreadCount
  });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { action, notificationId } = await req.json();

  if (action === "read" && notificationId) {
    await prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
    return NextResponse.json({ success: true });
  }

  if (action === "readAll") {
    await prisma.notification.updateMany({ where: { userId: id, read: false }, data: { read: true } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
