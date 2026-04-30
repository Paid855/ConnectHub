import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id }, select: { lastLoginReward: true, loginStreak: true } });
  const today = new Date().toDateString();
  const lastReward = user?.lastLoginReward ? new Date(user.lastLoginReward).toDateString() : "";
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (lastReward === today) {
    return NextResponse.json({ error: "Already claimed", reward: 0, streak: user?.loginStreak || 1 }, { status: 400 });
  }

  // Calculate streak
  let streak = 1;
  if (lastReward === yesterday) {
    streak = (user?.loginStreak || 0) + 1;
  }

  // Bonus coins for streaks: day 1-6 = 5 coins, day 7 = 15, day 14 = 25, day 30 = 50
  let reward = 5;
  if (streak >= 30) reward = 50;
  else if (streak >= 14) reward = 25;
  else if (streak >= 7) reward = 15;
  else if (streak >= 3) reward = 10;

  await prisma.user.update({ where: { id }, data: { coins: { increment: reward }, lastLoginReward: new Date(), loginStreak: streak } });
  await prisma.coinTransaction.create({ data: { userId: id, amount: reward, type: "daily_reward", description: streak >= 7 ? "🔥 " + streak + "-day streak bonus!" : "Daily login reward" } }).catch(() => {});

  return NextResponse.json({ success: true, reward, streak });
}
