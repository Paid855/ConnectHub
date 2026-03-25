import { getUserId } from "@/lib/auth";
import { uploadImage, uploadVideo } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const _rl = rateLimit("story:" + id, 10, 60000);
  if (!_rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Delete expired stories
  await prisma.story.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});

  const stories = await prisma.story.findMany({ where: { expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  const userIds = [...new Set(stories.map(s => s.userId))];
  const users = userIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: userIds }, email: { not: "admin@connecthub.com" } },
    select: { id:true, name:true, profilePhoto:true }
  }) : [];

  // Get all story views for accurate counts
  const storyIds = stories.map(s => s.id);
  const allViews = storyIds.length > 0 ? await prisma.storyView.findMany({ where: { storyId: { in: storyIds } } }) : [];

  // Group by user
  const grouped: Record<string, any> = {};
  stories.forEach(s => {
    const u = users.find(u => u.id === s.userId);
    if (!u) return; // Skip if no user (admin)
    if (!grouped[s.userId]) grouped[s.userId] = { user: u, stories: [] };
    const views = allViews.filter(v => v.storyId === s.id);
    grouped[s.userId].stories.push({
      ...s,
      viewCount: views.length,
      viewedByMe: views.some(v => v.viewerId === id)
    });
  });

  return NextResponse.json({ storyGroups: Object.values(grouped), myId: id });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const body = await req.json();
  const { action, image, caption, storyId, reply } = body;

  if (action === "create") {
    if (!image) return NextResponse.json({ error: "Image or video required" }, { status: 400 });
    let storeUrl = image;
    if (image.startsWith("[VID]")) {
      const vidData = image.replace("[VID]", "");
      if (vidData.startsWith("data:")) {
        const cloudUrl = await uploadVideo(vidData, "stories");
        storeUrl = cloudUrl ? "[VID]" + cloudUrl : image;
      }
    } else if (image.startsWith("data:")) {
      const cloudUrl = await uploadImage(image, "stories");
      storeUrl = cloudUrl || image;
    }

    const story = await prisma.story.create({
      data: { userId: id, image: storeUrl, caption: caption || null, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    });
    return NextResponse.json({ story });
  }

  if (action === "view" && storyId) {
    // Only count unique views
    const existing = await prisma.storyView.findFirst({ where: { storyId, viewerId: id } });
    if (!existing) {
      await prisma.storyView.create({ data: { storyId, viewerId: id } }).catch(() => {});
    }
    return NextResponse.json({ viewed: true });
  }

  if (action === "viewers" && storyId) {
    // Get who viewed this story
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.userId !== id) return NextResponse.json({ error: "Not your story" }, { status: 403 });
    const views = await prisma.storyView.findMany({ where: { storyId }, orderBy: { createdAt: "desc" } });
    const viewerIds = views.map(v => v.viewerId);
    const viewers = viewerIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: viewerIds } },
      select: { id:true, name:true, profilePhoto:true }
    }) : [];
    return NextResponse.json({
      viewers: views.map(v => ({ ...v, user: viewers.find(u => u.id === v.viewerId) })),
      totalViews: views.length
    });
  }

  if (action === "reply" && storyId && reply) {
    // Send reply as a message to the story owner
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });
    if (story.userId === id) return NextResponse.json({ error: "Cannot reply to your own story" }, { status: 400 });

    const content = "[STORY_REPLY]" + reply;
    await prisma.message.create({ data: { senderId: id, receiverId: story.userId, content } });
    createNotification(story.userId, "story_reply", "Story Reply", "replied to your story", id);
    return NextResponse.json({ sent: true });
  }

  if (action === "react" && storyId) {
    // Send a heart reaction as message
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });
    if (story.userId === id) return NextResponse.json({ ok: true });

    await prisma.message.create({ data: { senderId: id, receiverId: story.userId, content: "[STORY_REACT]❤️ Loved your story" } });
    createNotification(story.userId, "story_react", "Story Reaction", "loved your story ❤️", id);
    return NextResponse.json({ reacted: true });
  }

  if (action === "delete" && storyId) {
    await prisma.storyView.deleteMany({ where: { storyId } }).catch(() => {});
    await prisma.story.deleteMany({ where: { id: storyId, userId: id } });
    return NextResponse.json({ deleted: true });
  }

  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}
