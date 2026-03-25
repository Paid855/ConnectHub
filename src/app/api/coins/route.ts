import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id }, select: { coins: true } });
  const history = await prisma.coinTransaction.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json({ coins: user?.coins || 0, history });
}
