import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminAction } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
export async function GET(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;
  const reports = await prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ reports });
}
