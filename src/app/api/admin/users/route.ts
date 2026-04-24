import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest) { try { return JSON.parse(req.cookies.get("admin_session")?.value || "{}").isAdmin === true; } catch { return false; } }

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    const safe = users.map(u => ({ ...u, password: undefined }));
    return NextResponse.json({ users: safe });
  } catch (e: any) {
    console.error("Admin users error:", e?.message);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { userId, action } = body;

    if (action === "ban") {
      await prisma.user.update({ where: { id: userId }, data: { banned: true } });
    } else if (action === "unban") {
      await prisma.user.update({ where: { id: userId }, data: { banned: false } });
    } else if (action === "delete") {
      await prisma.notification.deleteMany({ where: { userId } }).catch(()=>{});
      await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }).catch(()=>{});
      await prisma.friend.deleteMany({ where: { OR: [{ userId }, { friendId: userId }] } }).catch(()=>{});
      await prisma.block.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }).catch(()=>{});
      await prisma.like.deleteMany({ where: { OR: [{ likerId: userId }, { likedId: userId }] } }).catch(()=>{});
      await prisma.user.delete({ where: { id: userId } }).catch(()=>{});
    } else if (action === "upgrade") {
      await prisma.user.update({ where: { id: userId }, data: { tier: body.tier || "premium" } });
    } else if (action === "addCoins") {
      const amount = parseInt(body.amount) || 0;
      if (amount > 0) await prisma.user.update({ where: { id: userId }, data: { coins: { increment: amount } } });
    } else if (action === "setCoins") {
      const amount = parseInt(body.amount) || 0;
      await prisma.user.update({ where: { id: userId }, data: { coins: amount } });
    } else if (action === "editProfile") {
      const updates: any = {};
      const fields = ["name","email","username","phone","gender","country","city","bio","lookingFor","tier"];
      for (const f of fields) { if (body[f] !== undefined) updates[f] = body[f]; }
      if (body.age !== undefined) updates.age = body.age ? parseInt(body.age) : null;
      if (body.verified !== undefined) updates.verified = body.verified;
      if (Object.keys(updates).length > 0) {
        await prisma.user.update({ where: { id: userId }, data: updates });
      }
    } else if (action === "resetVerification") {
      await prisma.user.update({ where: { id: userId }, data: { verified: false, verificationStatus: null, verificationPhoto: null, idDocument: null } });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Admin action error:", e?.message);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
