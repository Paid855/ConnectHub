import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const user = await prisma.user.findUnique({ where: { id }, select: { coins: true, boostedUntil: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.boostedUntil && new Date(user.boostedUntil) > new Date()) return NextResponse.json({ error: "Already boosted" }, { status: 400 });
  if (user.coins < 100) return NextResponse.json({ error: "Need 100 coins" }, { status: 400 });

  const boostEnd = new Date(Date.now() + 30 * 60 * 1000);
  await prisma.user.update({ where: { id }, data: { coins: { decrement: 100 }, boostedUntil: boostEnd } });
  await prisma.coinTransaction.create({ data: { userId: id, amount: -100, type: "boost", description: "Profile boosted for 30 minutes" } });

  return NextResponse.json({ success: true, boostedUntil: boostEnd });
}
