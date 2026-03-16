import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const url = new URL(req.url);
  const userId = url.searchParams.get("id");
  if (!userId) return NextResponse.json({ error: "No user ID" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id:true, name:true, age:true, gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true, createdAt:true }
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const posts = await prisma.post.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 });
  const postLikes = await prisma.postLike.findMany({ where: { postId: { in: posts.map(p=>p.id) } } });
  const { id: myId } = JSON.parse(session.value);

  const feed = posts.map(p => ({
    ...p,
    likeCount: postLikes.filter(l => l.postId === p.id).length,
    liked: postLikes.some(l => l.postId === p.id && l.userId === myId),
  }));

  return NextResponse.json({ user, posts: feed, postCount: posts.length });
}
