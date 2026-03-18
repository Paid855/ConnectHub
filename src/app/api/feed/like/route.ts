import { createNotification } from "@/lib/notify";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { postId, emoji } = await req.json();
  const reaction = emoji || "heart";

  const existing = await prisma.postLike.findFirst({ where: { postId, userId: id } });
  if (existing) {
    if (existing.emoji === reaction) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.postLike.update({ where: { id: existing.id }, data: { emoji: reaction } });
      const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post && post.userId !== id) createNotification(post.userId, "like", "Post Liked", "reacted to your post", id);
    return NextResponse.json({ liked: true, emoji: reaction });
    }
  } else {
    await prisma.postLike.create({ data: { postId, userId: id, emoji: reaction } });
    return NextResponse.json({ liked: true, emoji: reaction });
  }
}
