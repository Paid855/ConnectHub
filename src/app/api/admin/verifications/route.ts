import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminSession = req.cookies.get("admin_session");
  if (!adminSession) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const pending = await prisma.user.findMany({
    where: { verificationStatus: "pending" },
    select: { id:true, name:true, email:true, profilePhoto:true, verificationPhoto:true, age:true, country:true, createdAt:true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ pending });
}

export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("admin_session");
  if (!adminSession) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { userId, action } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: "Missing data" }, { status: 400 });

  if (action === "approve") {
    await prisma.user.update({ where: { id: userId }, data: { verified: true, verificationStatus: "approved" } });
    await prisma.notification.create({ data: { userId, type: "verification", title: "Identity Verified!", message: "Congratulations! Your identity has been verified. You now have a verified badge.", fromUserId: null } }).catch(() => {});
    // Award 100 coins for verification
    await prisma.user.update({ where: { id: userId }, data: { coins: { increment: 100 } } });
    await prisma.coinTransaction.create({ data: { userId, amount: 100, type: "verification_reward", description: "Reward for identity verification" } }).catch(() => {});
  } else if (action === "reject") {
    await prisma.user.update({ where: { id: userId }, data: { verificationStatus: "rejected" } });
    await prisma.notification.create({ data: { userId, type: "verification", title: "Verification Not Approved", message: "Your verification was not approved. Please try again with a clearer selfie in good lighting.", fromUserId: null } }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
