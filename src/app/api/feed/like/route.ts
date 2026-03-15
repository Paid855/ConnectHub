import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { postId } = await req.json();

  const existing = await prisma.postLike.findFirst({ where: { postId, userId: id } });
  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  } else {
    await prisma.postLike.create({ data: { postId, userId: id } });
    return NextResponse.json({ liked: true });
  }
}
