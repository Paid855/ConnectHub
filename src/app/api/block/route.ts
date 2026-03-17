import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { userId, action } = await req.json();

  if (action === "block") {
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: id, blockedId: userId } },
      update: {},
      create: { blockerId: id, blockedId: userId }
    });
    return NextResponse.json({ blocked: true });
  } else {
    await prisma.block.deleteMany({ where: { blockerId: id, blockedId: userId } });
    return NextResponse.json({ blocked: false });
  }
}

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const blocks = await prisma.block.findMany({ where: { blockerId: id } });
  return NextResponse.json({ blockedIds: blocks.map(b => b.blockedId) });
}
