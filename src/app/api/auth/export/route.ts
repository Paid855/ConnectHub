import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");
  if (!sessionCookie) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const session = getSessionUser(sessionCookie.value);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  const id = session.id;

  // Rate limit: 1 export per hour
  const rl = rateLimit("export:" + id, 1, 3600000);
  if (!rl.success) return NextResponse.json({ error: "You can only export data once per hour" }, { status: 429 });

  const [user, messages, posts, friends, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id:true, name:true, email:true, username:true, phone:true, age:true, gender:true, lookingFor:true, bio:true, country:true, tier:true, verified:true, interests:true, coins:true, createdAt:true }
    }),
    prisma.message.findMany({ where: { OR: [{ senderId: id }, { receiverId: id }] }, take: 1000, orderBy: { createdAt: "desc" }, select: { id:true, content:true, createdAt:true, senderId:true, receiverId:true } }),
    prisma.post.findMany({ where: { userId: id }, select: { id:true, content:true, createdAt:true } }),
    prisma.friend.findMany({ where: { OR: [{ userId: id }, { friendId: id }] }, select: { id:true, status:true, createdAt:true } }),
    prisma.coinTransaction.findMany({ where: { userId: id }, select: { id:true, amount:true, type:true, description:true, createdAt:true } }),
  ]);

  // Remove base64 content from messages for export (too large)
  const cleanMessages = messages.map(m => ({
    ...m,
    content: m.content.startsWith("[IMG]") ? "[Photo]" : m.content.startsWith("[VOICE]") ? "[Voice message]" : m.content.startsWith("[VID]") ? "[Video]" : m.content.substring(0, 200)
  }));

  return NextResponse.json({
    exportDate: new Date().toISOString(),
    profile: user,
    messages: cleanMessages,
    posts,
    friends,
    transactions,
    note: "This is all data ConnectHub stores about you. You can request deletion at any time through Settings → Delete Account."
  });
}
