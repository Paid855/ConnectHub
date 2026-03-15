import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get("session");
    if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { id } = JSON.parse(session.value);
    const { plan } = await req.json();

    if (!["premium", "gold", "basic"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id },
      data: { tier: plan }
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
