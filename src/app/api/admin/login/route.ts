import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signAdminSession } from "@/lib/admin-session";
import { checkRateLimit, clearRateLimit } from "@/lib/admin-ratelimit";
import { logLoginAttempt, getClientIp, logAdminAction } from "@/lib/admin-audit";
import { checkAndAlertFailedLogins } from "@/lib/admin-alert";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "";
  const host = req.headers.get("host") || "";

  // Block: must be on admin subdomain
  if (!host.startsWith("admin.")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Rate limit per IP
  const rl = await checkRateLimit("login:" + ip, 5, 900);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(rl.resetIn / 60)} minutes.` },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const admin = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });

    // Use generic error message regardless of which step fails
    const fail = async () => {
      await logLoginAttempt(email, ip, false, userAgent);
      await checkAndAlertFailedLogins(email, ip);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    };

    if (!admin) return fail();
    if (admin.role !== "admin") return fail();
    if (admin.banned) return fail();

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return fail();

    // Success
    await clearRateLimit("login:" + ip);
    await logLoginAttempt(email, ip, true, userAgent);
    await prisma.user.update({
      where: { id: admin.id },
      data: { adminLastLogin: new Date(), adminLastLoginIp: ip }
    });
    await logAdminAction({
      adminId: admin.id, adminEmail: admin.email, action: "login",
      ip, userAgent
    });

    const token = signAdminSession({
      id: admin.id, email: admin.email, name: admin.name, role: "admin"
    }, 3600);

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 3600,
      domain: process.env.NODE_ENV === "production" ? ".connecthub.love" : undefined
    });
    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
