import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const now = new Date();
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    // Signups per day (last 7 days)
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: weekAgo }, email: { not: "admin@connecthub.com" } },
      select: { createdAt: true }
    });

    const signupsByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      signupsByDay[key] = 0;
    }
    recentUsers.forEach(u => {
      const key = u.createdAt.toLocaleDateString("en-US", { weekday: "short" });
      if (signupsByDay[key] !== undefined) signupsByDay[key]++;
    });

    // Total coin transactions
    const coinStats = await prisma.coinTransaction.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { amount: { gt: 0 } }
    }).catch(() => ({ _sum: { amount: 0 }, _count: 0 }));

    // Today revenue
    const todayRevenue = await prisma.coinTransaction.aggregate({
      _sum: { amount: true },
      where: { amount: { gt: 0 }, createdAt: { gte: today } }
    }).catch(() => ({ _sum: { amount: 0 } }));

    // Week revenue
    const weekRevenue = await prisma.coinTransaction.aggregate({
      _sum: { amount: true },
      where: { amount: { gt: 0 }, createdAt: { gte: weekAgo } }
    }).catch(() => ({ _sum: { amount: 0 } }));

    // Active users (last 5 min)
    const fiveMinAgo = new Date(now.getTime() - 300000);
    const onlineCount = await prisma.user.count({
      where: { lastSeen: { gte: fiveMinAgo }, tier: { not: "banned" } }
    });

    // Total messages today
    const todayMessages = await prisma.message.count({
      where: { createdAt: { gte: today } }
    }).catch(() => 0);

    // Total likes today
    const todayLikes = await prisma.like.count({
      where: { createdAt: { gte: today } }
    }).catch(() => 0);

    // Total matches today
    const todayMatches = await prisma.friend.count({
      where: { createdAt: { gte: today }, status: "accepted" }
    }).catch(() => 0);

    // Tier distribution
    const allUsers = await prisma.user.findMany({
      where: { email: { not: "admin@connecthub.com" }, tier: { not: "banned" } },
      select: { tier: true }
    });
    const tiers = { free: 0, plus: 0, premium: 0, gold: 0 };
    allUsers.forEach(u => { const t = u.tier as keyof typeof tiers; if (tiers[t] !== undefined) tiers[t]++; });

    // Recent activity
    const recentSignups = await prisma.user.findMany({
      where: { email: { not: "admin@connecthub.com" } },
      select: { id: true, name: true, profilePhoto: true, createdAt: true, tier: true },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    return NextResponse.json({
      signupsByDay,
      coinStats: { totalCoinsGiven: coinStats._sum.amount || 0, totalTransactions: coinStats._count || 0 },
      revenue: { today: todayRevenue._sum.amount || 0, week: weekRevenue._sum.amount || 0 },
      realtime: { online: onlineCount, messagesToday: todayMessages, likesToday: todayLikes, matchesToday: todayMatches },
      tiers,
      recentSignups
    });
  } catch (e: any) {
    console.error("Analytics error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
