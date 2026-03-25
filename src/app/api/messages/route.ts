import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { getSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { sanitize, isSuspicious } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");
  if (!sessionCookie) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const session = getSessionUser(sessionCookie.value);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  const id = session.id;

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

    return NextResponse.json({ messages });
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
    return { user: u, lastMessage: last ? { ...last, content: lastContent } : null, unreadCount };
  }).filter(Boolean).sort((a: any, b: any) => new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime());

  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");
  if (!sessionCookie) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const session = getSessionUser(sessionCookie.value);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  const id = session.id;

  // Rate limit: 30 messages per minute
  const rl = rateLimit("msg:" + id, 30, 60000);
  if (!rl.success) return NextResponse.json({ error: "Sending too fast. Slow down!", limited: true }, { status: 429 });

  const { receiverId, content } = await req.json();
  if (!receiverId || !content?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  // Check for suspicious content in text messages (not images/voice)
  if (!content.startsWith("[IMG]") && !content.startsWith("[VOICE]") && !content.startsWith("[VID]") && !content.startsWith("[STORY_")) {
    if (isSuspicious(content)) {
      return NextResponse.json({ error: "Message contains prohibited content" }, { status: 400 });
    }
  }

  // Check message limit for free users
  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
  if (user?.tier === "free" || !user?.tier) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayMsgs = await prisma.message.count({ where: { senderId: id, createdAt: { gte: today } } });
    if (todayMsgs >= 5) {
      return NextResponse.json({ error: "Daily limit reached. Upgrade for unlimited!", limited: true }, { status: 403 });
    }
  }

  const blocked = await prisma.block.findFirst({ where: { OR: [{ blockerId: id, blockedId: receiverId }, { blockerId: receiverId, blockedId: id }] } });
  if (blocked) return NextResponse.json({ error: "Cannot message this user" }, { status: 403 });

  // Sanitize text content
  let cleanContent = content.trim();
  if (!cleanContent.startsWith("[IMG]") && !cleanContent.startsWith("[VOICE]") && !cleanContent.startsWith("[VID]") && !cleanContent.startsWith("[STORY_")) {
    cleanContent = sanitize(cleanContent);
  }

  const newMsg = await prisma.message.create({ data: { senderId: id, receiverId, content: cleanContent } });

  const notifBody = cleanContent.startsWith("[IMG]") ? "Sent a photo" : cleanContent.startsWith("[VOICE]") ? "Sent a voice message" : cleanContent.substring(0, 50);
  createNotification(receiverId, "message", "New Message", notifBody, id);

  return NextResponse.json({ message: newMsg });
}
