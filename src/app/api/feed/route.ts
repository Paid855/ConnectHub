import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const userIds = [...new Set(posts.map(p => p.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id:true, name:true, profilePhoto:true, tier:true }
  });

  const likes = await prisma.postLike.findMany({ where: { postId: { in: posts.map(p => p.id) } } });
  const comments = await prisma.postComment.findMany({
    where: { postId: { in: posts.map(p => p.id) } },
    orderBy: { createdAt: "asc" }
  });

  const commentUserIds = [...new Set(comments.map(c => c.userId))];
  const commentUsers = await prisma.user.findMany({
    where: { id: { in: commentUserIds } },
    select: { id:true, name:true, profilePhoto:true, tier:true }
  });

  const feed = posts.map(p => ({
    ...p,
    user: users.find(u => u.id === p.userId),
    likeCount: likes.filter(l => l.postId === p.id).length,
    liked: likes.some(l => l.postId === p.id && l.userId === id),
    comments: comments.filter(c => c.postId === p.id).map(c => ({
      ...c, user: commentUsers.find(u => u.id === c.userId)
    })),
    commentCount: comments.filter(c => c.postId === p.id).length,
  }));

  return NextResponse.json({ feed });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { content, image } = await req.json();

  if (!content?.trim() && !image) return NextResponse.json({ error: "Post cannot be empty" }, { status: 400 });

  const post = await prisma.post.create({ data: { userId: id, content: content?.trim() || null, image: image || null } });
  return NextResponse.json({ post });
}
