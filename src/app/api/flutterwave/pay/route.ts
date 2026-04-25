import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const { type, plan, amount, coinPackage, period } = body;

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true, name: true, phone: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const txRef = "CH_" + type + "_" + id + "_" + Date.now();

  const payload: any = {
    tx_ref: txRef,
    amount: amount,
    currency: "USD",
    redirect_url: process.env.NEXT_PUBLIC_SITE_URL + "/dashboard/coins?verify=" + txRef,
    customer: {
      email: user.email,
      name: user.name || "ConnectHub User",
      phonenumber: user.phone || ""
    },
    customizations: {
      title: "ConnectHub",
      logo: process.env.NEXT_PUBLIC_SITE_URL + "/logo.png"
    },
    meta: {
      userId: id,
      type,
      plan: plan || null,
      coinPackage: coinPackage || null,
      period: period || null
    }
  };

  if (type === "upgrade") {
    payload.customizations.description = "Upgrade to " + (plan || "Premium") + " Plan";
    payload.redirect_url = process.env.NEXT_PUBLIC_SITE_URL + "/dashboard/upgrade?verify=" + txRef;
  } else {
    payload.customizations.description = "Buy Coins";
  }

  try {
    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.FLW_SECRET_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.status === "success" && data.data?.link) {
      return NextResponse.json({ link: data.data.link, txRef });
    }

    return NextResponse.json({ error: data.message || "Payment failed" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: "Payment service error" }, { status: 500 });
  }
}
