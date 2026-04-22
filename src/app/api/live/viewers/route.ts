import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - list active viewers for a stream
export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const url = new URL(req.url);
  const streamId = url.searchParams.get("streamId");
  if (!streamId) return NextResponse.json({ viewers: [] });

  // Get unique users who sent messages in this stream (active viewers)
  const chats = await prisma.liveChat.findMany({
    where: { streamId },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  const userIds = [...new Set(chats.map(c => c.userId))];
  const users = userIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, profilePhoto: true, verified: true, tier: true }
  }) : [];

  // Get the stream to know who the host is
  const stream = await prisma.liveStream.findUnique({ where: { id: streamId }, select: { userId: true } });

  // Filter out the host from viewers
  const viewers = users.filter(u => u.id !== stream?.userId);

  return NextResponse.json({ viewers, count: viewers.length });
}

// POST - register as viewer (sends join message if not already sent)
export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { streamId } = await req.json();
  if (!streamId) return NextResponse.json({ error: "No stream" }, { status: 400 });

  // Check if already joined
  const existing = await prisma.liveChat.findFirst({
    where: { streamId, userId: id, content: { contains: "joined the stream" } }
  });

  if (!existing) {
    const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });
    await prisma.liveChat.create({
      data: { streamId, userId: id, content: `👋 ${user?.name || "Someone"} joined the stream` }
    });
  }

  return NextResponse.json({ success: true });
}
