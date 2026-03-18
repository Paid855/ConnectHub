import { createNotification } from "@/lib/notify";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const url = new URL(req.url);
  const partnerId = url.searchParams.get("partnerId");

  if (partnerId) {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: id, receiverId: partnerId }, { senderId: partnerId, receiverId: id }] },
      orderBy: { createdAt: "asc" }
    });
    await prisma.message.updateMany({ where: { senderId: partnerId, receiverId: id, read: false }, data: { read: true } });
    return NextResponse.json({ messages });
  }

  const sent = await prisma.message.findMany({ where: { senderId: id }, orderBy: { createdAt: "desc" } });
  const received = await prisma.message.findMany({ where: { receiverId: id }, orderBy: { createdAt: "desc" } });
  const all = [...sent, ...received];
  const partnerIds = [...new Set(all.map(m => m.senderId === id ? m.receiverId : m.senderId))];

  const partners = await prisma.user.findMany({
    where: { id: { in: partnerIds } },
    select: { id: true, name: true, profilePhoto: true, tier: true }
  });

  const conversations = partners.map(p => {
    const msgs = all.filter(m => m.senderId === p.id || m.receiverId === p.id);
    const last = msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const unread = received.filter(m => m.senderId === p.id && !m.read).length;
    return { partner: p, lastMessage: last, unreadCount: unread };
  }).sort((a, b) => new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime());

  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Basic users: 3 messages per day limit
  if (user.tier === "basic") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.message.count({
      where: { senderId: id, createdAt: { gte: today } }
    });
    if (todayCount >= 3) {
      return NextResponse.json({ error: "Daily message limit reached. Upgrade to Premium for unlimited messages!", limited: true }, { status: 403 });
    }
  }

  const { receiverId, content } = await req.json();
  if (!receiverId || !content?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const message = await prisma.message.create({
    data: { senderId: id, receiverId, content: content.trim() }
  });

  return NextResponse.json({ message });
}
