import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getUserId(req: NextRequest) {
  try {
    const c = req.cookies.get("session")?.value;
    if (!c) return null;
    const p = JSON.parse(c);
    return p.id || p.userId || null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });

  // Get all likes received
  const likes = await prisma.like.findMany({
    where: { toUserId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Get user details for each liker
  const likerIds = likes.map(l => l.fromUserId);
  const likers = await prisma.user.findMany({
    where: { id: { in: likerIds } },
    select: { id: true, name: true, profilePhoto: true, age: true, gender: true, bio: true, tier: true, verified: true, city: true, country: true, lastActive: true },
  });

  const results = likes.map(l => {
    const liker = likers.find(u => u.id === l.fromUserId);
    if (!liker) return null;

    // Free users see blurred profiles (just count), Plus/Premium see full details
    const canSee = user?.tier === "plus" || user?.tier === "premium" || user?.tier === "gold";

    return {
      likeId: l.id,
      type: l.type,
      createdAt: l.createdAt,
      user: canSee ? {
        id: liker.id,
        name: liker.name,
        profilePhoto: liker.profilePhoto,
        age: liker.age,
        gender: liker.gender,
        bio: liker.bio,
        tier: liker.tier,
        verified: liker.verified,
        city: liker.city,
        country: liker.country,
        isOnline: liker.lastActive ? Date.now() - new Date(liker.lastActive).getTime() < 5 * 60 * 1000 : false,
      } : {
        id: liker.id,
        name: "???",
        profilePhoto: null,
        blurred: true,
      },
    };
  }).filter(Boolean);

  return NextResponse.json({
    likes: results,
    total: results.length,
    canSeeDetails: user?.tier === "plus" || user?.tier === "premium" || user?.tier === "gold",
  });
}
