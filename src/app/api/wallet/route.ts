import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PLATFORM_FEE = 0.20;
const COINS_TO_USD = 0.01; // 100 coins = $1
const MIN_WITHDRAWAL = 1000; // minimum 1000 coins ($10)

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  // Get user coins
  const user = await prisma.user.findUnique({ where: { id }, select: { coins: true, name: true } });

  // Get total gifts received (earnings)
  const giftsReceived = await prisma.coinTransaction.findMany({
    where: { userId: id, type: "gift_received" },
    select: { amount: true, createdAt: true, description: true }
  });

  const totalEarned = giftsReceived.reduce((sum, g) => sum + g.amount, 0);

  // Get withdrawal history
  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const totalWithdrawn = withdrawals
    .filter(w => w.status === "approved" || w.status === "completed")
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingWithdrawals = withdrawals
    .filter(w => w.status === "pending")
    .reduce((sum, w) => sum + w.amount, 0);

  // Recent transactions
  const recentTransactions = await prisma.coinTransaction.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, amount: true, type: true, description: true, createdAt: true }
  });

  return NextResponse.json({
    coins: user?.coins || 0,
    totalEarned,
    totalWithdrawn,
    pendingWithdrawals,
    availableForWithdrawal: Math.max(0, (user?.coins || 0) - pendingWithdrawals),
    withdrawals,
    recentTransactions,
    coinsToUsd: COINS_TO_USD,
    minWithdrawal: MIN_WITHDRAWAL,
    platformFee: PLATFORM_FEE
  });
}

// POST — request withdrawal
export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { amount, method, details } = await req.json();

  if (!amount || amount < MIN_WITHDRAWAL) {
    return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL} coins ($${(MIN_WITHDRAWAL * COINS_TO_USD).toFixed(2)})` }, { status: 400 });
  }

  if (!details?.trim()) {
    return NextResponse.json({ error: "Please provide payment details" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { coins: true } });
  if (!user || (user.coins || 0) < amount) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  // Check for pending withdrawals
  const pending = await prisma.withdrawal.findFirst({
    where: { userId: id, status: "pending" }
  });
  if (pending) {
    return NextResponse.json({ error: "You already have a pending withdrawal request" }, { status: 400 });
  }

  // Deduct coins and create withdrawal
  await prisma.user.update({ where: { id }, data: { coins: { decrement: amount } } });

  await prisma.coinTransaction.create({
    data: { userId: id, amount: -amount, type: "withdrawal", description: `Withdrawal request: ${amount} coins` }
  });

  const withdrawal = await prisma.withdrawal.create({
    data: { userId: id, amount, method: method || "bank", details: details.trim() }
  });

  return NextResponse.json({ success: true, withdrawal });
}
