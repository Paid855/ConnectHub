import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { tier } = await req.json();

  if (!["premium", "gold"].includes(tier)) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { coins: true, tier: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Already has this tier or higher
  if (user.tier === "gold") return NextResponse.json({ error: "You already have Gold (highest tier)" }, { status: 400 });
  if (user.tier === "premium" && tier === "premium") return NextResponse.json({ error: "You already have Premium" }, { status: 400 });

  const cost = tier === "premium" ? 2000 : 5000;
  if (user.coins < cost) return NextResponse.json({ error: "Not enough coins. Need " + cost + " coins. You have " + user.coins + "." }, { status: 400 });

  await prisma.user.update({ where: { id }, data: { tier, coins: { decrement: cost } } });
  await prisma.coinTransaction.create({ data: { userId: id, amount: -cost, type: "upgrade", description: "Upgraded to " + tier.charAt(0).toUpperCase() + tier.slice(1) + " (permanent)" } });

  return NextResponse.json({ success: true, tier });
}
