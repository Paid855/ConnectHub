import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { tier } = await req.json();

  const user = await prisma.user.findUnique({ where: { id }, select: { coins: true, tier: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (tier === "premium") {
    if (user.tier === "premium" || user.tier === "gold") return NextResponse.json({ error: "Already upgraded" }, { status: 400 });
    if (user.coins < 2000) return NextResponse.json({ error: "Need 2,000 coins" }, { status: 400 });
    await prisma.user.update({ where: { id }, data: { tier: "premium", coins: { decrement: 2000 } } });
    await prisma.coinTransaction.create({ data: { userId: id, amount: -2000, type: "upgrade", description: "Upgraded to Premium" } });
  } else if (tier === "gold") {
    if (user.tier === "gold") return NextResponse.json({ error: "Already Gold" }, { status: 400 });
    if (user.coins < 5000) return NextResponse.json({ error: "Need 5,000 coins" }, { status: 400 });
    await prisma.user.update({ where: { id }, data: { tier: "gold", coins: { decrement: 5000 } } });
    await prisma.coinTransaction.create({ data: { userId: id, amount: -5000, type: "upgrade", description: "Upgraded to Gold" } });
  } else {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  return NextResponse.json({ success: true, tier });
}
