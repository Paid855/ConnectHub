import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const adminEmail = url.searchParams.get("admin");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const where: any = {};
  if (action) where.action = action;
  if (adminEmail) where.adminEmail = { contains: adminEmail, mode: "insensitive" };

  const [logs, total, loginAttempts] = await Promise.all([
    prisma.adminLog.findMany({
      where, orderBy: { createdAt: "desc" }, take: limit, skip: offset
    }),
    prisma.adminLog.count({ where }),
    prisma.adminLoginAttempt.findMany({
      orderBy: { createdAt: "desc" }, take: 50
    })
  ]);

  return NextResponse.json({ logs, total, loginAttempts });
}
