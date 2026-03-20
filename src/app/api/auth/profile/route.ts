import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const session = req.cookies.get("session");
    if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    const { id } = JSON.parse(session.value);
    const body = await req.json();

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.age) updateData.age = parseInt(body.age);
    if (body.gender) updateData.gender = body.gender;
    if (body.lookingFor) updateData.lookingFor = body.lookingFor;
    if (body.country) updateData.country = body.country;
    if (body.phone) updateData.phone = body.phone;
    if (body.profilePhoto) updateData.profilePhoto = body.profilePhoto;
    if (body.interests) updateData.interests = body.interests;
    if (body.isPrivate !== undefined) updateData.isPrivate = body.isPrivate;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id:true, name:true, email:true, phone:true, age:true, gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true, verificationStatus:true, interests:true, isPrivate:true }
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
