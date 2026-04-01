import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { receiverId, giftType, amount } = await req.json();
  if (!receiverId || !amount) return NextResponse.json({ error: "Invalid gift" }, { status: 400 });

  const sender = await prisma.user.findUnique({ where: { id }, select: { coins: true, name: true } });
  if (!sender || (sender.coins || 0) < amount) return NextResponse.json({ error: "Not enough coins" }, { status: 400 });

  const hostShare = Math.floor(amount * 0.8);
  await prisma.user.update({ where: { id }, data: { coins: { decrement: amount } } });
  await prisma.user.update({ where: { id: receiverId }, data: { coins: { increment: hostShare } } });

  await prisma.coinTransaction.create({ data: { userId: id, amount: -amount, type: "gift_sent", description: "Sent " + giftType + " gift" } }).catch(() => {});
  await prisma.coinTransaction.create({ data: { userId: receiverId, amount: hostShare, type: "gift_received", description: "Received " + giftType + " gift (80%)" } }).catch(() => {});

  try { await prisma.gift.create({ data: { senderId: id, receiverId, type: giftType, coins: amount } }); } catch {}

  createNotification(receiverId, "gift", "Gift Received!", (sender.name || "Someone") + " sent you a " + giftType + "!", id);

  return NextResponse.json({ success: true, spent: amount, hostReceived: hostShare });
}
