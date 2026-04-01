import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest) { try { return JSON.parse(req.cookies.get("admin_session")?.value || "{}").isAdmin === true; } catch { return false; } }

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const users = await prisma.user.findMany({ select: { id:true, name:true, email:true, username:true, phone:true, age:true, gender:true, country:true, profilePhoto:true, tier:true, verified:true, verificationStatus:true, verificationPhoto:true, coins:true, bio:true, interests:true, createdAt:true, lastSeen:true }, orderBy: { createdAt: "desc" }, take: 500 });
  return NextResponse.json({ users, stats: { total:users.length, verified:users.filter(u=>u.verified).length, premium:users.filter(u=>["plus","premium","gold"].includes(u.tier||"")).length, banned:users.filter(u=>u.tier==="banned").length } });
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const { userId, action, tier, field, value } = await req.json();
  if (action === "ban") await prisma.user.update({ where: { id: userId }, data: { tier: "banned" } });
  if (action === "unban") await prisma.user.update({ where: { id: userId }, data: { tier: "free" } });
  if (action === "changeTier") await prisma.user.update({ where: { id: userId }, data: { tier } });
  if (action === "verify") await prisma.user.update({ where: { id: userId }, data: { verified: true, verificationStatus: "approved" } });
  if (action === "editField" && field && value !== undefined) {
    const data: any = {};
    data[field] = field === "age" || field === "coins" ? parseInt(value) : value;
    await prisma.user.update({ where: { id: userId }, data });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const { userId } = await req.json();
  await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }).catch(()=>{});
  await prisma.post.deleteMany({ where: { userId } }).catch(()=>{});
  await prisma.friend.deleteMany({ where: { OR: [{ userId }, { friendId: userId }] } }).catch(()=>{});
  await prisma.notification.deleteMany({ where: { userId } }).catch(()=>{});
  await prisma.coinTransaction.deleteMany({ where: { userId } }).catch(()=>{});
  await prisma.user.delete({ where: { id: userId } }).catch(()=>{});
  return NextResponse.json({ success: true });
}
