import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { latitude, longitude, country, city, isVPN } = await req.json();

  // Update user location
  await prisma.user.update({
    where: { id },
    data: {
      ...(country ? { country } : {}),
      lastSeen: new Date(),
    }
  }).catch(() => {});

  return NextResponse.json({ success: true, isVPN: !!isVPN });
}
