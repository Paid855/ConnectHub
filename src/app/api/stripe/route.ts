import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-12-18.acacia" as any });

const COIN_PACKAGES = [
  { id: "coins_100", coins: 100, price: 99, label: "100 Coins" },
  { id: "coins_500", coins: 500, price: 399, label: "500 Coins" },
  { id: "coins_1000", coins: 1000, price: 699, label: "1,000 Coins" },
  { id: "coins_5000", coins: 5000, price: 2999, label: "5,000 Coins" },
];

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { packageId } = await req.json();

  const pkg = COIN_PACKAGES.find(p => p.id === packageId);
  if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true, name: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user.email,
      metadata: { userId: id, packageId: pkg.id, coins: pkg.coins.toString() },
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: pkg.label + " — ConnectHub", description: "Add " + pkg.coins + " coins to your ConnectHub account", images: ["https://connecthub.com/logo.png"] },
          unit_amount: pkg.price,
        },
        quantity: 1,
      }],
      success_url: (req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173") + "/dashboard/coins?success=true&coins=" + pkg.coins,
      cancel_url: (req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173") + "/dashboard/coins?canceled=true",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e: any) {
    console.error("Stripe error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
