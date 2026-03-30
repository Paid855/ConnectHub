import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  if (!session) return false;
  try { return JSON.parse(session.value).isAdmin === true; } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const users = await prisma.user.findMany({
    select: { id:true, name:true, email:true, username:true, phone:true, age:true, gender:true, country:true, profilePhoto:true, tier:true, verified:true, verificationStatus:true, verificationPhoto:true, coins:true, bio:true, interests:true, createdAt:true, lastSeen:true },
    orderBy: { createdAt: "desc" },
    take: 500
  });
  const stats = {
    total: users.length,
    verified: users.filter(u => u.verified).length,
    premium: users.filter(u => u.tier === "premium" || u.tier === "gold" || u.tier === "plus").length,
    banned: users.filter(u => u.tier === "banned").length,
  };
  return NextResponse.json({ users, stats });
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const { userId, action } = await req.json();
  if (action === "ban") await prisma.user.update({ where: { id: userId }, data: { tier: "banned" } });
  if (action === "unban") await prisma.user.update({ where: { id: userId }, data: { tier: "free" } });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const { userId } = await req.json();
  await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }).catch(() => {});
  await prisma.post.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.friend.deleteMany({ where: { OR: [{ userId }, { friendId: userId }] } }).catch(() => {});
  await prisma.notification.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  return NextResponse.json({ success: true });
}
