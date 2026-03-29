import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id }, select: { hidePhone: true, hideEmail: true, hideDob: true } });
  return NextResponse.json({ hidePhone: user?.hidePhone ?? true, hideEmail: user?.hideEmail ?? true, hideDob: user?.hideDob ?? false });
}

export async function PUT(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const body = await req.json();
  const data: any = {};
  if (body.hidePhone !== undefined) data.hidePhone = body.hidePhone;
  if (body.hideEmail !== undefined) data.hideEmail = body.hideEmail;
  if (body.hideDob !== undefined) data.hideDob = body.hideDob;
  await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ success: true });
}
