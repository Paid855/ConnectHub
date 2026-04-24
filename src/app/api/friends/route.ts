import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { sendPushToUser } from "@/lib/push";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const allFriends = await prisma.friend.findMany({ where: { OR: [{ userId: id }, { friendId: id }] } });

    const accepted = allFriends.filter(f => f.status === "accepted");
    const pending = allFriends.filter(f => f.status === "pending" && f.friendId === id);
    const sentReqs = allFriends.filter(f => f.status === "pending" && f.userId === id);

    const userIds = [...new Set([
      ...accepted.map(f => f.userId === id ? f.friendId : f.userId),
      ...pending.map(f => f.userId),
      ...sentReqs.map(f => f.friendId),
    ])];

    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id:true, name:true, profilePhoto:true, tier:true, verified:true, lastSeen:true }
    }) : [];

    const getUser = (uid: string) => users.find(u => u.id === uid) || null;

    return NextResponse.json({
      friends: accepted.map(f => ({ id:f.id, user:getUser(f.userId === id ? f.friendId : f.userId), createdAt:f.createdAt })).filter(f => f.user),
      requests: pending.map(f => ({ id:f.id, user:getUser(f.userId), createdAt:f.createdAt })).filter(r => r.user),
      sent: sentReqs.map(f => ({ id:f.id, friend:getUser(f.friendId), createdAt:f.createdAt })).filter(s => s.friend),
    });
  } catch (e) {
    console.error("Friends error:", e);
    return NextResponse.json({ friends: [], requests: [], sent: [] });
  }
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { friendId, action } = await req.json();
  if (!friendId) return NextResponse.json({ error: "No user" }, { status: 400 });

  if (action === "accept") {
    await prisma.friend.updateMany({ where: { userId: friendId, friendId: id, status: "pending" }, data: { status: "accepted" } });
    createNotification(friendId, "friend_accepted", "Friend Accepted!", "accepted your friend request", id);
    sendPushToUser(friendId, { title: "Friend Accepted! 🤝", body: "Your friend request was accepted", url: "/dashboard/browse", tag: "friend-accept-" + id });
    return NextResponse.json({ success: true });
  }
  if (action === "reject") {
    await prisma.friend.deleteMany({ where: { userId: friendId, friendId: id, status: "pending" } });
    return NextResponse.json({ success: true });
  }

  // Check existing
  const existing = await prisma.friend.findFirst({ where: { OR: [{ userId: id, friendId }, { userId: friendId, friendId: id }] } });
  if (existing) return NextResponse.json({ exists: true, status: existing.status });

  await prisma.friend.create({ data: { userId: id, friendId, status: "pending" } });
  createNotification(friendId, "friend_request", "Friend Request", "wants to be your friend", id);
  sendPushToUser(friendId, { title: "New Friend Request 💕", body: "Someone wants to connect with you", url: "/dashboard/browse", tag: "friend-req-" + id });
  return NextResponse.json({ success: true });
}
