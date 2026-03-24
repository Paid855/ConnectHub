import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const { id } = JSON.parse(session.value);

    // Single optimized query with only needed fields
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id:true, name:true, email:true, username:true, phone:true, age:true,
        gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true,
        tier:true, verified:true, verificationStatus:true, interests:true,
        coins:true, createdAt:true, lastSeen:true, referralCode:true
      }
    });

    if (!user) {
      // Clear invalid session
      const res = NextResponse.json({ error: "User not found" }, { status: 401 });
      res.cookies.set("session", "", { path: "/", maxAge: 0 });
      return res;
    }

    // Update lastSeen in background
    prisma.user.update({ where: { id }, data: { lastSeen: new Date() } }).catch(() => {});

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
