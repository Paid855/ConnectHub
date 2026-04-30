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

  // Return only gallery photos (exclude profilePhoto to prevent duplicates)
  const photos: string[] = [];
  if (Array.isArray(user?.photos)) {
    photos.push(...user.photos.filter((p: string) => p !== user?.profilePhoto));
  }

  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest) {
  const id = getId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { photo, action, index } = body;

  const user = await prisma.user.findUnique({ where: { id }, select: { photos: true } });
  let photos: string[] = Array.isArray(user?.photos) ? [...user!.photos] : [];

  if (action === "add") {
    if (!photo || typeof photo !== "string") {
      return NextResponse.json({ error: "Photo URL required" }, { status: 400 });
    }
    if (photo.startsWith("data:")) {
      return NextResponse.json({ error: "Direct base64 uploads disabled" }, { status: 400 });
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

  try {
    await prisma.user.update({ where: { id }, data: { photos } });
  } catch (e: any) {
    console.error("Photos DB update failed:", e?.message || e);
    return NextResponse.json({ error: "Database error: " + (e?.message || "unknown") }, { status: 500 });
  }

  return NextResponse.json({ photos, count: photos.length });
}
