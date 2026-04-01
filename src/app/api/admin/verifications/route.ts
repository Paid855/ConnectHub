import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest) { try { return JSON.parse(req.cookies.get("admin_session")?.value || "{}").isAdmin === true; } catch { return false; } }

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const pending = await prisma.user.findMany({ where: { verificationStatus: "pending" }, select: { id:true, name:true, email:true, profilePhoto:true, verificationPhoto:true, age:true, country:true, createdAt:true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ pending });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const { userId, action } = await req.json();
  if (action === "approve") {
    await prisma.user.update({ where: { id: userId }, data: { verified: true, verificationStatus: "approved" } });
    await prisma.user.update({ where: { id: userId }, data: { coins: { increment: 100 } } });
    await prisma.notification.create({ data: { userId, type: "verification", title: "Identity Verified!", message: "Your identity has been verified. You earned 100 coins!", fromUserId: null } }).catch(()=>{});
  } else {
    await prisma.user.update({ where: { id: userId }, data: { verificationStatus: "rejected" } });
    await prisma.notification.create({ data: { userId, type: "verification", title: "Verification Rejected", message: "Please try again with a clearer selfie.", fromUserId: null } }).catch(()=>{});
  }
  return NextResponse.json({ success: true });
}
