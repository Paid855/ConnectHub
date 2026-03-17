import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  // Update lastSeen
  await prisma.user.update({ where: { id }, data: { lastSeen: new Date() } }).catch(() => {});

  const friends = await prisma.friend.findMany({
    where: { OR: [{ userId: id, status: "accepted" }, { friendId: id, status: "accepted" }] }
  });

  const pending = await prisma.friend.findMany({
    where: { friendId: id, status: "pending" }
  });

  const friendIds = friends.map(f => f.userId === id ? f.friendId : f.userId);
  const pendingIds = pending.map(p => p.userId);

  const users = await prisma.user.findMany({
    where: { id: { in: [...friendIds, ...pendingIds] } },
    select: { id: true, name: true, profilePhoto: true, tier: true, lastSeen: true, country: true }
  });

  const now = Date.now();
  const friendList = friendIds.map(fid => {
    const u = users.find(u => u.id === fid);
    if (!u) return null;
    const online = u.lastSeen ? (now - new Date(u.lastSeen).getTime()) < 300000 : false;
    return { ...u, online, isFriend: true };
  }).filter(Boolean);

  const pendingList = pendingIds.map(pid => {
    const u = users.find(u => u.id === pid);
    if (!u) return null;
    return { ...u, online: false, isPending: true };
  }).filter(Boolean);

  return NextResponse.json({ friends: friendList, pending: pendingList, totalFriends: friendIds.length });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { friendId, action } = await req.json();

  if (action === "add") {
    const existing = await prisma.friend.findFirst({
      where: { OR: [{ userId: id, friendId }, { userId: friendId, friendId: id }] }
    });
    if (existing) return NextResponse.json({ error: "Already connected" }, { status: 400 });
    await prisma.friend.create({ data: { userId: id, friendId, status: "pending" } });
    return NextResponse.json({ sent: true });
  }

  if (action === "accept") {
    await prisma.friend.updateMany({ where: { userId: friendId, friendId: id, status: "pending" }, data: { status: "accepted" } });
    return NextResponse.json({ accepted: true });
  }

  if (action === "reject") {
    await prisma.friend.deleteMany({ where: { userId: friendId, friendId: id, status: "pending" } });
    return NextResponse.json({ rejected: true });
  }

  if (action === "unfriend") {
    await prisma.friend.deleteMany({ where: { OR: [{ userId: id, friendId }, { userId: friendId, friendId: id }] } });
    return NextResponse.json({ unfriended: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
