import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";
import { isSuspicious } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";

    // Rate limit: 10 login attempts per IP per 5 minutes
    const rl = rateLimit("login:" + ip, 10, 300000);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many login attempts. Please wait 5 minutes." }, { status: 429 });
    }

    const body = await req.json();
    const loginId = (body.emailOrUsername || body.email || "").trim().toLowerCase();
    const pwd = body.password || "";

    if (!loginId || !pwd) {
      return NextResponse.json({ error: "Email/username and password are required" }, { status: 400 });
    }

    // Check for suspicious input
    if (isSuspicious(loginId)) {
      return NextResponse.json({ error: "Invalid input detected" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: loginId }, { username: loginId }] },
      select: { id:true, email:true, name:true, password:true, tier:true }
    });

    if (!user) return NextResponse.json({ error: "No account found" }, { status: 401 });
    if (user.tier === "banned") return NextResponse.json({ error: "Account suspended. Contact support." }, { status: 403 });

    const valid = await bcrypt.compare(pwd, user.password);
    if (!valid) {
      // Rate limit per account too: 5 wrong passwords per account per 15 minutes
      const accountRl = rateLimit("login_account:" + user.id, 5, 900000);
      if (!accountRl.success) {
        return NextResponse.json({ error: "Account temporarily locked. Try again in 15 minutes." }, { status: 429 });
      }
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // Update lastSeen in background
    prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } }).catch(() => {});

    // Create signed session
    const sessionToken = createSession({ id: user.id, email: user.email, name: user.name });

    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, tier: user.tier } });
    res.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
