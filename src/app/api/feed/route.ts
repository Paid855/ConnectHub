import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const userIds = [...new Set(posts.map(p => p.userId))];

  const [users, allLikes, allComments] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds }, email: { not: "admin@connecthub.com" } }, select: { id:true, name:true, profilePhoto:true, tier:true, verified:true, country:true } }),
    prisma.postLike.findMany({ where: { postId: { in: posts.map(p => p.id) } } }),
    prisma.postComment.findMany({ where: { postId: { in: posts.map(p => p.id) } }, orderBy: { createdAt: "asc" } }),
  ]);

  // Get comment user info
  const commentUserIds = [...new Set(allComments.map(c => c.userId))];
  const commentUsers = commentUserIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: commentUserIds } }, select: { id:true, name:true, profilePhoto:true } }) : [];

  const feed = posts.map(p => {
    const user = users.find(u => u.id === p.userId);
    if (!user) return null;
    const likes = allLikes.filter(l => l.postId === p.id);
    const comments = allComments.filter(c => c.postId === p.id).map(c => ({
      ...c,
      user: commentUsers.find(u => u.id === c.userId)
    }));
    return {
      ...p,
      user,
      liked: likes.some(l => l.userId === id),
      likeCount: likes.length,
      commentCount: comments.length,
      comments: comments.slice(0, 10),
    };
  }).filter(Boolean);

  return NextResponse.json({ feed });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { content, image } = await req.json();
  if (!content?.trim() && !image) return NextResponse.json({ error: "Empty" }, { status: 400 });

  const post = await prisma.post.create({ data: { userId: id, content: content?.trim() || "", image: image || null } });
  return NextResponse.json({ post });
}
