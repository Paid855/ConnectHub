import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://connecthub.love";

async function createStripeSession(email: string, amount: number, currency: string, metadata: any, successUrl: string, cancelUrl: string) {
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + STRIPE_SECRET, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      "mode": "payment",
      "customer_email": email,
      "line_items[0][price_data][currency]": currency,
      "line_items[0][price_data][product_data][name]": metadata.name || "ConnectHub",
      "line_items[0][price_data][unit_amount]": String(amount),
      "line_items[0][quantity]": "1",
      "success_url": successUrl,
      "cancel_url": cancelUrl,
      "metadata[userId]": metadata.userId || "",
      "metadata[type]": metadata.type || "",
      "metadata[tier]": metadata.tier || "",
      "metadata[coins]": metadata.coins || "",
    }).toString()
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { type, tier, packageId } = body;

  if (type === "subscription" || tier) {
    const planTier = tier || body.plan;
    const plans: Record<string, { amount: number; name: string }> = {
      plus: { amount: 1200, name: "ConnectHub Plus - $12/month" },
      premium: { amount: 2500, name: "ConnectHub Premium - $25/month" },
    };
    const plan = plans[planTier];
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const session = await createStripeSession(
      user.email, plan.amount, "usd",
      { userId: id, type: "subscription", tier: planTier, name: plan.name },
      SITE_URL + "/dashboard/coins?success=true&tier=" + planTier,
      SITE_URL + "/dashboard/coins?cancelled=true"
    );

    if (session.url) return NextResponse.json({ paymentUrl: session.url });
    return NextResponse.json({ error: "Payment failed", details: session }, { status: 500 });
  }

  if (type === "coins" || packageId) {
    const packages: Record<string, { coins: number; amount: number; name: string }> = {
      "100": { coins: 100, amount: 199, name: "100 ConnectHub Coins" },
      "500": { coins: 500, amount: 799, name: "500 ConnectHub Coins" },
      "1000": { coins: 1000, amount: 1299, name: "1000 ConnectHub Coins" },
      "5000": { coins: 5000, amount: 4999, name: "5000 ConnectHub Coins" },
    };
    const pkg = packages[packageId];
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 });

    const session = await createStripeSession(
      user.email, pkg.amount, "usd",
      { userId: id, type: "coins", coins: String(pkg.coins), name: pkg.name },
      SITE_URL + "/dashboard/coins?success=true&coins=" + pkg.coins,
      SITE_URL + "/dashboard/coins?cancelled=true"
    );

    if (session.url) return NextResponse.json({ paymentUrl: session.url });
    return NextResponse.json({ error: "Payment failed", details: session }, { status: 500 });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
