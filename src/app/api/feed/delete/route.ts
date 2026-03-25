import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: "No post" }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.userId !== id) return NextResponse.json({ error: "Not your post" }, { status: 403 });

  await prisma.postLike.deleteMany({ where: { postId } }).catch(() => {});
  await prisma.postComment.deleteMany({ where: { postId } }).catch(() => {});
  await prisma.post.delete({ where: { id: postId } });
  return NextResponse.json({ success: true });
}
