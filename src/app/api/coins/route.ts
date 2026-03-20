import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const user = await prisma.user.findUnique({ where: { id }, select: { coins: true } });
  const transactions = await prisma.coinTransaction.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 50 });
  const giftsReceived = await prisma.gift.findMany({ where: { receiverId: id }, orderBy: { createdAt: "desc" }, take: 50 });

  const senderIds = [...new Set(giftsReceived.map(g => g.senderId))];
  const senders = senderIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: senderIds } }, select: { id:true, name:true, profilePhoto:true } }) : [];

  return NextResponse.json({
    coins: user?.coins || 0,
    transactions,
    giftsReceived: giftsReceived.map(g => ({ ...g, sender: senders.find(s => s.id === g.senderId) }))
  });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { action, amount, packageName } = await req.json();

  if (action === "buy") {
    const packages: Record<string, number> = { "100 Coins": 100, "500 Coins": 500, "1000 Coins": 1000, "5000 Coins": 5000 };
    const coinAmount = packages[packageName];
    if (!coinAmount) return NextResponse.json({ error: "Invalid package" }, { status: 400 });

    await prisma.user.update({ where: { id }, data: { coins: { increment: coinAmount } } });
    await prisma.coinTransaction.create({ data: { userId: id, amount: coinAmount, type: "purchase", description: "Purchased " + packageName } });

    const user = await prisma.user.findUnique({ where: { id }, select: { coins: true } });
    return NextResponse.json({ success: true, coins: user?.coins || 0 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
