import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, secretKey } = await req.json();
    if (secretKey !== (process.env.ADMIN_SECRET_KEY || "ConnectHub_Admin_2026_Secret")) return NextResponse.json({ error: "Invalid secret key" }, { status: 401 });
    const admin = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 401 });
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", JSON.stringify({ id: admin.id, email: admin.email, name: admin.name, isAdmin: true }), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 86400 });
    return res;
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
