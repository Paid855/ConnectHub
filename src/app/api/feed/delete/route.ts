import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { postId } = await req.json();

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.userId !== id) return NextResponse.json({ error: "Not your post" }, { status: 403 });

  await prisma.postComment.deleteMany({ where: { postId } });
  await prisma.postLike.deleteMany({ where: { postId } });
  await prisma.post.delete({ where: { id: postId } });

  return NextResponse.json({ success: true });
}
