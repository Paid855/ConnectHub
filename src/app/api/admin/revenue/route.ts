import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  try {
    // Total coins purchased (revenue from coin sales)
    const coinPurchases = await prisma.coinTransaction.findMany({ where: { type: "purchase" } });
    const totalCoinsSold = coinPurchases.reduce((s, t) => s + t.amount, 0);

    // Platform fee from gifts (20% of every gift)
    const allGifts = await prisma.gift.findMany();
    const totalGiftValue = allGifts.reduce((s, g) => s + g.coinValue, 0);
    const platformFee = Math.floor(totalGiftValue * 0.2);

    // Upgrade purchases
    const upgrades = await prisma.coinTransaction.findMany({ where: { type: "upgrade" } });
    const upgradeRevenue = upgrades.reduce((s, t) => s + Math.abs(t.amount), 0);

    // Boost purchases
    const boosts = await prisma.coinTransaction.findMany({ where: { type: "boost" } });
    const boostRevenue = boosts.reduce((s, t) => s + Math.abs(t.amount), 0);

    // Coin to real money conversion (1000 coins = ~$6.99 average)
    const coinToUSD = (coins: number) => (coins / 1000 * 6.99).toFixed(2);

    // Daily revenue (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
    const recentTransactions = await prisma.coinTransaction.findMany({
      where: { type: { in: ["purchase","upgrade","boost","gift_sent"] }, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" }
    });

    // Group by day
    const dailyRevenue: Record<string, number> = {};
    recentTransactions.forEach(t => {
      const day = new Date(t.createdAt).toISOString().split("T")[0];
      dailyRevenue[day] = (dailyRevenue[day] || 0) + Math.abs(t.amount);
    });

    // Top spenders
    const userSpending: Record<string, number> = {};
    coinPurchases.forEach(t => { userSpending[t.userId] = (userSpending[t.userId] || 0) + t.amount; });
    const topSpenderIds = Object.entries(userSpending).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);
    const topSpenders = topSpenderIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: topSpenderIds } },
      select: { id:true, name:true, profilePhoto:true, tier:true, coins:true }
    }) : [];

    return NextResponse.json({
      totalCoinsSold,
      platformFee,
      upgradeRevenue,
      boostRevenue,
      totalRevenueCoins: totalCoinsSold + platformFee + upgradeRevenue + boostRevenue,
      totalRevenueUSD: coinToUSD(totalCoinsSold),
      giftFeeUSD: coinToUSD(platformFee),
      dailyRevenue,
      topSpenders: topSpenderIds.map(id => ({ user: topSpenders.find(u => u.id === id), spent: userSpending[id] })),
      totalGifts: allGifts.length,
      totalUpgrades: upgrades.length,
      totalBoosts: boosts.length,
    });
  } catch (e) {
    console.error("Revenue error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
