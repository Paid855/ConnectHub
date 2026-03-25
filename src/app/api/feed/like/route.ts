import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: "No post" }, { status: 400 });

  const existing = await prisma.postLike.findFirst({ where: { postId, userId: id } });
  if (existing) { await prisma.postLike.delete({ where: { id: existing.id } }); return NextResponse.json({ unliked: true }); }

  await prisma.postLike.create({ data: { postId, userId: id } });
  return NextResponse.json({ liked: true });
}
