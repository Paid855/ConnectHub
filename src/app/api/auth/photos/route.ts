import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

function getId(req: NextRequest): string | null {
  const sessionCookie = req.cookies.get("session");
  if (!sessionCookie) return null;
  const session = getSessionUser(sessionCookie.value);
  if (session) return session.id;
  try { return JSON.parse(sessionCookie.value).id; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const id = getId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const target = userId || id;

  const user = await prisma.user.findUnique({
    where: { id: target },
    select: { photos: true, profilePhoto: true }
  });

  const photos: string[] = [];
  if (user?.profilePhoto) photos.push(user.profilePhoto);
  if (user?.photos) {
    try {
      const parsed = JSON.parse(user.photos as string);
      if (Array.isArray(parsed)) photos.push(...parsed);
    } catch {}
  }
  return NextResponse.json({ photos: [...new Set(photos)] });
}

export async function POST(req: NextRequest) {
  const id = getId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { photo, action, index } = body;

  const user = await prisma.user.findUnique({ where: { id }, select: { photos: true } });
  let photos: string[] = [];
  try { photos = JSON.parse((user?.photos as string) || "[]"); } catch { photos = []; }

  if (action === "add") {
    if (!photo || typeof photo !== "string") {
      return NextResponse.json({ error: "Photo URL required" }, { status: 400 });
    }
    if (photo.startsWith("data:")) {
      return NextResponse.json({ error: "Direct base64 uploads disabled. Use Cloudinary upload flow." }, { status: 400 });
    }
    if (!photo.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid photo URL" }, { status: 400 });
    }
    if (photos.length >= 20) {
      return NextResponse.json({ error: "Maximum 20 photos" }, { status: 400 });
    }
    photos.push(photo);
  } else if (action === "delete" && typeof index === "number") {
    if (index >= 0 && index < photos.length) photos.splice(index, 1);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: { photos: JSON.stringify(photos) } });
  return NextResponse.json({ photos, count: photos.length });
}
