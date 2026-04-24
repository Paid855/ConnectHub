import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const FLW_SECRET = process.env.FLW_SECRET_KEY || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://connecthub.love";

function getUserId(req: NextRequest) {
  try {
    const cookie = req.cookies.get("session")?.value;
    if (!cookie) return null;
    return JSON.parse(cookie).id || JSON.parse(cookie).userId || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { type, tier, coinPackage } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, tier: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let amount = 0;
  let description = "";
  let coins = 0;

  if (type === "subscription") {
    if (tier === "plus") {
      if (user.tier === "plus" || user.tier === "premium" || user.tier === "gold") {
        return NextResponse.json({ error: "You already have this plan or higher" }, { status: 400 });
      }
      amount = 12;
      description = "ConnectHub Plus — $12/month";
    } else if (tier === "premium") {
      if (user.tier === "premium" || user.tier === "gold") {
        return NextResponse.json({ error: "You already have Premium or higher" }, { status: 400 });
      }
      amount = 25;
      description = "ConnectHub Premium — $25/month";
    } else {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
  } else if (type === "coins") {
    const packages: Record<string, { amount: number; coins: number }> = {
      "50": { amount: 2, coins: 50 },
      "150": { amount: 5, coins: 150 },
      "500": { amount: 15, coins: 500 },
      "1200": { amount: 30, coins: 1200 },
      "3000": { amount: 60, coins: 3000 },
    };
    const pkg = packages[coinPackage];
    if (!pkg) return NextResponse.json({ error: "Invalid coin package" }, { status: 400 });
    amount = pkg.amount;
    coins = pkg.coins;
    description = `${coins} ConnectHub Coins`;
  } else {
    return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
  }

  const txRef = `CH_${type}_${userId}_${Date.now()}`;

  try {
    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + FLW_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: "USD",
        redirect_url: `${SITE_URL}/api/flutterwave/verify?tx_ref=${txRef}`,
        customer: {
          email: user.email,
          name: user.name || "ConnectHub User",
        },
        customizations: {
          title: "ConnectHub",
          description,
          logo: `${SITE_URL}/icon-512.png`,
        },
        meta: {
          userId,
          type,
          tier: tier || "",
          coins: String(coins),
          txRef,
        },
      }),
    });

    const data = await res.json();

    if (data.status === "success" && data.data?.link) {
      return NextResponse.json({ url: data.data.link });
    }

    return NextResponse.json({ error: data.message || "Payment failed to initialize" }, { status: 500 });
  } catch (e: any) {
    console.error("Flutterwave error:", e?.message);
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 500 });
  }
}
