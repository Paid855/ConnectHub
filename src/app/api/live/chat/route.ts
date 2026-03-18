import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const streamId = url.searchParams.get("streamId");
  if (!streamId) return NextResponse.json({ messages: [] });

  const messages = await prisma.liveChat.findMany({
    where: { streamId },
    orderBy: { createdAt: "asc" },
    take: 100
  });

  const userIds = [...new Set(messages.map(m => m.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, profilePhoto: true }
  });

  return NextResponse.json({
    messages: messages.map(m => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      user: users.find(u => u.id === m.userId)
    }))
  });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { streamId, content } = await req.json();

  if (!content?.trim() || !streamId) return NextResponse.json({ error: "Empty" }, { status: 400 });

  const msg = await prisma.liveChat.create({
    data: { streamId, userId: id, content: content.trim() }
  });

  return NextResponse.json({ message: msg });
}
