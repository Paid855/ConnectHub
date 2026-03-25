import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username")?.toLowerCase();
  if (!username || username.length < 3) return NextResponse.json({ available: false, message: "Min 3 characters" });

  const existing = await prisma.user.findFirst({ where: { username } });
  return NextResponse.json({ available: !existing, message: existing ? "Username taken" : "Available" });
}
