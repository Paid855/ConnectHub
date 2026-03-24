import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  try {
    // Run all queries in parallel for speed
    const [purchases, gifts, upgrades, boosts] = await Promise.all([
      prisma.coinTransaction.aggregate({ where: { type: "purchase" }, _sum: { amount: true }, _count: true }),
      prisma.gift.aggregate({ _sum: { coinValue: true }, _count: true }),
      prisma.coinTransaction.aggregate({ where: { type: "upgrade" }, _sum: { amount: true }, _count: true }),
      prisma.coinTransaction.aggregate({ where: { type: "boost" }, _sum: { amount: true }, _count: true }),
    ]);

    const totalCoinsSold = purchases._sum.amount || 0;
    const totalGiftValue = gifts._sum.coinValue || 0;
    const platformFee = Math.floor(totalGiftValue * 0.2);
    const upgradeRevenue = Math.abs(upgrades._sum.amount || 0);
    const boostRevenue = Math.abs(boosts._sum.amount || 0);
    const coinToUSD = (coins: number) => (coins / 1000 * 6.99).toFixed(2);

    return NextResponse.json({
      totalCoinsSold,
      platformFee,
      upgradeRevenue,
      boostRevenue,
      totalRevenueUSD: coinToUSD(totalCoinsSold),
      giftFeeUSD: coinToUSD(platformFee),
      totalGifts: gifts._count || 0,
      totalUpgrades: upgrades._count || 0,
      totalBoosts: boosts._count || 0,
      topSpenders: [], // Skip heavy query for speed
    });
  } catch (e) {
    console.error("Revenue error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
