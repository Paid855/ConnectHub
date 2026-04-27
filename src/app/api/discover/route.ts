import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { sendPushToUser } from "@/lib/push";
import { sendMatchEmail, sendLikeEmail } from "@/lib/email";

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

  // Daily like limit for free users (10 per day)
  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
  const userTier = user?.tier || "free";
  if (userTier === "free" || userTier === "basic") {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dailyLikes = await prisma.like.count({ where: { fromUserId: id, createdAt: { gte: today } } });
    if (dailyLikes >= 10) {
      return NextResponse.json({ error: "You've reached your daily like limit. Upgrade for unlimited likes!", upgrade: true }, { status: 403 });
    }
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

    // Send match emails
    const matchedUser = await prisma.user.findUnique({ where: { id: targetId }, select: { email: true, name: true } });
    if (matchedUser?.email) sendMatchEmail(matchedUser.email, matchedUser.name || "there", fromName);
    const fromUserFull = await prisma.user.findUnique({ where: { id }, select: { email: true, name: true } });
    if (fromUserFull?.email) sendMatchEmail(fromUserFull.email, fromUserFull.name || "there", matchedUser?.name || "Someone");

    return NextResponse.json({ ok: true, action: type, match: true });
  }

  // Notify the liked user
  if (type === "superlike") {
    createNotification(targetId, "superlike", "Super Like! ⭐", `${fromName} Super Liked you!`, id);
    sendPushToUser(targetId, { title: "Super Like! ⭐", body: `${fromName} Super Liked you! Check them out.`, url: "/dashboard", tag: "superlike-" + id });
    const superLikedUser = await prisma.user.findUnique({ where: { id: targetId }, select: { email: true, name: true } });
    if (superLikedUser?.email) sendLikeEmail(superLikedUser.email, superLikedUser.name || "there", fromName, true);
  } else {
    createNotification(targetId, "like", "Someone Likes You 💕", `${fromName} liked your profile`, id);
    sendPushToUser(targetId, { title: "New Like 💕", body: "Someone liked your profile!", url: "/dashboard", tag: "like-" + id });
    const likedUser = await prisma.user.findUnique({ where: { id: targetId }, select: { email: true, name: true } });
    if (likedUser?.email) sendLikeEmail(likedUser.email, likedUser.name || "there", fromName, false);
  }

  return NextResponse.json({ ok: true, action: type, match: false });
}
