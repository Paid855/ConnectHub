import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const url = new URL(req.url);
  const chatWith = url.searchParams.get("with");

  if (chatWith) {
    await prisma.message.updateMany({ where: { senderId: chatWith, receiverId: id, read: false }, data: { read: true } }).catch(() => {});
    const rawMessages = await prisma.message.findMany({
      where: { OR: [{ senderId: id, receiverId: chatWith }, { senderId: chatWith, receiverId: id }] },
      orderBy: { createdAt: "asc" },
      take: 200
    });
    const messages = rawMessages.map(m => {
      const isSender = m.senderId === id;
      if (isSender && m.content.startsWith("[DEL_SENDER]")) return null;
      if (!isSender && m.content.startsWith("[DEL_RECEIVER]")) return null;
      let content = m.content.replace("[DEL_SENDER]", "").replace("[DEL_RECEIVER]", "");
      return { ...m, content };
    }).filter(Boolean);
    // Get other user info with online status
    const otherUser = await prisma.user.findUnique({
      where: { id: chatWith },
      select: { id: true, name: true, profilePhoto: true, tier: true, lastSeen: true, verified: true }
    });
    const isOnline = otherUser?.lastSeen ? (Date.now() - new Date(otherUser.lastSeen).getTime()) < 120000 : false;
    return NextResponse.json({ messages, otherUser: otherUser ? { ...otherUser, isOnline } : null });
  }

  const sent = await prisma.message.findMany({ where: { senderId: id }, orderBy: { createdAt: "desc" }, take: 500 });
  const received = await prisma.message.findMany({ where: { receiverId: id }, orderBy: { createdAt: "desc" }, take: 500 });
  const all = [...sent, ...received];
  const contactIds = [...new Set(all.map(m => m.senderId === id ? m.receiverId : m.senderId))];

  const users = contactIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: contactIds }, email: { not: "admin@connecthub.com" } },
    select: { id:true, name:true, profilePhoto:true, tier:true, lastSeen:true, verified:true }
  }) : [];

  const conversations = contactIds.map(cid => {
    const u = users.find(u => u.id === cid);
    if (!u) return null;
    const msgs = all.filter(m => (m.senderId === cid && m.receiverId === id) || (m.senderId === id && m.receiverId === cid));
    const last = msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const unreadCount = msgs.filter(m => m.senderId === cid && m.receiverId === id && !m.read).length;
    let lastContent = last?.content || "";
    if (lastContent.startsWith("[DELETED]")) lastContent = "Message deleted";
    else lastContent = lastContent.replace(/\[DEL_(SENDER|RECEIVER)\]/g, "");
    const isOnline = u.lastSeen ? (Date.now() - new Date(u.lastSeen).getTime()) < 120000 : false;
    return { user: { ...u, isOnline }, lastMessage: last ? { ...last, content: lastContent } : null, unreadCount };
  }).filter(Boolean).sort((a: any, b: any) => new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime());

  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { receiverId, content } = await req.json();
  if (!receiverId || !content?.trim()) return NextResponse.json({ error: "Empty" }, { status: 400 });

  const blocked = await prisma.block.findFirst({ where: { OR: [{ blockerId: id, blockedId: receiverId }, { blockerId: receiverId, blockedId: id }] } });
  if (blocked) return NextResponse.json({ error: "Cannot message this user" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
  if (user?.tier === "free" || !user?.tier) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const count = await prisma.message.count({ where: { senderId: id, createdAt: { gte: today } } });
    if (count >= 5) return NextResponse.json({ error: "Daily limit reached", limited: true }, { status: 403 });
  }

  const newMsg = await prisma.message.create({ data: { senderId: id, receiverId, content: content.trim() } });
  const notifBody = content.startsWith("[IMG]") ? "Sent a photo" : content.startsWith("[VOICE]") ? "Voice message" : content.substring(0, 50);
  createNotification(receiverId, "message", "New Message", notifBody, id);
  sendPushToUser(receiverId, { title: "New Message 💬", body: notifBody, url: "/dashboard/messages", tag: "msg-" + id });

  return NextResponse.json({ message: newMsg });
}
