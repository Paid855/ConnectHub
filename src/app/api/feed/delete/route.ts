import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { postId } = await req.json();

  if (!postId) return NextResponse.json({ error: "No post ID" }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.userId !== id) return NextResponse.json({ error: "Not your post" }, { status: 403 });

  // Delete in correct order to avoid FK issues
  try {
    await prisma.postComment.deleteMany({ where: { postId } });
  } catch {}
  try {
    await prisma.postLike.deleteMany({ where: { postId } });
  } catch {}
  try {
    await prisma.post.delete({ where: { id: postId } });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
