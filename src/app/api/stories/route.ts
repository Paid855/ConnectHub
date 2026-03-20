import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  // Delete expired stories
  await prisma.story.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});

  const stories = await prisma.story.findMany({ where: { expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  const userIds = [...new Set(stories.map(s => s.userId))];
  const users = userIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id:true, name:true, profilePhoto:true } }) : [];

  // Group by user
  const grouped: Record<string, any> = {};
  stories.forEach(s => {
    if (!grouped[s.userId]) grouped[s.userId] = { user: users.find(u => u.id === s.userId), stories: [] };
    grouped[s.userId].stories.push(s);
  });

  return NextResponse.json({ storyGroups: Object.values(grouped), myId: id });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { action, image, caption, storyId } = await req.json();

  if (action === "create") {
    if (!image) return NextResponse.json({ error: "Image required" }, { status: 400 });
    const story = await prisma.story.create({
      data: { userId: id, image, caption: caption || null, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    });
    return NextResponse.json({ story });
  }

  if (action === "view" && storyId) {
    await prisma.storyView.create({ data: { storyId, viewerId: id } }).catch(() => {});
    await prisma.story.update({ where: { id: storyId }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return NextResponse.json({ viewed: true });
  }

  if (action === "delete" && storyId) {
    await prisma.story.deleteMany({ where: { id: storyId, userId: id } });
    return NextResponse.json({ deleted: true });
  }

  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}
