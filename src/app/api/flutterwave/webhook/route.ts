import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const FLW_SECRET = process.env.FLW_SECRET_KEY || "";
const FLW_HASH = process.env.FLW_ENCRYPTION_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const hash = req.headers.get("verif-hash");
    if (FLW_HASH && hash && hash !== FLW_HASH) {
      console.error("[FLW Webhook] Invalid hash");
      return NextResponse.json({ status: "ok" }, { status: 401 });
    }

    const body = await req.json();
    const event = body.event || body?.data?.event || "";
    const data = body.data || body;

    console.log("[FLW Webhook] Event:", event);

    if (event === "charge.completed" && data.status === "successful") {
      const transactionId = data.id;
      if (!transactionId) return NextResponse.json({ status: "ok" });

      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        { headers: { Authorization: "Bearer " + FLW_SECRET } }
      );
      const verified = await verifyRes.json();

      if (verified.status === "success" && verified.data?.status === "successful") {
        const meta = verified.data.meta || {};
        const userId = meta.userId;
        const type = meta.type;

        if (userId && type === "subscription") {
          const tier = meta.tier;
          if (tier === "plus" || tier === "premium") {
            await prisma.user.update({ where: { id: userId }, data: { tier } });
            try { await prisma.notification.create({ data: { userId, type: "upgrade", title: "Plan Upgraded!", message: `You are now a ${tier === "plus" ? "Plus" : "Premium"} member!`, fromUserId: null } }); } catch {}
            console.log("[FLW Webhook] Upgraded", userId, "to", tier);
          }
        }

        if (userId && type === "coins") {
          const coins = parseInt(meta.coins || "0");
          if (coins > 0) {
            await prisma.user.update({ where: { id: userId }, data: { coins: { increment: coins } } });
            try { await prisma.notification.create({ data: { userId, type: "coins", title: "Coins Added!", message: `${coins} coins added to your account.`, fromUserId: null } }); } catch {}
            console.log("[FLW Webhook] Added", coins, "coins to", userId);
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (e: any) {
    console.error("[FLW Webhook] Error:", e?.message);
    return NextResponse.json({ status: "ok" });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "ConnectHub Webhook" });
}
