import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

const GIFTS = [
  { id:"rose", name:"Rose", emoji:"🌹", coins:10 },
  { id:"chocolate", name:"Chocolate", emoji:"🍫", coins:25 },
  { id:"teddy", name:"Teddy Bear", emoji:"🧸", coins:50 },
  { id:"ring", name:"Ring", emoji:"💍", coins:100 },
  { id:"crown", name:"Crown", emoji:"👑", coins:200 },
  { id:"diamond", name:"Diamond", emoji:"💎", coins:500 },
  { id:"castle", name:"Castle", emoji:"🏰", coins:1000 },
  { id:"island", name:"Island", emoji:"🏝️", coins:5000 },
];

export async function GET() {
  return NextResponse.json({ gifts: GIFTS });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { giftId, receiverId, streamId } = await req.json();

  const gift = GIFTS.find(g => g.id === giftId);
  if (!gift) return NextResponse.json({ error: "Invalid gift" }, { status: 400 });
  if (!receiverId) return NextResponse.json({ error: "No receiver" }, { status: 400 });

  const sender = await prisma.user.findUnique({ where: { id }, select: { coins: true, name: true } });
  if (!sender || sender.coins < gift.coins) return NextResponse.json({ error: "Not enough coins" }, { status: 400 });

  const platformFee = Math.floor(gift.coins * 0.2);
  const receiverAmount = gift.coins - platformFee;

  // Deduct from sender, add to receiver
  await prisma.user.update({ where: { id }, data: { coins: { decrement: gift.coins } } });
  await prisma.user.update({ where: { id: receiverId }, data: { coins: { increment: receiverAmount } } });

  // Record transactions
  await prisma.coinTransaction.create({ data: { userId: id, amount: -gift.coins, type: "gift_sent", description: "Sent " + gift.emoji + " " + gift.name + " (" + gift.coins + " coins)" } });
  await prisma.coinTransaction.create({ data: { userId: receiverId, amount: receiverAmount, type: "gift_received", description: "Received " + gift.emoji + " " + gift.name + " from " + sender.name } });

  // Record gift
  await prisma.gift.create({ data: { senderId: id, receiverId, giftType: gift.id, coinValue: gift.coins } }).catch(() => {});

  // Send as chat message in live stream
  if (streamId) {
    await prisma.liveChat.create({ data: { streamId, userId: id, content: "🎁 sent " + gift.emoji + " " + gift.name + " (" + gift.coins + " coins)!" } }).catch(() => {});
  }

  createNotification(receiverId, "gift", gift.emoji + " Gift Received!", sender.name + " sent you a " + gift.emoji + " " + gift.name, id);

  return NextResponse.json({ success: true, coins: sender.coins - gift.coins, giftEmoji: gift.emoji, giftName: gift.name });
}
