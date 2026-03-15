import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function checkAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id:true, name:true, email:true, age:true, gender:true, lookingFor:true, bio:true, profilePhoto:true, tier:true, verified:true, verificationStatus:true, verificationPhoto:true, idDocument:true, createdAt:true }
  });
  const total = users.length;
  const verified = users.filter(u => u.tier === "verified").length;
  const basic = users.filter(u => u.tier === "basic").length;
  const pending = users.filter(u => u.verificationStatus === "pending").length;
  const today = users.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length;
  return NextResponse.json({ users, stats: { total, verified, basic, pending, today } });
}

export async function PUT(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, action } = await req.json();
  try {
    if (action === "approve") await prisma.user.update({ where: { id: userId }, data: { tier: "verified", verified: true, verificationStatus: "approved" } });
    else if (action === "reject") await prisma.user.update({ where: { id: userId }, data: { tier: "basic", verified: false, verificationStatus: "rejected", verificationPhoto: null, idDocument: null } });
    else if (action === "ban") await prisma.user.update({ where: { id: userId }, data: { tier: "banned", verificationStatus: "banned" } });
    else if (action === "unban") await prisma.user.update({ where: { id: userId }, data: { tier: "basic", verificationStatus: "none" } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await req.json();
  try { await prisma.user.delete({ where: { id: userId } }); return NextResponse.json({ success: true }); }
  catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
