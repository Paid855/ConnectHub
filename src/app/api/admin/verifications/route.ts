import { emailVerified } from "@/lib/email-notifications";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const pending = await prisma.user.findMany({
      where: { verificationStatus: "pending" },
      select: { id:true, name:true, username:true, email:true, phone:true, age:true, gender:true, country:true, profilePhoto:true, verificationPhoto:true, idDocument:true, tier:true, createdAt:true },
      orderBy: { createdAt: "desc" }
    });
    const approved = await prisma.user.findMany({
      where: { verificationStatus: "approved" },
      select: { id:true, name:true, email:true, profilePhoto:true, verificationPhoto:true, idDocument:true, tier:true, createdAt:true },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    const rejected = await prisma.user.findMany({
      where: { verificationStatus: "rejected" },
      select: { id:true, name:true, email:true, profilePhoto:true, verificationPhoto:true, tier:true, createdAt:true },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return NextResponse.json({ pending, approved, rejected, stats: { pending: pending.length, approved: approved.length, rejected: rejected.length } });
  } catch (e) {
    console.error("Admin verifications error:", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const { action, userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    if (action === "approve") {
      await prisma.user.update({ where: { id: userId }, data: { verificationStatus: "approved", verified: true } });
      prisma.user.findUnique({ where: { id: userId }, select: { email:true, name:true } }).then(u => { if(u) emailVerified(u.email, u.name).catch(()=>{}); }).catch(()=>{});
      createNotification(userId, "verification", "Verified!", "Your identity has been verified. You now have the verified badge!", undefined);
      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      await prisma.user.update({ where: { id: userId }, data: { verificationStatus: "rejected", verified: false, verificationPhoto: null, idDocument: null } });
      createNotification(userId, "verification", "Verification Rejected", "Your verification was not approved. Please try again with clearer photos.", undefined);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("Admin verify action error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
