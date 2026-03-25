import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");
  if (!sessionCookie) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const sessionData = getSessionUser(sessionCookie.value);
  if (!sessionData) {
    const res = NextResponse.json({ error: "Invalid session" }, { status: 401 });
    res.cookies.set("session", "", { path: "/", maxAge: 0 });
    return res;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionData.id },
      select: {
        id:true, name:true, email:true, username:true, phone:true, age:true,
        gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true,
        tier:true, verified:true, verificationStatus:true, interests:true,
        coins:true, createdAt:true, lastSeen:true, referralCode:true, boostedUntil:true
      }
    });

    if (!user) {
      const res = NextResponse.json({ error: "User not found" }, { status: 401 });
      res.cookies.set("session", "", { path: "/", maxAge: 0 });
      return res;
    }

    if (user.tier === "banned") {
      const res = NextResponse.json({ error: "Account suspended" }, { status: 403 });
      res.cookies.set("session", "", { path: "/", maxAge: 0 });
      return res;
    }

    // Background lastSeen update
    prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } }).catch(() => {});

    return NextResponse.json({ user });
  } catch (e) {
    console.error("Session check error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
