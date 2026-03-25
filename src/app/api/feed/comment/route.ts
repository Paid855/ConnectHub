import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { postId, content } = await req.json();
  if (!postId || !content?.trim()) return NextResponse.json({ error: "Empty" }, { status: 400 });

  const comment = await prisma.postComment.create({ data: { postId, userId: id, content: content.trim() } });
  return NextResponse.json({ comment });
}
