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
  if (user.length <= 3) return user[0] + "***@" + domain;
  return user.slice(0, 3) + "***@" + domain;
}

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const url = new URL(req.url);
  const viewId = url.searchParams.get("id");
  if (!viewId) return NextResponse.json({ error: "No user specified" }, { status: 400 });

  const isOwnProfile = viewId === id;

  const user = await prisma.user.findUnique({
    where: { id: viewId },
    select: {
      id: true, name: true, username: true, age: true, gender: true, lookingFor: true,
      bio: true, country: true, profilePhoto: true, tier: true, verified: true,
      verificationStatus: true, interests: true, lastSeen: true, createdAt: true,
      phone: true, email: true, photos: true,
      hidePhone: true, hideEmail: true, hideDob: true,
    }
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Record profile view
  if (!isOwnProfile) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await prisma.profileView.findFirst({ where: { viewerId: id, viewedId: viewId, createdAt: { gte: today } } });
    if (!existing) prisma.profileView.create({ data: { viewerId: id, viewedId: viewId } }).catch(() => {});
  }

  // Apply privacy settings for other users
  const profile: any = { ...user };
  if (!isOwnProfile) {
    profile.phone = user.hidePhone !== false ? maskPhone(user.phone || "") : user.phone;
    profile.email = user.hideEmail !== false ? maskEmail(user.email || "") : user.email;
    if (user.hideDob) delete profile.dateOfBirth;
  }

  // Parse photos
  let photos: string[] = [];
  if (user.profilePhoto) photos.push(user.profilePhoto);
  try { const p = JSON.parse(user.photos as string || "[]"); if (Array.isArray(p)) photos.push(...p); } catch {}
  profile.photos = [...new Set(photos)];

  // Get post count and friend count
  const [postCount, friendCount] = await Promise.all([
    prisma.post.count({ where: { userId: viewId } }),
    prisma.friend.count({ where: { OR: [{ userId: viewId }, { friendId: viewId }], status: "accepted" } }),
  ]);
  profile.postCount = postCount;
  profile.friendCount = friendCount;

  // Check friendship status
  const friendship = await prisma.friend.findFirst({ where: { OR: [{ userId: id, friendId: viewId }, { userId: viewId, friendId: id }] } });
  profile.friendshipStatus = friendship?.status || null;
  profile.isFriend = friendship?.status === "accepted";

  return NextResponse.json({ user: profile });
}
