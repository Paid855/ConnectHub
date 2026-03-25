import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { sanitize, isSuspicious } from "@/lib/sanitize";

export async function PUT(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");
  if (!sessionCookie) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const session = getSessionUser(sessionCookie.value);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  const id = session.id;

  const body = await req.json();
  const updateData: any = {};

  // Sanitize text fields
  if (body.name !== undefined) updateData.name = sanitize(body.name.trim().substring(0, 50));
  if (body.bio !== undefined) updateData.bio = sanitize(body.bio.trim().substring(0, 500));
  if (body.age !== undefined) { const age = parseInt(body.age); if (age >= 18 && age <= 99) updateData.age = age; }
  if (body.gender !== undefined) updateData.gender = sanitize(body.gender);
  if (body.lookingFor !== undefined) updateData.lookingFor = sanitize(body.lookingFor);
  if (body.country !== undefined) updateData.country = sanitize(body.country);
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.interests !== undefined && Array.isArray(body.interests)) {
    updateData.interests = body.interests.slice(0, 10).map((i: string) => sanitize(i));
  }

  // Handle profile photo with size validation
  if (body.profilePhoto !== undefined) {
    if (body.profilePhoto && body.profilePhoto.length > 7 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo too large. Maximum 5MB." }, { status: 400 });
    }
    updateData.profilePhoto = body.profilePhoto;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: updateData });
  return NextResponse.json({ success: true });
}
