import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const session = req.cookies.get("session");
    if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    const { id } = JSON.parse(session.value);
    const body = await req.json();

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: body.name || undefined,
        bio: body.bio || undefined,
        age: body.age ? parseInt(body.age) : undefined,
        gender: body.gender || undefined,
        lookingFor: body.lookingFor || undefined,
        country: body.country || undefined,
        profilePhoto: body.profilePhoto || undefined,
      },
      select: { id:true, name:true, email:true, age:true, gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true, verificationStatus:true }
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
