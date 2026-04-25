import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  // Only show actually live streams (not ended ones)
  const streams = await prisma.liveStream.findMany({
    where: { isLive: true },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  // Clean up stale streams (older than 4 hours)
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  await prisma.liveStream.updateMany({
    where: { isLive: true, createdAt: { lt: fourHoursAgo } },
    data: { isLive: false, endedAt: new Date() }
  }).catch(() => {});

  const freshStreams = streams.filter(s => new Date(s.createdAt) > fourHoursAgo);
  const hostIds = freshStreams.map(s => s.userId);
  const hosts = hostIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: hostIds } },
    select: { id:true, name:true, profilePhoto:true, tier:true, verified:true }
  }) : [];

  return NextResponse.json({
    streams: freshStreams.map(s => ({ ...s, host: hosts.find(h => h.id === s.userId) }))
  });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const body = await req.json();
  const action = body.action;
  const title = body.title;
  const category = body.category || "chat";

  if (action === "start") {
    // End any existing streams first
    await prisma.liveStream.updateMany({ where: { userId: id, isLive: true }, data: { isLive: false, endedAt: new Date() } });
    const stream = await prisma.liveStream.create({ data: { userId: id, title: title || "Live Stream", category, isLive: true } });
    return NextResponse.json({ stream });
  }

  if (action === "end") {
    await prisma.liveStream.updateMany({ where: { userId: id, isLive: true }, data: { isLive: false, endedAt: new Date() } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
