import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "admin@connecthub.com";
const ADMIN_PASSWORD = "ConnectHub@2026";
const ADMIN_SECRET = "ConnectHub_Admin_2026_Secret";

export async function POST(req: NextRequest) {
  try {
    const { email, password, secretKey } = await req.json();

    if (!email || !password || !secretKey) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Invalid admin email" }, { status: 401 });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    if (secretKey !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Invalid secret key" }, { status: 401 });
    }

    const sessionData = JSON.stringify({ email: ADMIN_EMAIL, role: "admin", loggedAt: Date.now() });
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return res;
  } catch (e) {
    console.error("Admin login error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
