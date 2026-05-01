import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const showAll = url.searchParams.get("all") === "1";

    const blocked = await prisma.block.findMany({ where: { OR: [{ blockerId: id }, { blockedId: id }] } });
    const blockedIds = blocked.map(b => b.blockerId === id ? b.blockedId : b.blockerId);

    let excludeIds = [...blockedIds];

    // Only exclude liked/friends for discover page (not browse)
    if (!showAll) {
      const myLikes = await prisma.like.findMany({ where: { fromUserId: id }, select: { toUserId: true } });
      const likedIds = myLikes.map(l => l.toUserId);

      const myFriends = await prisma.friend.findMany({ where: { OR: [{ userId: id, status: "accepted" }, { friendId: id, status: "accepted" }] } });
      const friendIds = myFriends.map(f => f.userId === id ? f.friendId : f.userId);

      excludeIds = [...new Set([...blockedIds, ...likedIds, ...friendIds])];
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: id, notIn: excludeIds },
        tier: { not: "banned" },
        email: { not: "admin@connecthub.com" }
      },
      select: { id:true, name:true, age:true, gender:true, lookingFor:true, bio:true, country:true, city:true, detectedCity:true, detectedCountry:true, profilePhoto:true, tier:true, verified:true, interests:true, lastSeen:true, vibeStatus:true },
      orderBy: { lastSeen: "desc" },
      take: 100
    });

    // Simple sort: online first, then verified, then has photo
    users.sort((a, b) => {
      const now = Date.now();
      let aS = 0, bS = 0;
      if (a.lastSeen && now - new Date(a.lastSeen).getTime() < 300000) aS += 50;
      if (b.lastSeen && now - new Date(b.lastSeen).getTime() < 300000) bS += 50;
      if (a.verified) aS += 20;
      if (b.verified) bS += 20;
      if (a.profilePhoto) aS += 10;
      if (b.profilePhoto) bS += 10;
      return bS - aS;
    });

    const response = NextResponse.json({ users });
    response.headers.set("Cache-Control", "private, max-age=30");
    return response;
  } catch (e) {
    console.error("Users API error:", e);
    return NextResponse.json({ users: [] });
  }
}
