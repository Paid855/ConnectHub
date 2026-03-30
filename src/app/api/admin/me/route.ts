import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const data = JSON.parse(session.value);
    if (!data.isAdmin) return NextResponse.json({ error: "Not admin" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: data.id }, select: { id:true, name:true, email:true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 401 });
    return NextResponse.json({ user });
  } catch { return NextResponse.json({ error: "Invalid session" }, { status: 401 }); }
}

export async function PUT(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const data = JSON.parse(session.value);
    const { currentPassword, newPassword } = await req.json();
    const admin = await prisma.user.findUnique({ where: { id: data.id } });
    if (!admin) return NextResponse.json({ error: "Not found" }, { status: 401 });
    const bcrypt = require("bcryptjs");
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: data.id }, data: { password: hashed } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
