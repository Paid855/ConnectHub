import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

const GIFTS: Record<string, { name: string; coins: number; emoji: string }> = {
  rose: { name: "Rose", coins: 10, emoji: "🌹" },
  heart: { name: "Heart", coins: 25, emoji: "❤️" },
  kiss: { name: "Kiss", coins: 50, emoji: "💋" },
  crown: { name: "Crown", coins: 100, emoji: "👑" },
  diamond: { name: "Diamond", coins: 250, emoji: "💎" },
  rocket: { name: "Rocket", coins: 500, emoji: "🚀" },
  castle: { name: "Castle", coins: 1000, emoji: "🏰" },
  island: { name: "Private Island", coins: 5000, emoji: "🏝️" },
};

export async function GET() {
  return NextResponse.json({ gifts: Object.entries(GIFTS).map(([k, v]) => ({ id: k, ...v })) });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { giftId, receiverId, streamId } = await req.json();

  const gift = GIFTS[giftId];
  if (!gift) return NextResponse.json({ error: "Invalid gift" }, { status: 400 });
  if (!receiverId) return NextResponse.json({ error: "No receiver" }, { status: 400 });
  if (receiverId === id) return NextResponse.json({ error: "Cannot gift yourself" }, { status: 400 });

  const sender = await prisma.user.findUnique({ where: { id }, select: { coins: true, name: true } });
  if (!sender || sender.coins < gift.coins) return NextResponse.json({ error: "Not enough coins. You need " + gift.coins + " coins." }, { status: 400 });

  // Deduct from sender
  await prisma.user.update({ where: { id }, data: { coins: { decrement: gift.coins } } });
  await prisma.coinTransaction.create({ data: { userId: id, amount: -gift.coins, type: "gift_sent", description: "Sent " + gift.emoji + " " + gift.name } });

  // Add 80% to receiver (20% platform fee)
  const receiverCoins = Math.floor(gift.coins * 0.8);
  await prisma.user.update({ where: { id: receiverId }, data: { coins: { increment: receiverCoins } } });
  await prisma.coinTransaction.create({ data: { userId: receiverId, amount: receiverCoins, type: "gift_received", description: "Received " + gift.emoji + " " + gift.name } });

  // Save gift record
  await prisma.gift.create({ data: { senderId: id, receiverId, streamId: streamId || null, giftType: giftId, giftName: gift.name, coinValue: gift.coins } });

  // Send notification
  createNotification(receiverId, "gift", "New Gift!", "sent you a " + gift.emoji + " " + gift.name, id);

  // If in a live stream, send a chat message about the gift
  if (streamId) {
    await prisma.liveChat.create({ data: { streamId, userId: id, content: "sent " + gift.emoji + " " + gift.name + " (" + gift.coins + " coins)" } }).catch(() => {});
  }

  const updatedSender = await prisma.user.findUnique({ where: { id }, select: { coins: true } });
  return NextResponse.json({ success: true, coins: updatedSender?.coins || 0, gift: { ...gift, emoji: gift.emoji } });
}
