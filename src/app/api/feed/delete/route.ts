import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }

  const postId = body.postId;
  if (!postId) return NextResponse.json({ error: "No post ID" }, { status: 400 });

  // Verify ownership
  let post;
  try { post = await prisma.post.findUnique({ where: { id: postId } }); } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.userId !== id) return NextResponse.json({ error: "Not yours" }, { status: 403 });

  // Delete related records first using Prisma methods with error handling
  try { await prisma.postComment.deleteMany({ where: { postId: postId } }); } catch (e) { console.log("No comments to delete or error:", e); }
  try { await prisma.postLike.deleteMany({ where: { postId: postId } }); } catch (e) { console.log("No likes to delete or error:", e); }

  // Delete the post itself
  try {
    await prisma.post.delete({ where: { id: postId } });
    return NextResponse.json({ success: true, deleted: postId });
  } catch (e: any) {
    console.error("Final delete failed:", e);
    // Try raw SQL as last resort
    try {
      await prisma.$executeRawUnsafe('DELETE FROM "Post" WHERE "id" = $1 AND "userId" = $2', postId, id);
      return NextResponse.json({ success: true, deleted: postId });
    } catch (e2) {
      console.error("Raw delete also failed:", e2);
      return NextResponse.json({ error: "Delete failed - " + (e?.message || "unknown") }, { status: 500 });
    }
  }
}
