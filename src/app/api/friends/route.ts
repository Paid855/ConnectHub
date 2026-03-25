import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const [friends, requests, sent] = await Promise.all([
    prisma.friend.findMany({ where: { OR: [{ userId: id }, { friendId: id }], status: "accepted" }, include: { user: { select: { id:true, name:true, profilePhoto:true, tier:true, verified:true, lastSeen:true } }, friend: { select: { id:true, name:true, profilePhoto:true, tier:true, verified:true, lastSeen:true } } } }),
    prisma.friend.findMany({ where: { friendId: id, status: "pending" }, include: { user: { select: { id:true, name:true, profilePhoto:true, tier:true, verified:true } } } }),
    prisma.friend.findMany({ where: { userId: id, status: "pending" }, include: { friend: { select: { id:true, name:true, profilePhoto:true, tier:true, verified:true } } } }),
  ]);

  return NextResponse.json({ friends, requests, sent });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { friendId, action } = await req.json();
  if (!friendId) return NextResponse.json({ error: "No user" }, { status: 400 });

  if (action === "accept") {
    await prisma.friend.updateMany({ where: { userId: friendId, friendId: id, status: "pending" }, data: { status: "accepted" } });
    createNotification(friendId, "friend_accepted", "Friend Accepted!", "accepted your friend request", id);
    return NextResponse.json({ success: true });
  }
  if (action === "reject") {
    await prisma.friend.deleteMany({ where: { userId: friendId, friendId: id, status: "pending" } });
    return NextResponse.json({ success: true });
  }

  const existing = await prisma.friend.findFirst({ where: { OR: [{ userId: id, friendId }, { userId: friendId, friendId: id }] } });
  if (existing) return NextResponse.json({ exists: true, status: existing.status });

  await prisma.friend.create({ data: { userId: id, friendId, status: "pending" } });
  createNotification(friendId, "friend_request", "Friend Request", "sent you a friend request", id);
  return NextResponse.json({ success: true });
}
