import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { reportedId, reason, details } = await req.json();
  if (!reportedId || !reason) return NextResponse.json({ error: "Reason required" }, { status: 400 });

  // Prevent self-report
  if (reportedId === id) return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });

  // Check for duplicate report
  const existing = await prisma.report.findFirst({
    where: { reporterId: id, reportedId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });
  if (existing) return NextResponse.json({ error: "You already reported this user recently" }, { status: 400 });

  await prisma.report.create({
    data: { reporterId: id, reportedId, reason, details: details || null }
  });

  return NextResponse.json({ success: true, message: "Report submitted. Our team will review it." });
}
