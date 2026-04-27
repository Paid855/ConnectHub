import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STALE_SECONDS = 20;

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const url = new URL(req.url);
  const streamId = url.searchParams.get("streamId");
  if (!streamId) return NextResponse.json({ viewers: [], count: 0 });

  // Clean stale viewers
  await prisma.liveViewer.deleteMany({
    where: { streamId, lastPing: { lt: new Date(Date.now() - STALE_SECONDS * 1000) } }
  }).catch(() => {});

  // Get stream host to exclude
  const stream = await prisma.liveStream.findUnique({ where: { id: streamId }, select: { userId: true } });

  // Get active viewers
  const viewers = await prisma.liveViewer.findMany({ where: { streamId } });
  const userIds = viewers.map(v => v.userId).filter(uid => uid !== stream?.userId);

  let userDetails: any[] = [];
  if (userIds.length > 0) {
    userDetails = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, profilePhoto: true, verified: true, tier: true }
    });
  }

  return NextResponse.json({
    viewers: userDetails,
    count: userDetails.length
  });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const streamId = body.streamId;
  const action = body.action || "join";

  if (!streamId) return NextResponse.json({ error: "No stream" }, { status: 400 });

  // === CLEANUP (host ending stream) ===
  if (action === "cleanup") {
    await prisma.liveViewer.deleteMany({ where: { streamId } }).catch(() => {});
    return NextResponse.json({ success: true });
  }

  // === LEAVE ===
  if (action === "leave") {
    await prisma.liveViewer.deleteMany({ where: { streamId, userId: id } }).catch(() => {});

    // Send leave message if no recent one
    const recentLeave = await prisma.liveChat.findFirst({
      where: { streamId, userId: id, content: { contains: "left the stream" }, createdAt: { gte: new Date(Date.now() - 30000) } }
    }).catch(() => null);
    if (!recentLeave) {
      const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });
      await prisma.liveChat.create({
        data: { streamId, userId: id, content: `👋 ${user?.name || "Someone"} left the stream` }
      }).catch(() => {});
    }
    return NextResponse.json({ success: true });
  }

  // === PING — just update timestamp ===
  if (action === "ping") {
    await prisma.liveViewer.updateMany({
      where: { streamId, userId: id },
      data: { lastPing: new Date() }
    }).catch(() => {});
    return NextResponse.json({ success: true });
  }

  // === JOIN ===
  // Use upsert — if already exists, just update ping. If new, create.
  const existing = await prisma.liveViewer.findUnique({
    where: { streamId_userId: { streamId, userId: id } }
  }).catch(() => null);

  if (existing) {
    // Already watching — just update ping
    await prisma.liveViewer.update({
      where: { id: existing.id },
      data: { lastPing: new Date() }
    }).catch(() => {});
    return NextResponse.json({ success: true, isNew: false });
  }

  // Truly new viewer
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, profilePhoto: true, verified: true, tier: true }
  });

  await prisma.liveViewer.create({
    data: { streamId, userId: id }
  }).catch(() => {});

  // Check last action to prevent duplicate join message
  const lastJoin = await prisma.liveChat.findFirst({
    where: { streamId, userId: id, content: { contains: "joined the stream" }, createdAt: { gte: new Date(Date.now() - 10000) } }
  }).catch(() => null);

  if (!lastJoin) {
    await prisma.liveChat.create({
      data: { streamId, userId: id, content: `👋 ${user?.name || "Someone"} joined the stream` }
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, isNew: true });
}
