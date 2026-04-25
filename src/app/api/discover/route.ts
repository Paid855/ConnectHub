import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { sendPushToUser } from "@/lib/push";

function getUserId(req: NextRequest) {
  try {
    const c = req.cookies.get("session")?.value;
    if (!c) return null;
    const p = JSON.parse(c);
    return p.id || p.userId || null;
  } catch { return null; }
}

// POST — like, superlike, or pass
export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { targetId, type } = await req.json();
  if (!targetId || !type) return NextResponse.json({ error: "Missing data" }, { status: 400 });

  // Check tier for super likes
  if (type === "superlike") {
    const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
    if (!user?.tier || user.tier === "free") {
      return NextResponse.json({ error: "Super Likes require Plus or Premium", upgrade: true }, { status: 403 });
    }

    // Check weekly super like limit (5 per week for Premium, 2 for Plus)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const superCount = await prisma.like.count({
      where: { fromUserId: id, type: "superlike", createdAt: { gte: weekAgo } },
    });
    const limit = user.tier === "premium" ? 5 : 2;
    if (superCount >= limit) {
      return NextResponse.json({ error: `You've used all ${limit} Super Likes this week`, limit: true }, { status: 403 });
    }
  }

  if (type === "pass") {
    return NextResponse.json({ ok: true, action: "pass" });
  }

  // Create like
  try {
    await prisma.like.upsert({
      where: { fromUserId_toUserId: { fromUserId: id, toUserId: targetId } },
      update: { type },
      create: { fromUserId: id, toUserId: targetId, type },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  // Check if mutual like (match!)
  const mutualLike = await prisma.like.findUnique({
    where: { fromUserId_toUserId: { fromUserId: targetId, toUserId: id } },
  });

  const fromUser = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  const fromName = fromUser?.name || "Someone";

  if (mutualLike) {
    // It's a match! Auto-add as friends
    const existingFriend = await prisma.friendRequest.findFirst({
      where: { OR: [{ senderId: id, receiverId: targetId }, { senderId: targetId, receiverId: id }] },
    });
    if (!existingFriend) {
      try {
        await prisma.friendRequest.create({ data: { senderId: id, receiverId: targetId, status: "accepted" } });
      } catch {}
    }

    // Notify both users
    createNotification(id, "match", "It's a Match! 💕", `You and ${(await prisma.user.findUnique({ where: { id: targetId }, select: { name: true } }))?.name || "someone"} liked each other!`, targetId);
    createNotification(targetId, "match", "It's a Match! 💕", `You and ${fromName} liked each other!`, id);
    sendPushToUser(id, { title: "It's a Match! 💕", body: "You have a new match! Start chatting now.", url: "/dashboard/messages", tag: "match-" + targetId });
    sendPushToUser(targetId, { title: "It's a Match! 💕", body: `${fromName} likes you too! Start chatting.`, url: "/dashboard/messages", tag: "match-" + id });

    return NextResponse.json({ ok: true, action: type, match: true });
  }

  // Notify the liked user
  if (type === "superlike") {
    createNotification(targetId, "superlike", "Super Like! ⭐", `${fromName} Super Liked you!`, id);
    sendPushToUser(targetId, { title: "Super Like! ⭐", body: `${fromName} Super Liked you! Check them out.`, url: "/dashboard", tag: "superlike-" + id });
  } else {
    createNotification(targetId, "like", "Someone Likes You 💕", `${fromName} liked your profile`, id);
    sendPushToUser(targetId, { title: "New Like 💕", body: "Someone liked your profile!", url: "/dashboard", tag: "like-" + id });
  }

  return NextResponse.json({ ok: true, action: type, match: false });
}
