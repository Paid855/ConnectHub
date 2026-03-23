import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const blocks = await prisma.block.findMany({ where: { blockerId: id } });
  const blockedIds = blocks.map(b => b.blockedId);
  const users = blockedIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: blockedIds } },
    select: { id:true, name:true, email:true, profilePhoto:true }
  }) : [];

  return NextResponse.json({ blocked: users });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { blockedId } = await req.json();
  if (!blockedId) return NextResponse.json({ error: "No user" }, { status: 400 });

  const existing = await prisma.block.findFirst({ where: { blockerId: id, blockedId } });
  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
    return NextResponse.json({ unblocked: true });
  }

  await prisma.block.create({ data: { blockerId: id, blockedId } });
  // Also remove friend if exists
  await prisma.friend.deleteMany({ where: { OR: [{ userId: id, friendId: blockedId }, { userId: blockedId, friendId: id }] } }).catch(() => {});
  return NextResponse.json({ blocked: true });
}
