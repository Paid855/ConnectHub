import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const s = req.cookies.get("admin_session");
  if (!s) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try { const d = JSON.parse(s.value); if (!d.isAdmin) throw new Error(); const u = await prisma.user.findUnique({ where: { id: d.id }, select: { id:true, name:true, email:true } }); return NextResponse.json({ user: u }); } catch { return NextResponse.json({ error: "Invalid" }, { status: 401 }); }
}

export async function PUT(req: NextRequest) {
  const s = req.cookies.get("admin_session");
  if (!s) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const d = JSON.parse(s.value);
    const { currentPassword, newPassword, userId, action, newTier } = await req.json();
    if (currentPassword && newPassword) {
      const admin = await prisma.user.findUnique({ where: { id: d.id } });
      if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const valid = await bcrypt.compare(currentPassword, admin.password);
      if (!valid) return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
      await prisma.user.update({ where: { id: d.id }, data: { password: await bcrypt.hash(newPassword, 12) } });
      return NextResponse.json({ success: true, message: "Password changed" });
    }
    if (userId && action === "changeTier" && newTier) {
      await prisma.user.update({ where: { id: userId }, data: { tier: newTier } });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
