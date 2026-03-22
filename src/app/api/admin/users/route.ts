import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id:true, name:true, username:true, email:true, phone:true, age:true, gender:true,
        lookingFor:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true,
        verificationStatus:true, coins:true, interests:true, isPrivate:true,
        lastSeen:true, createdAt:true
      }
    });

    const totalUsers = users.length;
    const verifiedUsers = users.filter(u => u.verified).length;
    const premiumUsers = users.filter(u => u.tier === "premium" || u.tier === "gold").length;
    const bannedUsers = users.filter(u => u.tier === "banned").length;
    const onlineNow = users.filter(u => u.lastSeen && Date.now() - new Date(u.lastSeen).getTime() < 5 * 60 * 1000).length;

    return NextResponse.json({
      users,
      stats: { totalUsers, verifiedUsers, premiumUsers, bannedUsers, onlineNow }
    });
  } catch (e) {
    console.error("Admin users error:", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { action, userId, tier } = await req.json();

  if (action === "ban") {
    await prisma.user.update({ where: { id: userId }, data: { tier: "banned" } });
    return NextResponse.json({ success: true });
  }

  if (action === "unban") {
    await prisma.user.update({ where: { id: userId }, data: { tier: "basic" } });
    return NextResponse.json({ success: true });
  }

  if (action === "changeTier") {
    await prisma.user.update({ where: { id: userId }, data: { tier } });
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }).catch(() => {});
    await prisma.postComment.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.postLike.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.post.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.friend.deleteMany({ where: { OR: [{ userId }, { friendId: userId }] } }).catch(() => {});
    await prisma.notification.deleteMany({ where: { OR: [{ userId }, { fromUserId: userId }] } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
