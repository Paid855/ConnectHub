import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const url = new URL(req.url);
  const chatWith = url.searchParams.get("with");

  if (chatWith) {
    // Mark messages as read
    await prisma.message.updateMany({ where: { senderId: chatWith, receiverId: id, read: false }, data: { read: true } }).catch(() => {});
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: id, receiverId: chatWith }, { senderId: chatWith, receiverId: id }] },
      orderBy: { createdAt: "asc" },
      take: 200
    });
    return NextResponse.json({ messages });
  }

  // Get conversations
  const sent = await prisma.message.findMany({ where: { senderId: id }, orderBy: { createdAt: "desc" } });
  const received = await prisma.message.findMany({ where: { receiverId: id }, orderBy: { createdAt: "desc" } });
  const all = [...sent, ...received];
  const contactIds = [...new Set(all.map(m => m.senderId === id ? m.receiverId : m.senderId))];

  const users = contactIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: contactIds } },
    select: { id:true, name:true, profilePhoto:true, tier:true, lastSeen:true }
  }) : [];

  const conversations = contactIds.map(cid => {
    const msgs = all.filter(m => (m.senderId === cid && m.receiverId === id) || (m.senderId === id && m.receiverId === cid));
    const last = msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const unreadCount = msgs.filter(m => m.senderId === cid && m.receiverId === id && !m.read).length;
    return { user: users.find(u => u.id === cid), lastMessage: last, unreadCount };
  }).sort((a, b) => new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime());

  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { receiverId, content } = await req.json();
  if (!receiverId || !content?.trim()) return NextResponse.json({ error: "Empty" }, { status: 400 });

  const blocked = await prisma.block.findFirst({ where: { OR: [{ blockerId: id, blockedId: receiverId }, { blockerId: receiverId, blockedId: id }] } });
  if (blocked) return NextResponse.json({ error: "Cannot message this user" }, { status: 403 });

  const newMsg = await prisma.message.create({ data: { senderId: id, receiverId, content: content.trim() } });

  createNotification(receiverId, "message", "New Message", content.substring(0, 50), id);

  return NextResponse.json({ message: newMsg });
}
