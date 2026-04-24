import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest) { try { return JSON.parse(req.cookies.get("admin_session")?.value || "{}").isAdmin === true; } catch { return false; } }

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:true, name:true, email:true, username:true, phone:true, age:true,
      gender:true, country:true, bio:true, profilePhoto:true, tier:true,
      verified:true, verificationStatus:true, verificationPhoto:true,
      idDocument:true, idDocumentBack:true, idType:true, interests:true,
      coins:true, createdAt:true, lastActive:true, banned:true,
      lookingFor:true, city:true, photos:true
    }
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const body = await req.json();
  const { userId, action } = body;

  if (action === "ban") {
    await prisma.user.update({ where: { id: userId }, data: { banned: true } });
    return NextResponse.json({ success: true });
  }
  if (action === "unban") {
    await prisma.user.update({ where: { id: userId }, data: { banned: false } });
    return NextResponse.json({ success: true });
  }
  if (action === "delete") {
    await prisma.notification.deleteMany({ where: { userId } }).catch(()=>{});
    await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }).catch(()=>{});
    await prisma.friend.deleteMany({ where: { OR: [{ userId }, { friendId: userId }] } }).catch(()=>{});
    await prisma.block.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }).catch(()=>{});
    await prisma.like.deleteMany({ where: { OR: [{ likerId: userId }, { likedId: userId }] } }).catch(()=>{});
    await prisma.user.delete({ where: { id: userId } }).catch(()=>{});
    return NextResponse.json({ success: true });
  }
  if (action === "upgrade") {
    await prisma.user.update({ where: { id: userId }, data: { tier: body.tier || "premium" } });
    return NextResponse.json({ success: true });
  }
  if (action === "addCoins") {
    const amount = parseInt(body.amount) || 0;
    if (amount > 0) await prisma.user.update({ where: { id: userId }, data: { coins: { increment: amount } } });
    return NextResponse.json({ success: true });
  }
  if (action === "setCoins") {
    const amount = parseInt(body.amount) || 0;
    await prisma.user.update({ where: { id: userId }, data: { coins: amount } });
    return NextResponse.json({ success: true });
  }
  if (action === "editProfile") {
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.username !== undefined) updates.username = body.username;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.age !== undefined) updates.age = body.age ? parseInt(body.age) : null;
    if (body.gender !== undefined) updates.gender = body.gender;
    if (body.country !== undefined) updates.country = body.country;
    if (body.city !== undefined) updates.city = body.city;
    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.lookingFor !== undefined) updates.lookingFor = body.lookingFor;
    if (body.tier !== undefined) updates.tier = body.tier;
    if (body.verified !== undefined) updates.verified = body.verified;
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({ where: { id: userId }, data: updates });
    }
    return NextResponse.json({ success: true });
  }
  if (action === "resetVerification") {
    await prisma.user.update({ where: { id: userId }, data: { verified: false, verificationStatus: null, verificationPhoto: null, idDocument: null, idDocumentBack: null } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
