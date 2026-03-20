import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const user = await prisma.user.findUnique({ where: { id }, select: { coins: true, boostedUntil: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.boostedUntil && new Date(user.boostedUntil) > new Date()) {
    const mins = Math.ceil((new Date(user.boostedUntil).getTime() - Date.now()) / 60000);
    return NextResponse.json({ error: "Already boosted! " + mins + " minutes remaining." }, { status: 400 });
  }

  const cost = 100;
  if (user.coins < cost) return NextResponse.json({ error: "Need " + cost + " coins. You have " + user.coins + "." }, { status: 400 });

  const boostEnd = new Date(Date.now() + 30 * 60 * 1000); // 30 min boost
  await prisma.user.update({ where: { id }, data: { coins: { decrement: cost }, boostedUntil: boostEnd } });
  await prisma.coinTransaction.create({ data: { userId: id, amount: -cost, type: "boost", description: "Profile Boost (30 minutes)" } });

  return NextResponse.json({ success: true, boostedUntil: boostEnd });
}
