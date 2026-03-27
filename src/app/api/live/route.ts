import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const streams = await prisma.liveStream.findMany({
    where: { isLive: true },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const hostIds = streams.map(s => s.userId);
  const hosts = hostIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: hostIds } },
    select: { id: true, name: true, profilePhoto: true, tier: true, verified: true }
  }) : [];

  const result = streams.map(s => ({
    ...s,
    host: hosts.find(h => h.id === s.userId)
  }));

  return NextResponse.json({ streams: result });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { action, title } = await req.json();

  if (action === "start") {
    await prisma.liveStream.updateMany({ where: { userId: id, isLive: true }, data: { isLive: false, endedAt: new Date() } });
    const stream = await prisma.liveStream.create({
      data: { userId: id, title: title || "Live Stream", isLive: true }
    });
    return NextResponse.json({ stream });
  }

  if (action === "end") {
    await prisma.liveStream.updateMany({ where: { userId: id, isLive: true }, data: { isLive: false, endedAt: new Date() } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
