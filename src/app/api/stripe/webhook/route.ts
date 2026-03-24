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

  // PAYMENT SUCCESS
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const coins = parseInt(session.metadata?.coins || "0");

    if (userId && coins > 0) {
      const existing = await prisma.coinTransaction.findFirst({
        where: { userId, description: { contains: session.id } }
      });
      if (!existing) {
        await prisma.user.update({ where: { id: userId }, data: { coins: { increment: coins } } });
        await prisma.coinTransaction.create({
          data: { userId, amount: coins, type: "purchase", description: "Purchased " + coins + " coins via Stripe (session: " + session.id + ")" }
        });
        createNotification(userId, "purchase", "Coins Added!", "+" + coins + " coins added to your account", null);
        console.log("[Stripe] Delivered " + coins + " coins to " + userId);
      }
    }
  }

  // PAYMENT EXPIRED (user didn't complete checkout)
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (userId) {
      createNotification(userId, "purchase_failed", "Payment Incomplete", "Your coin purchase wasn't completed. Try again anytime!", null);
      console.log("[Stripe] Checkout expired for " + userId);
    }
  }

  // PAYMENT FAILED
  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const userId = intent.metadata?.userId;
    const reason = intent.last_payment_error?.message || "Payment declined";
    if (userId) {
      createNotification(userId, "purchase_failed", "Payment Failed", reason + ". Please try a different card.", null);
      await prisma.coinTransaction.create({
        data: { userId, amount: 0, type: "purchase_failed", description: "Payment failed: " + reason }
      });
      console.log("[Stripe] Payment failed for " + userId + ": " + reason);
    }
  }

  return NextResponse.json({ received: true });
}
