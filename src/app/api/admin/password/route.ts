import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

function isAdmin(req: NextRequest) { try { return JSON.parse(req.cookies.get("admin_session")?.value || "{}").isAdmin === true; } catch { return false; } }
function getAdminId(req: NextRequest) { try { return JSON.parse(req.cookies.get("admin_session")?.value || "{}").id; } catch { return null; } }

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const adminId = getAdminId(req);
  if (!adminId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return NextResponse.json({ error: "Both passwords required" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return NextResponse.json({ error: "Current password is wrong" }, { status: 401 });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: adminId }, data: { password: hashed } });
    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
