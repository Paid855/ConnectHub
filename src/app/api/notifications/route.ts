import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const notifications = await prisma.notification.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 30 });
  const unreadCount = await prisma.notification.count({ where: { userId: id, read: false } });
  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  await prisma.notification.updateMany({ where: { userId: id, read: false }, data: { read: true } });
  return NextResponse.json({ success: true });
}
