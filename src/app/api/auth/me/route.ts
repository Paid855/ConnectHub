import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get("session");
    if (!session) return NextResponse.json({ user: null }, { status: 401 });
    const data = JSON.parse(session.value);
    const user = await prisma.user.findUnique({
      where: { id: data.id },
      select: { id:true, name:true, email:true, age:true, gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true, verificationStatus:true, createdAt:true }
    });
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    if (user.tier === "banned") return NextResponse.json({ user: null, banned: true }, { status: 403 });
    return NextResponse.json({ user });
  } catch { return NextResponse.json({ user: null }, { status: 401 }); }
}
