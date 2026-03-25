import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import crypto from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("x-paystack-signature");

  // Verify webhook signature
  if (PAYSTACK_SECRET && sig) {
    const hash = crypto.createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
    if (hash !== sig) {
      console.error("Invalid Paystack webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  const event = JSON.parse(body);

  // CHARGE SUCCESS
  if (event.event === "charge.success") {
    const data = event.data;
    const reference = data.reference;
    const meta = data.metadata;
    const userId = meta?.userId;
    const coins = meta?.coins || 0;

    if (userId && coins > 0) {
      const existing = await prisma.coinTransaction.findFirst({ where: { userId, description: { contains: reference } } });
      if (!existing) {
        await prisma.user.update({ where: { id: userId }, data: { coins: { increment: coins } } });
        await prisma.coinTransaction.create({ data: { userId, amount: coins, type: "purchase", description: "Purchased " + coins + " coins via Paystack (ref: " + reference + ")" } });
        createNotification(userId, "purchase", "Coins Added!", "+" + coins + " coins added to your account", null);
        console.log("[Paystack] Delivered " + coins + " coins to " + userId);
      }
    }
  }

  // CHARGE FAILED
  if (event.event === "charge.failed") {
    const meta = event.data?.metadata;
    const userId = meta?.userId;
    if (userId) {
      createNotification(userId, "purchase_failed", "Payment Failed", "Your payment was declined. Please try again with a different method.", null);
      console.log("[Paystack] Payment failed for " + userId);
    }
  }

  return NextResponse.json({ received: true });
}
