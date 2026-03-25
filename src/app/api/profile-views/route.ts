import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
  if (user?.tier !== "premium" && user?.tier !== "gold") return NextResponse.json({ error: "Premium feature", upgrade: true }, { status: 403 });

  const views = await prisma.profileView.findMany({
    where: { viewedId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { viewer: { select: { id:true, name:true, profilePhoto:true, age:true, country:true, tier:true, verified:true } } }
  });

  return NextResponse.json({ views });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { viewedId } = await req.json();
  if (!viewedId || viewedId === id) return NextResponse.json({ ok: true });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const existing = await prisma.profileView.findFirst({ where: { viewerId: id, viewedId, createdAt: { gte: today } } });
  if (!existing) await prisma.profileView.create({ data: { viewerId: id, viewedId } }).catch(() => {});

  return NextResponse.json({ ok: true });
}
