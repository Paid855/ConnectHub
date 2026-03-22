import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const ADMIN_CREDENTIALS = {
  email: "admin@connecthub.com",
  password: "ConnectHub@2026",
  secretKey: process.env.ADMIN_SECRET || "ConnectHub_Admin_2026_Secret"
};

export async function POST(req: NextRequest) {
  try {
    const { email, password, secretKey } = await req.json();

    if (!email || !password || !secretKey) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (secretKey !== ADMIN_CREDENTIALS.secretKey) {
      return NextResponse.json({ error: "Invalid admin secret key" }, { status: 403 });
    }

    if (email.toLowerCase() !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_session", JSON.stringify({ email, role: "admin", loginAt: Date.now() }), {
      httpOnly: true, secure: false, sameSite: "lax", maxAge: 60 * 60 * 8, path: "/"
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
