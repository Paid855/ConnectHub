import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { latitude, longitude, country, city, isVPN } = await req.json();

  // Save detected location (separate from signup country)
  await prisma.user.update({
    where: { id },
    data: {
      detectedCity: city || null,
      detectedCountry: country || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      city: city || undefined,
      lastSeen: new Date(),
    }
  }).catch((e: any) => console.error("Location save error:", e.message));

  return NextResponse.json({ success: true, isVPN: !!isVPN });
}

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id },
    select: { country: true, city: true, detectedCity: true, detectedCountry: true, latitude: true, longitude: true }
  });

  return NextResponse.json({ location: user });
}
