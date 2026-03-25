import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");
  if (!sessionCookie) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  let id: string;
  const session = getSessionUser(sessionCookie.value);
  if (session) id = session.id; else try { id = JSON.parse(sessionCookie.value).id; } catch { return NextResponse.json({ error: "Invalid session" }, { status: 401 }); }

  const target = userId || id;
  const user = await prisma.user.findUnique({ where: { id: target }, select: { photos: true, profilePhoto: true } });
  const photos: string[] = [];
  if (user?.profilePhoto) photos.push(user.profilePhoto);
  if (user?.photos) { try { const parsed = JSON.parse(user.photos as string); if (Array.isArray(parsed)) photos.push(...parsed); } catch {} }
  return NextResponse.json({ photos: [...new Set(photos)] });
}

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");
  if (!sessionCookie) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  let id: string;
  const session = getSessionUser(sessionCookie.value);
  if (session) id = session.id; else try { id = JSON.parse(sessionCookie.value).id; } catch { return NextResponse.json({ error: "Invalid session" }, { status: 401 }); }

  const { photo, action, index } = await req.json();
  const user = await prisma.user.findUnique({ where: { id }, select: { photos: true } });
  let photos: string[] = [];
  try { photos = JSON.parse((user?.photos as string) || "[]"); } catch { photos = []; }

  if (action === "add" && photo) {
    if (photos.length >= 6) return NextResponse.json({ error: "Maximum 6 photos" }, { status: 400 });
    // Upload to Cloudinary
    if (photo.startsWith("data:")) {
      const cloudUrl = await uploadImage(photo, "gallery");
      photos.push(cloudUrl || photo);
    } else {
      photos.push(photo);
    }
  } else if (action === "delete" && typeof index === "number") {
    photos.splice(index, 1);
  }

  await prisma.user.update({ where: { id }, data: { photos: JSON.stringify(photos) } });
  return NextResponse.json({ photos, count: photos.length });
}
