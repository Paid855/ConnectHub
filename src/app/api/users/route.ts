import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const blocked = await prisma.block.findMany({ where: { OR: [{ blockerId: id }, { blockedId: id }] } });
    const blockedIds = blocked.map(b => b.blockerId === id ? b.blockedId : b.blockerId);

    const users = await prisma.user.findMany({
      where: { id: { not: id, notIn: blockedIds }, tier: { not: "banned" }, email: { not: "admin@connecthub.com" } },
      select: { id:true, name:true, age:true, gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true, interests:true, boostedUntil:true, lastSeen:true },
      orderBy: { lastSeen: "desc" },
      take: 100
    });

    // Smart matching
    const me = await prisma.user.findUnique({ where: { id }, select: { country:true, gender:true, lookingFor:true, interests:true, age:true } });
    const myCountry = me?.country || "";
    const myInterests: string[] = me?.interests || [];
    const myLookingFor = me?.lookingFor || "";
    const myAge = me?.age || 25;
    const now = new Date();

    users.sort((a: any, b: any) => {
      let aS = 0, bS = 0;
      if (a.boostedUntil && new Date(a.boostedUntil) > now) aS += 200;
      if (b.boostedUntil && new Date(b.boostedUntil) > now) bS += 200;
      if (myLookingFor === "Men" && a.gender === "Man") aS += 100;
      else if (myLookingFor === "Women" && a.gender === "Woman") aS += 100;
      else if (myLookingFor === "Everyone") aS += 80;
      if (myLookingFor === "Men" && b.gender === "Man") bS += 100;
      else if (myLookingFor === "Women" && b.gender === "Woman") bS += 100;
      else if (myLookingFor === "Everyone") bS += 80;
      if (myCountry && a.country === myCountry) aS += 80;
      if (myCountry && b.country === myCountry) bS += 80;
      aS += myInterests.filter((i: string) => a.interests?.includes(i)).length * 15;
      bS += myInterests.filter((i: string) => b.interests?.includes(i)).length * 15;
      if (a.lastSeen && Date.now() - new Date(a.lastSeen).getTime() < 300000) aS += 40;
      if (b.lastSeen && Date.now() - new Date(b.lastSeen).getTime() < 300000) bS += 40;
      if (a.verified) aS += 10;
      if (b.verified) bS += 10;
      if (a.profilePhoto) aS += 10;
      if (b.profilePhoto) bS += 10;
      return bS - aS;
    });

    return NextResponse.json({ users });
  } catch (e) {
    console.error("Users error:", e);
    return NextResponse.json({ users: [] });
  }
}
