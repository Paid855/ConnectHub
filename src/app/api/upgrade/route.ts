import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://connecthub.love";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { tier } = await req.json();
  if (tier !== "plus" && tier !== "premium") return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true, tier: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (tier === "plus" && (user.tier === "plus" || user.tier === "premium" || user.tier === "gold")) {
    return NextResponse.json({ error: "You already have this plan or higher" }, { status: 400 });
  }
  if ((tier === "premium") && (user.tier === "premium" || user.tier === "gold")) {
    return NextResponse.json({ error: "You already have Premium" }, { status: 400 });
  }

  const amount = tier === "plus" ? 1200 : 2500;
  const name = tier === "plus" ? "ConnectHub Plus — $12/month" : "ConnectHub Premium — $25/month";

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + STRIPE_SECRET, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "mode": "payment",
        "customer_email": user.email,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": name,
        "line_items[0][price_data][unit_amount]": String(amount),
        "line_items[0][quantity]": "1",
        "success_url": SITE_URL + "/dashboard/coins?success=true&tier=" + tier,
        "cancel_url": SITE_URL + "/dashboard/coins?cancelled=true",
        "metadata[userId]": id,
        "metadata[type]": "subscription",
        "metadata[tier]": tier,
      }).toString()
    });
    const session = await res.json();
    if (session.url) return NextResponse.json({ paymentUrl: session.url });
    console.error("Stripe error:", session);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  } catch (e) {
    console.error("Payment error:", e);
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 500 });
  }
}
