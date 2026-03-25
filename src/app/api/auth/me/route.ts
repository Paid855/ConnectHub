import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) {
    const res = NextResponse.json({ error: "Not logged in" }, { status: 401 });
    res.cookies.set("session", "", { path: "/", maxAge: 0 });
    return res;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
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

    prisma.user.update({ where: { id }, data: { lastSeen: new Date() } }).catch(() => {});
    return NextResponse.json({ user });
  } catch (e) {
    console.error("Session error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
