import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "ConnectHub_Admin_2026_Secret";

export async function POST(req: NextRequest) {
  try {
    const { email, password, secretKey } = await req.json();
    if (!email || !password || !secretKey) return NextResponse.json({ error: "All fields required" }, { status: 400 });
    if (secretKey !== ADMIN_SECRET) return NextResponse.json({ error: "Invalid secret key" }, { status: 401 });

    const admin = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 401 });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return NextResponse.json({ error: "Wrong password" }, { status: 401 });

    const session = JSON.stringify({ id: admin.id, email: admin.email, name: admin.name, isAdmin: true });
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60*60*24 });
    return res;
  } catch (e) {
    console.error("Admin login error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
