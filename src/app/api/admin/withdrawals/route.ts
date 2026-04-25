import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest) {
  try { return JSON.parse(req.cookies.get("admin_session")?.value || "{}").isAdmin === true; }
  catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

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
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

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
    // Notify user
    await prisma.notification.create({
      data: { userId: withdrawal.userId, type: "purchase", title: "Withdrawal Approved!", message: `Your withdrawal of ${withdrawal.amount} coins ($${(withdrawal.amount * 0.01).toFixed(2)}) has been approved and sent.`, read: false }
    }).catch(() => {});
    return NextResponse.json({ success: true, status: "approved" });
  }

  if (action === "reject") {
    if (!adminNote || !adminNote.trim()) {
      return NextResponse.json({ error: "Please provide a reason for rejection" }, { status: 400 });
    }
    // Refund coins
    await prisma.user.update({ where: { id: withdrawal.userId }, data: { coins: { increment: withdrawal.amount } } });
    await prisma.coinTransaction.create({
      data: { userId: withdrawal.userId, amount: withdrawal.amount, type: "refund", description: "Withdrawal rejected - coins refunded" }
    }).catch(() => {});
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "rejected", adminNote: adminNote || "Rejected", processedAt: new Date() }
    });
    // Notify user
    await prisma.notification.create({
      data: { userId: withdrawal.userId, type: "purchase", title: "Withdrawal Update", message: `Your withdrawal was not approved. ${withdrawal.amount} coins have been refunded. ${adminNote ? "Note: " + adminNote : ""}`, read: false }
    }).catch(() => {});
    return NextResponse.json({ success: true, status: "rejected" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
