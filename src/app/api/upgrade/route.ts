import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PLANS = {
  plus: { price: 1200, coins: 0, label: "Plus" },
  premium: { price: 2500, coins: 0, label: "Premium/Gold" },
};

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true, coins: true } });
  return NextResponse.json({
    currentTier: user?.tier || "free",
    coins: user?.coins || 0,
    plans: [
      { id: "plus", name: "Plus", price: "$12/month", features: ["No ads", "16 photo uploads", "Extended profile views", "Unlimited likes", "Rewind last swipe", "Live streaming access", "Priority matching"] },
      { id: "premium", name: "Premium", price: "$25/month", features: ["All Plus features", "See who likes you", "5 Super Likes per week", "Top Picks daily", "Read receipts in messages", "Higher profile visibility", "Profile boost monthly", "Priority support"] },
    ]
  });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { tier } = await req.json();

  if (tier !== "plus" && tier !== "premium") return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true, coins: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check if already on this or higher tier
  if (tier === "plus" && (user.tier === "plus" || user.tier === "premium" || user.tier === "gold")) {
    return NextResponse.json({ error: "You already have this or a higher plan" }, { status: 400 });
  }
  if (tier === "premium" && (user.tier === "premium" || user.tier === "gold")) {
    return NextResponse.json({ error: "You already have Premium" }, { status: 400 });
  }

  // Use Paystack for payment
  const amount = tier === "plus" ? 1200 : 2500; // in cents ($12 or $25)
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: "Bearer " + paystackSecret, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: (await prisma.user.findUnique({ where: { id }, select: { email: true } }))?.email,
        amount: amount * 100, // Paystack uses kobo/cents
        currency: "USD",
        callback_url: (process.env.NEXT_PUBLIC_SITE_URL || "https://connecthub.love") + "/dashboard/coins?upgrade=" + tier,
        metadata: { userId: id, tier, type: "subscription" }
      })
    });
    const data = await res.json();
    if (data.status && data.data?.authorization_url) {
      return NextResponse.json({ paymentUrl: data.data.authorization_url, reference: data.data.reference });
    }
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  } catch (e) {
    console.error("Payment error:", e);
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 500 });
  }
}
