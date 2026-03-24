import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCache, setCache } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  try {
    const blocked = await prisma.block.findMany({ where: { OR: [{ blockerId: id }, { blockedId: id }] } });
    const blockedIds = blocked.map(b => b.blockerId === id ? b.blockedId : b.blockerId);

    const users = await prisma.user.findMany({
      where: { id: { not: id, notIn: blockedIds }, tier: { not: "banned" }, email: { not: "admin@connecthub.com" } },
      select: { id:true, name:true, age:true, gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true, interests:true, boostedUntil:true, lastSeen:true },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    // Smart matching algorithm
    const me = await prisma.user.findUnique({ where: { id }, select: { country:true, gender:true, lookingFor:true, interests:true, age:true } });
    const myCountry = me?.country || "";
    const myInterests: string[] = me?.interests || [];
    const myGender = me?.gender || "";
    const myLookingFor = me?.lookingFor || "";
    const myAge = me?.age || 25;
    const now = new Date();

    users.sort((a: any, b: any) => {
      let aScore = 0, bScore = 0;

      // 1. Boosted users (highest priority)
      if (a.boostedUntil && new Date(a.boostedUntil) > now) aScore += 200;
      if (b.boostedUntil && new Date(b.boostedUntil) > now) bScore += 200;

      // 2. Gender preference match (very important)
      if (myLookingFor === "Men" && a.gender === "Man") aScore += 100;
      else if (myLookingFor === "Women" && a.gender === "Woman") aScore += 100;
      else if (myLookingFor === "Everyone") aScore += 80;
      if (myLookingFor === "Men" && b.gender === "Man") bScore += 100;
      else if (myLookingFor === "Women" && b.gender === "Woman") bScore += 100;
      else if (myLookingFor === "Everyone") bScore += 80;

      // 3. Same country (high priority)
      if (myCountry && a.country === myCountry) aScore += 80;
      if (myCountry && b.country === myCountry) bScore += 80;

      // 4. Shared interests (each shared interest = +15)
      const aShared = myInterests.filter((i: string) => a.interests?.includes(i)).length;
      const bShared = myInterests.filter((i: string) => b.interests?.includes(i)).length;
      aScore += aShared * 15;
      bScore += bShared * 15;

      // 5. Age compatibility (±5 years = bonus)
      const aAgeDiff = Math.abs((a.age || 25) - myAge);
      const bAgeDiff = Math.abs((b.age || 25) - myAge);
      if (aAgeDiff <= 5) aScore += 30;
      else if (aAgeDiff <= 10) aScore += 15;
      if (bAgeDiff <= 5) bScore += 30;
      else if (bAgeDiff <= 10) bScore += 15;

      // 6. Online users (active recently)
      if (a.lastSeen && Date.now() - new Date(a.lastSeen).getTime() < 300000) aScore += 40;
      else if (a.lastSeen && Date.now() - new Date(a.lastSeen).getTime() < 3600000) aScore += 20;
      if (b.lastSeen && Date.now() - new Date(b.lastSeen).getTime() < 300000) bScore += 40;
      else if (b.lastSeen && Date.now() - new Date(b.lastSeen).getTime() < 3600000) bScore += 20;

      // 7. Verified users get slight boost
      if (a.verified) aScore += 10;
      if (b.verified) bScore += 10;

      // 8. Users with profile photos get boost
      if (a.profilePhoto) aScore += 10;
      if (b.profilePhoto) bScore += 10;

      return bScore - aScore;
    });

    return NextResponse.json({ users });
  } catch (e) {
    console.error("Users error:", e);
    return NextResponse.json({ users: [] });
  }
}
