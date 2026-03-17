import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { viewedId } = await req.json();
  if (id === viewedId) return NextResponse.json({ ok: true });

  await prisma.profileView.create({ data: { viewerId: id, viewedId } });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
  if (!user || (user.tier !== "premium" && user.tier !== "gold")) {
    return NextResponse.json({ locked: true, count: 0, viewers: [] });
  }

  const views = await prisma.profileView.findMany({
    where: { viewedId: id },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const viewerIds = [...new Set(views.map(v => v.viewerId))];
  const viewers = await prisma.user.findMany({
    where: { id: { in: viewerIds } },
    select: { id:true, name:true, profilePhoto:true, tier:true }
  });

  return NextResponse.json({ locked: false, count: viewerIds.length, viewers });
}
