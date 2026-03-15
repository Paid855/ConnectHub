import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { postId, content } = await req.json();

  if (!content?.trim()) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

  const comment = await prisma.postComment.create({ data: { postId, userId: id, content: content.trim() } });
  return NextResponse.json({ comment });
}
