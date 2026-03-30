import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const type = session.metadata?.type;

      if (!userId) return NextResponse.json({ received: true });

      if (type === "subscription") {
        const tier = session.metadata?.tier;
        if (tier === "plus" || tier === "premium") {
          await prisma.user.update({ where: { id: userId }, data: { tier } });
          await prisma.coinTransaction.create({ data: { userId, amount: 0, type: "upgrade", description: "Upgraded to " + tier } }).catch(() => {});
        }
      }

      if (type === "coins") {
        const coins = parseInt(session.metadata?.coins || "0");
        if (coins > 0) {
          await prisma.user.update({ where: { id: userId }, data: { coins: { increment: coins } } });
          await prisma.coinTransaction.create({ data: { userId, amount: coins, type: "purchase", description: "Purchased " + coins + " coins" } }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
