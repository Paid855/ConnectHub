import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    const admin = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (!admin) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    if (admin.email !== "admin@connecthub.com") return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", JSON.stringify({ id: admin.id, email: admin.email, name: admin.name, isAdmin: true }), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 86400 });
    return res;
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
