import { emailFriendRequest } from "@/lib/email-notifications";
import { createNotification } from "@/lib/notify";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  // Update lastSeen
  await prisma.user.update({ where: { id }, data: { lastSeen: new Date() } }).catch(() => {});

  // Get explicit friends
  const friendRecords = await prisma.friend.findMany({
    where: { OR: [{ userId: id, status: "accepted" }, { friendId: id, status: "accepted" }] }
  });
  const explicitFriendIds = friendRecords.map(f => f.userId === id ? f.friendId : f.userId);

  // Get pending requests TO me
  const pending = await prisma.friend.findMany({ where: { friendId: id, status: "pending" } });
  const pendingIds = pending.map(p => p.userId);

  // Auto-friends: anyone I've exchanged messages with
  const sentMsgs = await prisma.message.findMany({ where: { senderId: id }, select: { receiverId: true } });
  const recvMsgs = await prisma.message.findMany({ where: { receiverId: id }, select: { senderId: true } });
  const messagedIds = [...new Set([...sentMsgs.map(m => m.receiverId), ...recvMsgs.map(m => m.senderId)])];

  // Combine: explicit friends + message contacts (no duplicates)
  const allFriendIds = [...new Set([...explicitFriendIds, ...messagedIds])];

  // Get blocked users to exclude
  const blocks = await prisma.block.findMany({ where: { OR: [{ blockerId: id }, { blockedId: id }] } });
  const blockedIds = blocks.map(b => b.blockerId === id ? b.blockedId : b.blockerId);

  const filteredFriendIds = allFriendIds.filter(fid => fid !== id && !blockedIds.includes(fid));

  // Get all user data
  const allUserIds = [...new Set([...filteredFriendIds, ...pendingIds])];
  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds }, tier: { not: "banned" }, email: { not: "admin@connecthub.com" } },
    select: { id: true, name: true, profilePhoto: true, tier: true, lastSeen: true, country: true }
  });

  const now = Date.now();

  const friendList = filteredFriendIds.map(fid => {
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

  // Sort: online first, then by name
  friendList.sort((a: any, b: any) => {
    if (a.online && !b.online) return -1;
    if (!a.online && b.online) return 1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ friends: friendList, pending: pendingList, totalFriends: filteredFriendIds.length });
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
    prisma.user.findUnique({ where: { id: friendId }, select: { email:true, name:true } }).then(u => { if(u) { const sender = "Someone"; emailFriendRequest(u.email, u.name, sender).catch(()=>{}); } }).catch(()=>{});
    createNotification(friendId, "friend_request", "Friend Request", "wants to be your friend", id);
    return NextResponse.json({ sent: true });
  }

  if (action === "accept") {
    await prisma.friend.updateMany({ where: { userId: friendId, friendId: id, status: "pending" }, data: { status: "accepted" } });
    createNotification(friendId, "friend_accepted", "Friend Accepted", "accepted your friend request", id);
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
