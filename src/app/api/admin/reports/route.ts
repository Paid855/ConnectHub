import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
function isAdmin(req: NextRequest) { try { return JSON.parse(req.cookies.get("admin_session")?.value || "{}").isAdmin === true; } catch { return false; } }
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const reports = await prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ reports });
}
