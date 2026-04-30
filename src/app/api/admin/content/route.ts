import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "posts";

    if (type === "posts") {
      const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      const userIds = [...new Set(posts.map(p => p.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, profilePhoto: true, email: true, tier: true, verified: true }
      });
      const enriched = posts.map(p => ({
        ...p,
        user: users.find(u => u.id === p.userId) || null
      }));
      return NextResponse.json({ posts: enriched });
    }

    if (type === "stories") {
      const stories = await prisma.story.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      const userIds = [...new Set(stories.map(s => s.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, profilePhoto: true, email: true }
      });
      const enriched = stories.map(s => ({
        ...s,
        user: users.find(u => u.id === s.userId) || null
      }));
      return NextResponse.json({ stories: enriched });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (e: any) {
    console.error("Content API error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { action, id, type } = await req.json();

  if (action === "delete") {
    if (type === "post") {
      await prisma.post.delete({ where: { id } }).catch(() => {});
      return NextResponse.json({ success: true });
    }
    if (type === "story") {
      await prisma.story.delete({ where: { id } }).catch(() => {});
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
