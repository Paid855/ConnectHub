import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const body = await req.json();
  const postId = body.postId;

  if (!postId) return NextResponse.json({ error: "No post ID" }, { status: 400 });

  // Find the post
  let post;
  try {
    post = await prisma.post.findUnique({ where: { id: postId } });
  } catch (err) {
    console.error("Find post error:", err);
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.userId !== id) return NextResponse.json({ error: "Not your post" }, { status: 403 });

  // Force delete everything related
  try { await prisma.$executeRawUnsafe(`DELETE FROM "PostComment" WHERE "postId" = $1`, postId); } catch (e) { console.error("Delete comments:", e); }
  try { await prisma.$executeRawUnsafe(`DELETE FROM "PostLike" WHERE "postId" = $1`, postId); } catch (e) { console.error("Delete likes:", e); }
  try { await prisma.$executeRawUnsafe(`DELETE FROM "Post" WHERE "id" = $1`, postId); } catch (e) { console.error("Delete post:", e); return NextResponse.json({ error: "Delete failed" }, { status: 500 }); }

  return NextResponse.json({ success: true });
}
