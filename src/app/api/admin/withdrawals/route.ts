import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { sendPushToUser } from "@/lib/push";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "ConnectHub_Admin_2026_Secret";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: { createdAt: "desc" },
    take: 50
  });

  const userIds = [...new Set(withdrawals.map(w => w.userId))];
  const users = userIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, profilePhoto: true }
  }) : [];

  const enriched = withdrawals.map(w => ({
    ...w,
    user: users.find(u => u.id === w.userId),
    usdAmount: (w.amount * 0.01).toFixed(2)
  }));

  const stats = {
    pending: withdrawals.filter(w => w.status === "pending").length,
    totalPendingCoins: withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0),
    approved: withdrawals.filter(w => w.status === "approved" || w.status === "completed").length,
    rejected: withdrawals.filter(w => w.status === "rejected").length
  };

  return NextResponse.json({ withdrawals: enriched, stats });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { withdrawalId, action, adminNote } = await req.json();
  if (!withdrawalId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (withdrawal.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 400 });

  if (action === "approve") {
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "approved", adminNote: adminNote || "Approved", processedAt: new Date() }
    });
    createNotification(withdrawal.userId, "purchase", "Withdrawal Approved! 💰", `Your withdrawal of ${withdrawal.amount} coins ($${(withdrawal.amount * 0.01).toFixed(2)}) has been approved.`);
    sendPushToUser(withdrawal.userId, { title: "Withdrawal Approved! 💰", body: `$${(withdrawal.amount * 0.01).toFixed(2)} is on its way`, url: "/dashboard/wallet", tag: "withdrawal" });
    return NextResponse.json({ success: true, status: "approved" });
  }

  if (action === "reject") {
    // Refund coins
    await prisma.user.update({ where: { id: withdrawal.userId }, data: { coins: { increment: withdrawal.amount } } });
    await prisma.coinTransaction.create({
      data: { userId: withdrawal.userId, amount: withdrawal.amount, type: "refund", description: "Withdrawal rejected — coins refunded" }
    });
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "rejected", adminNote: adminNote || "Rejected", processedAt: new Date() }
    });
    createNotification(withdrawal.userId, "purchase", "Withdrawal Update", `Your withdrawal was not approved. ${withdrawal.amount} coins have been refunded. ${adminNote ? "Note: " + adminNote : ""}`);
    return NextResponse.json({ success: true, status: "rejected" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
