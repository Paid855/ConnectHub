import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailOrUsername, password, email } = body;
    const loginId = (emailOrUsername || email || "").trim().toLowerCase();
    const pwd = password || "";

    if (!loginId || !pwd) {
      return NextResponse.json({ error: "Email/username and password are required" }, { status: 400 });
    }

    // Single optimized query
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: loginId }, { username: loginId }] },
      select: { id:true, email:true, name:true, password:true, tier:true }
    });

    if (!user) return NextResponse.json({ error: "No account found" }, { status: 401 });
    if (user.tier === "banned") return NextResponse.json({ error: "Account suspended" }, { status: 403 });

    const valid = await bcrypt.compare(pwd, user.password);
    if (!valid) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });

    // Update lastSeen in background (don't await)
    prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } }).catch(() => {});

    const sessionData = JSON.stringify({ id: user.id, email: user.email, name: user.name });
    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, tier: user.tier } });
    res.cookies.set("session", sessionData, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60*60*24*7 });
    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
