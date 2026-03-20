import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
  if (!user || user.tier === "basic") return NextResponse.json({ error: "Premium feature", upgrade: true }, { status: 403 });

  const views = await prisma.profileView.findMany({
    where: { viewedId: id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  const viewerIds = [...new Set(views.map(v => v.viewerId))];
  const viewers = viewerIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: viewerIds } },
    select: { id:true, name:true, profilePhoto:true, age:true, country:true, tier:true }
  }) : [];

  return NextResponse.json({
    views: views.map(v => ({ ...v, viewer: viewers.find(u => u.id === v.viewerId) })),
    totalViews: views.length
  });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { viewedId } = await req.json();

  if (!viewedId || viewedId === id) return NextResponse.json({ ok: true });
  await prisma.profileView.create({ data: { viewerId: id, viewedId } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
