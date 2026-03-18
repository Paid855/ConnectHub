import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ messages: [] });
  const { id } = JSON.parse(session.value);

  const url = new URL(req.url);
  let streamId = url.searchParams.get("streamId");

  // If no streamId provided, check if user has an active stream
  if (!streamId) {
    const myStream = await prisma.liveStream.findFirst({ where: { userId: id, isLive: true } });
    if (myStream) streamId = myStream.id;
    if (!streamId) return NextResponse.json({ messages: [] });
  }

  const messages = await prisma.liveChat.findMany({
    where: { streamId },
    orderBy: { createdAt: "asc" },
    take: 200
  });

  const userIds = [...new Set(messages.map(m => m.userId))];
  const users = userIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, profilePhoto: true }
  }) : [];

  return NextResponse.json({
    messages: messages.map(m => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      user: users.find(u => u.id === m.userId) || { id: m.userId, name: "User", profilePhoto: null }
    })),
    streamId
  });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { streamId, content } = await req.json();

  if (!content?.trim() || !streamId) return NextResponse.json({ error: "Empty" }, { status: 400 });

  const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
  if (!stream || !stream.isLive) return NextResponse.json({ error: "Stream ended" }, { status: 400 });

  const msg = await prisma.liveChat.create({ data: { streamId, userId: id, content: content.trim() } });
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, profilePhoto: true } });

  return NextResponse.json({ message: { id: msg.id, content: msg.content, createdAt: msg.createdAt, user } });
}
