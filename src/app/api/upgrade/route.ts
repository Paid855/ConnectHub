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

  const { tier } = await req.json();
  if (tier !== "plus" && tier !== "premium") return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, tier: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (tier === "plus" && ["plus", "premium", "gold"].includes(user.tier)) {
    return NextResponse.json({ error: "You already have this plan or higher" }, { status: 400 });
  }
  if (tier === "premium" && ["premium", "gold"].includes(user.tier)) {
    return NextResponse.json({ error: "You already have Premium" }, { status: 400 });
  }

  const amount = tier === "plus" ? 12 : 25;
  const description = tier === "plus" ? "ConnectHub Plus — $12/month" : "ConnectHub Premium — $25/month";
  const txRef = `CH_sub_${userId}_${Date.now()}`;

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
        customer: { email: user.email, name: user.name || "User" },
        customizations: { title: "ConnectHub", description, logo: `${SITE_URL}/icon-512.png` },
        meta: { userId, type: "subscription", tier, coins: "0", txRef },
      }),
    });

    const data = await res.json();
    if (data.status === "success" && data.data?.link) {
      return NextResponse.json({ url: data.data.link });
    }
    return NextResponse.json({ error: data.message || "Payment failed" }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 500 });
  }
}
