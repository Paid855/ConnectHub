import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

const GIFTS = [
  { id: "rose", emoji: "🌹", name: "Rose", cost: 5 },
  { id: "heart", emoji: "💝", name: "Heart Box", cost: 10 },
  { id: "teddy", emoji: "🧸", name: "Teddy Bear", cost: 20 },
  { id: "kiss", emoji: "💋", name: "Kiss", cost: 15 },
  { id: "diamond", emoji: "💎", name: "Diamond", cost: 50 },
  { id: "crown", emoji: "👑", name: "Crown", cost: 100 },
  { id: "fire", emoji: "🔥", name: "Fire", cost: 25 },
  { id: "star", emoji: "🌟", name: "Superstar", cost: 30 },
  { id: "champagne", emoji: "🍾", name: "Champagne", cost: 40 },
  { id: "ring", emoji: "💍", name: "Ring", cost: 200 },
];

export async function GET() {
  return NextResponse.json({ gifts: GIFTS });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { receiverId, giftId } = await req.json();
  if (!receiverId || !giftId) return NextResponse.json({ error: "Missing data" }, { status: 400 });

  const gift = GIFTS.find(g => g.id === giftId);
  if (!gift) return NextResponse.json({ error: "Invalid gift" }, { status: 400 });

  const sender = await prisma.user.findUnique({ where: { id }, select: { coins: true, name: true } });
  if (!sender || sender.coins < gift.cost) {
    return NextResponse.json({ error: "Not enough coins. You need " + gift.cost + " coins.", needCoins: true }, { status: 403 });
  }

  // Deduct coins from sender, add to receiver
  await prisma.user.update({ where: { id }, data: { coins: { decrement: gift.cost } } });
  await prisma.user.update({ where: { id: receiverId }, data: { coins: { increment: Math.floor(gift.cost * 0.7) } } });

  // Log transactions
  await prisma.coinTransaction.create({ data: { userId: id, amount: -gift.cost, type: "gift_sent", description: "Sent " + gift.name + " " + gift.emoji } }).catch(() => {});
  await prisma.coinTransaction.create({ data: { userId: receiverId, amount: Math.floor(gift.cost * 0.7), type: "gift_received", description: "Received " + gift.name + " " + gift.emoji + " from " + (sender.name || "someone") } }).catch(() => {});

  // Send as message
  await prisma.message.create({
    data: { senderId: id, receiverId, content: "[GIFT]" + gift.emoji + "|" + gift.name + "|" + gift.cost }
  });

  // Notify receiver
  createNotification(receiverId, "gift", gift.emoji + " Gift Received!", (sender.name || "Someone") + " sent you a " + gift.name + "!", id);

  return NextResponse.json({ success: true, gift, remaining: sender.coins - gift.cost });
}
