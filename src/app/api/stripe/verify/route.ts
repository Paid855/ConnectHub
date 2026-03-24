import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  const url = new URL(req.url);
  const reference = url.searchParams.get("reference");
  const coins = parseInt(url.searchParams.get("coins") || "0");

  if (!reference) return NextResponse.json({ error: "No reference" }, { status: 400 });

  const existing = await prisma.coinTransaction.findFirst({ where: { userId: id, description: { contains: reference } } });
  if (existing) return NextResponse.json({ success: true, already: true, coins });

  try {
    const res = await fetch("https://api.paystack.co/transaction/verify/" + reference, {
      headers: { "Authorization": "Bearer " + PAYSTACK_SECRET }
    });
    const data = await res.json();

    if (data.status && data.data?.status === "success") {
      const meta = data.data.metadata;
      const coinsToAdd = meta?.coins || coins;
      const userId = meta?.userId || id;

      await prisma.user.update({ where: { id: userId }, data: { coins: { increment: coinsToAdd } } });
      await prisma.coinTransaction.create({
        data: { userId, amount: coinsToAdd, type: "purchase", description: "Purchased " + coinsToAdd + " coins via Paystack (ref: " + reference + ")" }
      });
      createNotification(userId, "purchase", "Coins Added!", "+" + coinsToAdd + " coins added to your account", null);

      return NextResponse.json({ success: true, coins: coinsToAdd });
    } else {
      return NextResponse.json({ error: "Payment not verified", status: data.data?.status }, { status: 400 });
    }
  } catch (e) {
    console.error("Verify error:", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
