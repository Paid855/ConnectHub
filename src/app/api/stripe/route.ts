import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

const COIN_PACKAGES = [
  { id: "coins_100", coins: 100, amount: 99, label: "100 Coins", amountNGN: 1500 },
  { id: "coins_500", coins: 500, amount: 399, label: "500 Coins", amountNGN: 6000 },
  { id: "coins_1000", coins: 1000, amount: 699, label: "1,000 Coins", amountNGN: 10500 },
  { id: "coins_5000", coins: 5000, amount: 2999, label: "5,000 Coins", amountNGN: 45000 },
];

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { packageId } = await req.json();

  const pkg = COIN_PACKAGES.find(p => p.id === packageId);
  if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true, name: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const reference = "CH_" + id.slice(0, 8) + "_" + Date.now();
  const callbackUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173") + "/dashboard/coins?verify=" + reference + "&coins=" + pkg.coins;

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { "Authorization": "Bearer " + PAYSTACK_SECRET, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        amount: pkg.amountNGN * 100, // Paystack uses kobo (smallest unit)
        currency: "NGN",
        reference,
        callback_url: callbackUrl,
        metadata: { userId: id, packageId: pkg.id, coins: pkg.coins, custom_fields: [{ display_name: "Package", variable_name: "package", value: pkg.label }] }
      })
    });

    const data = await res.json();
    if (data.status && data.data?.authorization_url) {
      return NextResponse.json({ url: data.data.authorization_url, reference });
    } else {
      console.error("Paystack error:", data);
      return NextResponse.json({ error: data.message || "Payment initialization failed" }, { status: 500 });
    }
  } catch (e: any) {
    console.error("Paystack error:", e);
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 500 });
  }
}
