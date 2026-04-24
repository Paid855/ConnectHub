import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const FLW_SECRET = process.env.FLW_SECRET_KEY || "";
const FLW_HASH = process.env.FLW_ENCRYPTION_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const hash = req.headers.get("verif-hash");
    if (FLW_HASH && hash !== FLW_HASH) {
      return NextResponse.json({ error: "Invalid hash" }, { status: 401 });
    }

    const body = await req.json();
    const event = body.event || body.data?.event;
    const data = body.data || body;

    if (event === "charge.completed" && data.status === "successful") {
      const txRef = data.tx_ref || "";
      const transactionId = data.id;

      const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
        headers: { "Authorization": "Bearer " + FLW_SECRET },
      });
      const verified = await verifyRes.json();

      if (verified.status === "success" && verified.data?.status === "successful") {
        const meta = verified.data.meta || {};
        const userId = meta.userId;
        const type = meta.type;

        if (userId && type === "subscription") {
          const tier = meta.tier;
          if (tier === "plus" || tier === "premium") {
            await prisma.user.update({ where: { id: userId }, data: { tier } });
          }
        }

        if (userId && type === "coins") {
          const coins = parseInt(meta.coins || "0");
          if (coins > 0) {
            await prisma.user.update({ where: { id: userId }, data: { coins: { increment: coins } } });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error("Webhook error:", e?.message);
    return NextResponse.json({ received: true });
  }
}
