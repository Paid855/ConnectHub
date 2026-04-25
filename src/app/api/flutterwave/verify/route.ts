import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendCoinsPurchasedEmail, sendUpgradeEmail } from "@/lib/email";

const FLW_SECRET = process.env.FLW_SECRET_KEY || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://connecthub.love";

export async function GET(req: NextRequest) {
  const txRef = req.nextUrl.searchParams.get("tx_ref");
  const transactionId = req.nextUrl.searchParams.get("transaction_id");
  const status = req.nextUrl.searchParams.get("status");

  if (status !== "successful" || !transactionId) {
    return NextResponse.redirect(`${SITE_URL}/dashboard?payment=failed`);
  }

  try {
    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: { "Authorization": "Bearer " + FLW_SECRET },
    });
    const data = await verifyRes.json();

    if (data.status !== "success" || data.data?.status !== "successful") {
      return NextResponse.redirect(`${SITE_URL}/dashboard?payment=failed`);
    }

    const meta = data.data.meta || {};
    const userId = meta.userId;
    const type = meta.type;

    if (!userId) {
      return NextResponse.redirect(`${SITE_URL}/dashboard?payment=failed`);
    }

    if (type === "subscription") {
      const tier = meta.tier;
      if (tier === "plus" || tier === "premium") {
        await prisma.user.update({ where: { id: userId }, data: { tier } });
        const subUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
        if (subUser?.email) sendUpgradeEmail(subUser.email, subUser.name || "there", tier);
        try {
          await prisma.notification.create({
            data: { userId, type: "upgrade", title: "Plan Upgraded!", message: `You are now a ${tier === "plus" ? "Plus" : "Premium"} member!`, fromUserId: null }
          });
        } catch {}
      }
    }

    if (type === "coins") {
      const coins = parseInt(meta.coins || "0");
      if (coins > 0) {
        await prisma.user.update({ where: { id: userId }, data: { coins: { increment: coins } } });
        const cUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
        if (cUser?.email) sendCoinsPurchasedEmail(cUser.email, cUser.name || "there", coins, "$" + (coins <= 100 ? "1.99" : coins <= 500 ? "7.99" : coins <= 1000 ? "12.99" : "49.99"));
        try {
          await prisma.notification.create({
            data: { userId, type: "coins", title: "Coins Added!", message: `${coins} coins have been added to your account.`, fromUserId: null }
          });
        } catch {}
      }
    }

    return NextResponse.redirect(`${SITE_URL}/dashboard?payment=success`);
  } catch (e: any) {
    console.error("Verify error:", e?.message);
    return NextResponse.redirect(`${SITE_URL}/dashboard?payment=error`);
  }
}
