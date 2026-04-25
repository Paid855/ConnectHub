import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  // === CHANGE PASSWORD ===
  if (action === "change_password") {
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) return NextResponse.json({ error: "Both fields required" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id }, select: { password: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashed } });

    return NextResponse.json({ success: true, message: "Password changed successfully" });
  }

  // === DELETE ACCOUNT ===
  if (action === "delete_account") {
    const { password, confirmation } = body;
    if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });
    if (confirmation !== "DELETE MY ACCOUNT") return NextResponse.json({ error: "Please type DELETE MY ACCOUNT to confirm" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id }, select: { password: true, email: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Incorrect password" }, { status: 400 });

    // Delete all user data
    await prisma.notification.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.coinTransaction.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.pushSubscription.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }).catch(() => {});
    await prisma.like.deleteMany({ where: { OR: [{ fromUserId: id }, { toUserId: id }] } }).catch(() => {});
    await prisma.reaction.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.gift.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }).catch(() => {});
    await prisma.withdrawal.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.liveChat.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.liveStream.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.user.delete({ where: { id } }).catch(() => {});

    const res = NextResponse.json({ success: true, message: "Account deleted" });
    res.cookies.set("session", "", { maxAge: 0, path: "/" });
    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
