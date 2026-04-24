import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const FLW_SECRET = process.env.FLW_SECRET_KEY || "";
const FLW_HASH = process.env.FLW_ENCRYPTION_KEY || "";

export async function POST(req: NextRequest) {
  try {
    // Verify Flutterwave hash
    const hash = req.headers.get("verif-hash");
    if (FLW_HASH && hash && hash !== FLW_HASH) {
      console.error("[FLW Webhook] Invalid hash:", hash);
      return NextResponse.json({ error: "Invalid hash" }, { status: 401 });
    }

    const body = await req.json();
    const event = body.event || body?.data?.event || "";
    const data = body.data || body;

    console.log("[FLW Webhook] Event received:", event, "Status:", data?.status);

    // Only process successful charges
    if (event === "charge.completed" && data.status === "successful") {
      const transactionId = data.id;
      if (!transactionId) {
        return NextResponse.json({ status: "ok", message: "No transaction ID" });
      }

      // Verify with Flutterwave API
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        { headers: { Authorization: "Bearer " + FLW_SECRET } }
      );
      const verified = await verifyRes.json();

      if (verified.status !== "success" || verified.data?.status !== "successful") {
        console.error("[FLW Webhook] Verification failed for tx:", transactionId);
        return NextResponse.json({ status: "ok", message: "Verification failed" });
      }

      const meta = verified.data.meta || {};
      const userId = meta.userId;
      const type = meta.type;

      if (!userId) {
        console.error("[FLW Webhook] No userId in meta");
        return NextResponse.json({ status: "ok", message: "No userId" });
      }

      // Handle subscription upgrade
      if (type === "subscription") {
        const tier = meta.tier;
        if (tier === "plus" || tier === "premium") {
          await prisma.user.update({ where: { id: userId }, data: { tier } });
          try {
            await prisma.notification.create({
              data: {
                userId,
                type: "upgrade",
                title: "Plan Upgraded!",
                message: `You are now a ${tier === "plus" ? "Plus" : "Premium"} member!`,
                fromUserId: null,
              },
            });
          } catch {}
          console.log("[FLW Webhook] Upgraded", userId, "to", tier);
        }
      }

      // Handle coin purchase
      if (type === "coins") {
        const coins = parseInt(meta.coins || "0");
        if (coins > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { coins: { increment: coins } },
          });
          try {
            await prisma.notification.create({
              data: {
                userId,
                type: "coins",
                title: "Coins Added!",
                message: `${coins} coins have been added to your account.`,
                fromUserId: null,
              },
            });
          } catch {}
          console.log("[FLW Webhook] Added", coins, "coins to", userId);
        }
      }

      return NextResponse.json({ status: "ok", message: "Processed" });
    }

    // For ALL other events (pings, failed charges, refunds, etc.) — always return 200
    return NextResponse.json({ status: "ok", message: "Event received: " + event });
  } catch (e: any) {
    console.error("[FLW Webhook] Error:", e?.message);
    // Still return 200 so Flutterwave doesn't keep retrying
    return NextResponse.json({ status: "ok", error: e?.message });
  }
}

// Also handle GET requests (Flutterwave sometimes pings with GET)
export async function GET() {
  return NextResponse.json({ status: "ok", service: "ConnectHub Flutterwave Webhook" });
}
