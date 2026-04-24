import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: "No post" }, { status: 400 });

  const existing = await prisma.postLike.findFirst({ where: { postId, userId: id } });
  if (existing) { await prisma.postLike.delete({ where: { id: existing.id } }); return NextResponse.json({ unliked: true }); }

  await prisma.postLike.create({ data: { postId, userId: id } });
  // Notify post owner about the like
  try {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post && post.userId !== id) {
      sendPushToUser(post.userId, { title: "Someone liked your post ❤️", body: "Your post is getting attention!", url: "/dashboard/feed", tag: "like-" + postId });
    }
  } catch {}

  return NextResponse.json({ liked: true });
}
