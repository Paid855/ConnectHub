import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const streams = await prisma.liveStream.findMany({
    where: { isLive: true },
    orderBy: { viewerCount: "desc" }
  });

  const userIds = streams.map(s => s.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id:true, name:true, profilePhoto:true, tier:true, country:true }
  });

  const liveStreams = streams.map(s => ({
    ...s,
    user: users.find(u => u.id === s.userId)
  }));

  return NextResponse.json({ streams: liveStreams });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { action, title, streamId } = await req.json();

  if (action === "start") {
    // End any existing streams
    await prisma.liveStream.updateMany({ where: { userId: id, isLive: true }, data: { isLive: false, endedAt: new Date() } });
    const stream = await prisma.liveStream.create({ data: { userId: id, title: title || "Live Stream", isLive: true } });
    return NextResponse.json({ stream });
  }

  if (action === "end") {
    await prisma.liveStream.updateMany({ where: { userId: id, isLive: true }, data: { isLive: false, endedAt: new Date() } });
    return NextResponse.json({ ended: true });
  }

  if (action === "join" && streamId) {
    await prisma.liveStream.update({ where: { id: streamId }, data: { viewerCount: { increment: 1 } } }).catch(() => {});
    return NextResponse.json({ joined: true });
  }

  if (action === "leave" && streamId) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (stream && stream.viewerCount > 0) {
      await prisma.liveStream.update({ where: { id: streamId }, data: { viewerCount: { decrement: 1 } } }).catch(() => {});
    }
    return NextResponse.json({ left: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
