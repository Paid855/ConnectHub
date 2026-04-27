import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id:true, name:true, email:true, username:true, phone:true, age:true,
        gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true,
        tier:true, verified:true, verificationStatus:true, interests:true,
        coins:true, createdAt:true, lastSeen:true, referralCode:true, boostedUntil:true, emailVerified:true, phoneVerified:true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (user.tier === "banned") {
      const res = NextResponse.json({ error: "Account suspended" }, { status: 403 });
      res.cookies.set("session", "", { path: "/", maxAge: 0 });
      return res;
    }

    prisma.user.update({ where: { id }, data: { lastSeen: new Date() } }).catch(() => {});
    // Update lastActive timestamp
  await prisma.user.update({ where: { id: user.id }, data: { lastActive: new Date() } }).catch(() => {});

  return NextResponse.json({ user });
  } catch (e) {
    console.error("Session error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
