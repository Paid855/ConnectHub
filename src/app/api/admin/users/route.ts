import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id:true, name:true, email:true, username:true, phone:true, age:true, gender:true, lookingFor:true, country:true, bio:true, profilePhoto:true, tier:true, verified:true, verificationStatus:true, verificationPhoto:true, idDocument:true, interests:true, coins:true, createdAt:true, lastSeen:true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const { userId, action, tier } = await req.json();

  if (!userId || !action) return NextResponse.json({ error: "Missing data" }, { status: 400 });

  if (action === "ban") {
    await prisma.user.update({ where: { id: userId }, data: { tier: "banned" } });
    return NextResponse.json({ success: true });
  }
  if (action === "unban") {
    await prisma.user.update({ where: { id: userId }, data: { tier: "free" } });
    return NextResponse.json({ success: true });
  }
  if (action === "delete") {
    await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }).catch(() => {});
    await prisma.post.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.friend.deleteMany({ where: { OR: [{ userId }, { friendId: userId }] } }).catch(() => {});
    await prisma.block.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }).catch(() => {});
    await prisma.notification.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.coinTransaction.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.storyView.deleteMany({ where: { viewerId: userId } }).catch(() => {});
    await prisma.story.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.gift.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  }
  if (action === "upgrade" && tier) {
    await prisma.user.update({ where: { id: userId }, data: { tier } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
