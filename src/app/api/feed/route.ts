import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id:true, name:true, profilePhoto:true, tier:true, verified:true, country:true } },
      comments: { include: { user: { select: { id:true, name:true, profilePhoto:true } } }, orderBy: { createdAt: "asc" }, take: 10 },
      likes: true,
    }
  });

  const feed = posts
    .filter(p => p.user?.email !== "admin@connecthub.com")
    .map(p => ({
      ...p,
      liked: p.likes?.some((l: any) => l.userId === id),
      likeCount: p.likes?.length || 0,
      commentCount: p.comments?.length || 0,
    }));

  return NextResponse.json({ feed });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { content, image } = await req.json();
  if (!content?.trim() && !image) return NextResponse.json({ error: "Empty post" }, { status: 400 });

  const post = await prisma.post.create({ data: { userId: id, content: content?.trim() || "", image: image || null } });
  return NextResponse.json({ post });
}
