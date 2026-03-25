import { getUserId } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() || "";
  const interest = url.searchParams.get("interest") || "";
  const ageMin = parseInt(url.searchParams.get("ageMin") || "0");
  const ageMax = parseInt(url.searchParams.get("ageMax") || "0");
  const country = url.searchParams.get("country")?.toLowerCase() || "";
  const gender = url.searchParams.get("gender") || "";

  if (!q && !interest && !country && !gender && !ageMin && !ageMax) return NextResponse.json({ users: [] });

  const blocked = await prisma.block.findMany({ where: { OR: [{ blockerId: id }, { blockedId: id }] } });
  const blockedIds = blocked.map(b => b.blockerId === id ? b.blockedId : b.blockerId);

  let where: any = { id: { not: id, notIn: blockedIds }, tier: { not: "banned" }, email: { not: "admin@connecthub.com" } };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { bio: { contains: q, mode: "insensitive" } },
    ];
  }
  if (interest) where.interests = { has: interest };
  if (gender) where.gender = gender;
  if (country) where.country = { contains: country, mode: "insensitive" };
  if (ageMin > 0) where.age = { ...(where.age || {}), gte: ageMin };
  if (ageMax > 0) where.age = { ...(where.age || {}), lte: ageMax };

  const users = await prisma.user.findMany({
    where,
    select: { id:true, name:true, username:true, age:true, gender:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true, interests:true, lastSeen:true },
    take: 30,
    orderBy: { lastSeen: "desc" }
  });

  return NextResponse.json({ users });
}
