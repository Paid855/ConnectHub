import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const url = new URL(req.url);
  const callId = url.searchParams.get("callId");
  if (!callId) return NextResponse.json({ error: "No callId" }, { status: 400 });

  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ status: call.status, callId: call.id });
}
