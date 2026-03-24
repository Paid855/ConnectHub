import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const target = userId || JSON.parse(session.value).id;

  const user = await prisma.user.findUnique({ where: { id: target }, select: { photos: true, profilePhoto: true } });
  const photos: string[] = [];
  if (user?.profilePhoto) photos.push(user.profilePhoto);
  if (user?.photos) {
    try { const parsed = JSON.parse(user.photos as string); if (Array.isArray(parsed)) photos.push(...parsed); } catch {}
  }
  return NextResponse.json({ photos: [...new Set(photos)] });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { photo, action, index } = await req.json();

  const user = await prisma.user.findUnique({ where: { id }, select: { photos: true } });
  let photos: string[] = [];
  try { photos = JSON.parse((user?.photos as string) || "[]"); } catch { photos = []; }

  if (action === "add" && photo) {
    if (photos.length >= 6) return NextResponse.json({ error: "Maximum 6 photos allowed" }, { status: 400 });
    photos.push(photo);
  } else if (action === "delete" && typeof index === "number") {
    photos.splice(index, 1);
  }

  await prisma.user.update({ where: { id }, data: { photos: JSON.stringify(photos) } });
  return NextResponse.json({ photos, count: photos.length });
}
