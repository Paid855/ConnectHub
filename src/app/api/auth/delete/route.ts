import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { password, confirm } = await req.json();

  if (confirm !== "DELETE MY ACCOUNT") return NextResponse.json({ error: "Type DELETE MY ACCOUNT to confirm" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });

  // Delete all user data
  await prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }).catch(() => {});
  await prisma.postComment.deleteMany({ where: { userId: id } }).catch(() => {});
  await prisma.postLike.deleteMany({ where: { userId: id } }).catch(() => {});
  await prisma.post.deleteMany({ where: { userId: id } }).catch(() => {});
  await prisma.friend.deleteMany({ where: { OR: [{ userId: id }, { friendId: id }] } }).catch(() => {});
  await prisma.block.deleteMany({ where: { OR: [{ blockerId: id }, { blockedId: id }] } }).catch(() => {});
  await prisma.notification.deleteMany({ where: { OR: [{ userId: id }, { fromUserId: id }] } }).catch(() => {});
  await prisma.profileView.deleteMany({ where: { OR: [{ viewerId: id }, { viewedId: id }] } }).catch(() => {});
  await prisma.gift.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }).catch(() => {});
  await prisma.coinTransaction.deleteMany({ where: { userId: id } }).catch(() => {});
  await prisma.story.deleteMany({ where: { userId: id } }).catch(() => {});
  await prisma.liveChat.deleteMany({ where: { userId: id } }).catch(() => {});
  await prisma.liveStream.deleteMany({ where: { userId: id } }).catch(() => {});
  await prisma.report.deleteMany({ where: { OR: [{ reporterId: id }, { reportedId: id }] } }).catch(() => {});
  await prisma.user.delete({ where: { id } }).catch(() => {});

  const response = NextResponse.json({ success: true, message: "Account deleted permanently" });
  response.cookies.delete("session");
  return response;
}
