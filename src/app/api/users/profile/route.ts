import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return phone || "";
  return phone.slice(0, 5) + "******" + phone.slice(-2);
}

function maskEmail(email: string): string {
  if (!email) return "";
  const [user, domain] = email.split("@");
  return user.slice(0, 3) + "***@" + domain;
}

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const url = new URL(req.url);
  const viewId = url.searchParams.get("id");
  if (!viewId) return NextResponse.json({ error: "No user specified" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: viewId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isOwn = viewId === id;

  // Build photos array
  let photos: string[] = [];
  if (user.profilePhoto) photos.push(user.profilePhoto);
  try { const p = JSON.parse(user.photos as string || "[]"); if (Array.isArray(p)) photos.push(...p); } catch {}

  // Get stats
  const [postCount, friendCount] = await Promise.all([
    prisma.post.count({ where: { userId: viewId } }),
    prisma.friend.count({ where: { OR: [{ userId: viewId }, { friendId: viewId }], status: "accepted" } }),
  ]);

  // Friendship status
  const friendship = await prisma.friend.findFirst({ where: { OR: [{ userId: id, friendId: viewId }, { userId: viewId, friendId: id }] } });

  // Record view
  if (!isOwn) {
    const today = new Date(); today.setHours(0,0,0,0);
    const existing = await prisma.profileView.findFirst({ where: { viewerId: id, viewedId: viewId, createdAt: { gte: today } } });
    if (!existing) prisma.profileView.create({ data: { viewerId: id, viewedId: viewId } }).catch(() => {});
  }

  return NextResponse.json({
    user: {
      id: user.id, name: user.name, username: user.username, age: user.age,
      gender: user.gender, lookingFor: user.lookingFor, bio: user.bio,
      country: user.country, profilePhoto: user.profilePhoto,
      tier: user.tier, verified: user.verified, interests: user.interests,
      lastSeen: user.lastSeen, createdAt: user.createdAt,
      phone: isOwn ? user.phone : maskPhone(user.phone || ""),
      email: isOwn ? user.email : maskEmail(user.email || ""),
      photos: [...new Set(photos)],
      postCount, friendCount,
      friendshipStatus: friendship?.status || null,
      isFriend: friendship?.status === "accepted",
    }
  });
}