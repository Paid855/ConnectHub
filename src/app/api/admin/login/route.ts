import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "admin@connecthub.com";
const ADMIN_PASS = "ConnectHub@2026";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    const res = NextResponse.json({ success: true });
    res.cookies.set({
      name: "admin_session",
      value: "authenticated",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  }
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
