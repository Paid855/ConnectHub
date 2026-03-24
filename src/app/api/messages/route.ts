import { emailNewMessage } from "@/lib/email-notifications";
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
    await prisma.message.updateMany({ where: { senderId: chatWith, receiverId: id, read: false }, data: { read: true } }).catch(() => {});
    const rawMessages = await prisma.message.findMany({
      where: { OR: [{ senderId: id, receiverId: chatWith }, { senderId: chatWith, receiverId: id }] },
      orderBy: { createdAt: "asc" },
      take: 200
    });

    // Filter out messages deleted for this user
    const messages = rawMessages.map(m => {
      const isSender = m.senderId === id;
      if (isSender && m.content.startsWith("[DEL_SENDER]")) return null;
      if (!isSender && m.content.startsWith("[DEL_RECEIVER]")) return null;
      // Clean flags from content for display
      let content = m.content;
      content = content.replace("[DEL_SENDER]", "").replace("[DEL_RECEIVER]", "");
      return { ...m, content };
    }).filter(Boolean);

    return NextResponse.json({ messages });
  }

  const sent = await prisma.message.findMany({ where: { senderId: id }, orderBy: { createdAt: "desc" } });
  const received = await prisma.message.findMany({ where: { receiverId: id }, orderBy: { createdAt: "desc" } });
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
    // Clean last message content
    let lastContent = last?.content || "";
    if (lastContent.startsWith("[DELETED]")) lastContent = "Message deleted";
    else if (lastContent.startsWith("[DEL_SENDER]") || lastContent.startsWith("[DEL_RECEIVER]")) lastContent = lastContent.replace(/\[DEL_(SENDER|RECEIVER)\]/g, "");
    return { user: u, lastMessage: last ? { ...last, content: lastContent } : null, unreadCount };
  }).filter(Boolean).sort((a: any, b: any) => new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime());

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
  prisma.user.findUnique({ where: { id: receiverId }, select: { email:true, name:true } }).then(u => { if(u) emailNewMessage(u.email, u.name, "Someone").catch(()=>{}); }).catch(()=>{});
  createNotification(receiverId, "message", "New Message", content.startsWith("[IMG]") ? "Sent a photo" : content.startsWith("[VOICE]") ? "Sent a voice message" : content.substring(0, 50), id);

  return NextResponse.json({ message: newMsg });
}
