import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const users = await prisma.user.findMany({
    where: { id: { not: id }, tier: { not: "banned" } },
    select: { id:true, name:true, age:true, gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true, createdAt:true },
    orderBy: [{ boostedUntil: "desc" }, { createdAt: "desc" }]
  });
  return NextResponse.json({ users });
}
