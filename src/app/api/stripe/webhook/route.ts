import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-12-18.acacia" as any });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (e: any) {
    console.error("Webhook signature error:", e.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 1. CHECKOUT COMPLETED — deliver coins
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const coins = parseInt(session.metadata?.coins || "0");
    if (userId && coins > 0) {
      const existing = await prisma.coinTransaction.findFirst({ where: { userId, description: { contains: session.id } } });
      if (!existing) {
        await prisma.user.update({ where: { id: userId }, data: { coins: { increment: coins } } });
        await prisma.coinTransaction.create({ data: { userId, amount: coins, type: "purchase", description: "Purchased " + coins + " coins (session: " + session.id + ")" } });
        createNotification(userId, "purchase", "Coins Added!", "+" + coins + " coins added to your account", null);
        console.log("[Stripe] SUCCESS: " + coins + " coins → " + userId);
      }
    }
  }

  // 2. ASYNC PAYMENT SUCCEEDED (delayed payment methods like bank transfers)
  if (event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const coins = parseInt(session.metadata?.coins || "0");
    if (userId && coins > 0) {
      const existing = await prisma.coinTransaction.findFirst({ where: { userId, description: { contains: session.id } } });
      if (!existing) {
        await prisma.user.update({ where: { id: userId }, data: { coins: { increment: coins } } });
        await prisma.coinTransaction.create({ data: { userId, amount: coins, type: "purchase", description: "Delayed payment completed: " + coins + " coins (session: " + session.id + ")" } });
        createNotification(userId, "purchase", "Payment Confirmed!", "Your payment was confirmed. +" + coins + " coins added!", null);
        console.log("[Stripe] ASYNC SUCCESS: " + coins + " coins → " + userId);
      }
    }
  }

  // 3. ASYNC PAYMENT FAILED (delayed payment failed)
  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const coins = session.metadata?.coins || "0";
    if (userId) {
      await prisma.coinTransaction.create({ data: { userId, amount: 0, type: "purchase_failed", description: "Payment failed for " + coins + " coins (session: " + session.id + ")" } });
      createNotification(userId, "purchase_failed", "Payment Failed", "Your payment for " + coins + " coins was declined. Please try again with a different payment method.", null);
      console.log("[Stripe] ASYNC FAILED for " + userId);
    }
  }

  // 4. CHECKOUT EXPIRED (user didn't complete)
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (userId) {
      createNotification(userId, "purchase_failed", "Checkout Expired", "Your coin purchase session expired. You can try again anytime!", null);
      console.log("[Stripe] EXPIRED for " + userId);
    }
  }

  return NextResponse.json({ received: true });
}
