import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const user = await prisma.user.findUnique({ where: { id }, select: { lastLoginReward: true } });
  const today = new Date().toDateString();
  const lastReward = user?.lastLoginReward ? new Date(user.lastLoginReward).toDateString() : "";

  if (lastReward === today) return NextResponse.json({ error: "Already claimed", reward: 0 }, { status: 400 });

  await prisma.user.update({ where: { id }, data: { coins: { increment: 10 }, lastLoginReward: new Date() } });
  await prisma.coinTransaction.create({ data: { userId: id, amount: 10, type: "daily_reward", description: "Daily login reward" } }).catch(() => {});

  return NextResponse.json({ success: true, reward: 10 });
}
