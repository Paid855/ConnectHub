import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { reportedId, reason, details } = await req.json();

  if (!reportedId || !reason) return NextResponse.json({ error: "Reason required" }, { status: 400 });
  if (reportedId === id) return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });

  await prisma.report.create({ data: { reporterId: id, reportedId, reason, details: details || null } });
  return NextResponse.json({ success: true, message: "Report submitted. Our team will review it." });
}
