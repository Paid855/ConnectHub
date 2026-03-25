import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  let user = await prisma.user.findUnique({ where: { id }, select: { referralCode: true, coins: true } });

  // Generate referral code if not exists
  if (!user?.referralCode) {
    const code = "CH" + id.slice(-6).toUpperCase();
    await prisma.user.update({ where: { id }, data: { referralCode: code } });
    user = await prisma.user.findUnique({ where: { id }, select: { referralCode: true, coins: true } });
  }

  const referrals = await prisma.user.findMany({ where: { referredBy: id }, select: { id:true, name:true, profilePhoto:true, createdAt:true }, orderBy: { createdAt: "desc" } });

  return NextResponse.json({ referralCode: user?.referralCode, referralCount: referrals.length, referrals, totalEarned: referrals.length * 50 });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { referralCode } = await req.json();

  if (!referralCode) return NextResponse.json({ error: "Enter a referral code" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { referredBy: true } });
  if (user?.referredBy) return NextResponse.json({ error: "You already used a referral code" }, { status: 400 });

  const referrer = await prisma.user.findFirst({ where: { email: { not: "admin@connecthub.com" }, referralCode: referralCode.toUpperCase() } });
  if (!referrer) return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  if (referrer.id === id) return NextResponse.json({ error: "Cannot use your own code" }, { status: 400 });

  // Give both users coins
  await prisma.user.update({ where: { id }, data: { referredBy: referrer.id, coins: { increment: 25 } } });
  await prisma.user.update({ where: { id: referrer.id }, data: { coins: { increment: 50 } } });
  await prisma.coinTransaction.create({ data: { userId: id, amount: 25, type: "referral_bonus", description: "Referral bonus (joined)" } });
  await prisma.coinTransaction.create({ data: { userId: referrer.id, amount: 50, type: "referral_reward", description: "Referral reward (invited a friend)" } });

  return NextResponse.json({ success: true, bonus: 25 });
}
