import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// In-memory active viewer tracking (resets on deploy — fine for live presence)
const activeViewers = new Map<string, Map<string, { name: string; photo: string | null; verified: boolean; tier: string; lastPing: number }>>();

// GET - list active viewers for a stream
export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const url = new URL(req.url);
  const streamId = url.searchParams.get("streamId");
  if (!streamId) return NextResponse.json({ viewers: [], count: 0 });

  const streamViewers = activeViewers.get(streamId);
  if (!streamViewers) return NextResponse.json({ viewers: [], count: 0 });

  // Clean up stale viewers (no ping in 15 seconds)
  const now = Date.now();
  for (const [uid, v] of streamViewers.entries()) {
    if (now - v.lastPing > 15000) streamViewers.delete(uid);
  }

  // Get stream host to exclude from viewers
  const stream = await prisma.liveStream.findUnique({ where: { id: streamId }, select: { userId: true } });

  const viewers = Array.from(streamViewers.entries())
    .filter(([uid]) => uid !== stream?.userId)
    .map(([uid, v]) => ({ id: uid, name: v.name, profilePhoto: v.photo, verified: v.verified, tier: v.tier }));

  return NextResponse.json({ viewers, count: viewers.length });
}

// POST - register/ping as viewer or leave
export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const streamId = body.streamId;
  const action = body.action || "join";

  if (!streamId) return NextResponse.json({ error: "No stream" }, { status: 400 });

  if (action === "leave") {
    const streamViewers = activeViewers.get(streamId);
    if (streamViewers) {
      streamViewers.delete(id);
      if (streamViewers.size === 0) activeViewers.delete(streamId);
    }
    // Only send leave message if no recent one exists
    const recentLeave = await prisma.liveChat.findFirst({
      where: { streamId, userId: id, content: { contains: "left the stream" }, createdAt: { gte: new Date(Date.now() - 60000) } }
    }).catch(() => null);
    if (!recentLeave) {
      const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });
      await prisma.liveChat.create({
        data: { streamId, userId: id, content: `👋 ${user?.name || "Someone"} left the stream` }
      }).catch(() => {});
    }
    return NextResponse.json({ success: true });
  }

  // Ping only — just update timestamp, never create chat message
  if (action === "ping") {
    if (!activeViewers.has(streamId)) activeViewers.set(streamId, new Map());
    const sv = activeViewers.get(streamId)!;
    if (sv.has(id)) {
      const existing = sv.get(id)!;
      existing.lastPing = Date.now();
      sv.set(id, existing);
    } else {
      const user = await prisma.user.findUnique({ where: { id }, select: { name: true, profilePhoto: true, verified: true, tier: true } });
      sv.set(id, { name: user?.name || "User", photo: user?.profilePhoto || null, verified: user?.verified || false, tier: user?.tier || "free", lastPing: Date.now() });
    }
    return NextResponse.json({ success: true });
  }

  // Join — first time only
  if (!activeViewers.has(streamId)) activeViewers.set(streamId, new Map());
  const streamViewers = activeViewers.get(streamId)!;

  const isNew = !streamViewers.has(id);

  // Get user info if new
  if (isNew) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { name: true, profilePhoto: true, verified: true, tier: true }
    });

    streamViewers.set(id, {
      name: user?.name || "User",
      photo: user?.profilePhoto || null,
      verified: user?.verified || false,
      tier: user?.tier || "free",
      lastPing: Date.now()
    });

    // Only send join message if we haven't sent one recently (prevents serverless cold start duplicates)
    const recentJoin = await prisma.liveChat.findFirst({
      where: { streamId, userId: id, content: { contains: "joined the stream" }, createdAt: { gte: new Date(Date.now() - 60000) } },
      orderBy: { createdAt: "desc" }
    }).catch(() => null);
    if (!recentJoin) {
      await prisma.liveChat.create({
        data: { streamId, userId: id, content: `👋 ${user?.name || "Someone"} joined the stream` }
      }).catch(() => {});
    }
  } else {
    // Update last ping time
    const existing = streamViewers.get(id)!;
    existing.lastPing = Date.now();
    streamViewers.set(id, existing);
  }

  return NextResponse.json({ success: true, isNew });
}
