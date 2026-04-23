import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  // Get ALL views for this user (show count to everyone, details to premium)
  const views = await prisma.profileView.findMany({
    where: { viewedId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
  const isPremium = user?.tier === "premium" || user?.tier === "gold";

  // Manual join — get viewer details
  const viewerIds = [...new Set(views.map(v => v.viewerId))];
  const viewers = viewerIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: viewerIds } },
    select: { id: true, name: true, profilePhoto: true, age: true, country: true, tier: true, verified: true, lastSeen: true }
  }) : [];

  const enriched = views.map(v => ({
    id: v.id,
    viewerId: v.viewerId,
    createdAt: v.createdAt,
    viewer: isPremium ? viewers.find(u => u.id === v.viewerId) || null : null,
  }));

  return NextResponse.json({ views: enriched, total: views.length, isPremium });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { viewedId } = await req.json();
  if (!viewedId || viewedId === id) return NextResponse.json({ ok: true });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const existing = await prisma.profileView.findFirst({ where: { viewerId: id, viewedId, createdAt: { gte: today } } });
  if (!existing) await prisma.profileView.create({ data: { viewerId: id, viewedId } }).catch(() => {});

  return NextResponse.json({ ok: true });
}
