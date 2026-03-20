import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const user = await prisma.user.findUnique({ where: { id }, select: { lastLoginReward: true, coins: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (user.lastLoginReward) {
    const lastReward = new Date(user.lastLoginReward);
    const lastRewardDay = new Date(lastReward.getFullYear(), lastReward.getMonth(), lastReward.getDate());
    if (lastRewardDay.getTime() === today.getTime()) {
      return NextResponse.json({ error: "Already claimed today! Come back tomorrow.", alreadyClaimed: true }, { status: 400 });
    }
  }

  const reward = 10;
  await prisma.user.update({ where: { id }, data: { coins: { increment: reward }, lastLoginReward: now } });
  await prisma.coinTransaction.create({ data: { userId: id, amount: reward, type: "daily_reward", description: "Daily Login Reward" } });

  return NextResponse.json({ success: true, reward, newBalance: (user.coins || 0) + reward });
}
