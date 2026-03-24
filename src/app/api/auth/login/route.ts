import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailOrUsername, password, email } = body;

    // Support both old format (email field) and new format (emailOrUsername field)
    const loginId = emailOrUsername || email || "";
    const pwd = password || "";

    if (!loginId || !pwd) {
      return NextResponse.json({ error: "Email/username and password are required" }, { status: 400 });
    }

    // Find user by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginId.toLowerCase() },
          { username: loginId.toLowerCase() }
        ]
      }
    });

    if (!user) return NextResponse.json({ error: "No account found with that email or username" }, { status: 401 });
    if (user.tier === "banned") return NextResponse.json({ error: "This account has been suspended" }, { status: 403 });

    const valid = await bcrypt.compare(pwd, user.password);
    if (!valid) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });

    // Update last seen
    await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } }).catch(() => {});

    const sessionData = JSON.stringify({ id: user.id, email: user.email, name: user.name });
    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, tier: user.tier } });
    res.cookies.set("session", sessionData, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });

    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
