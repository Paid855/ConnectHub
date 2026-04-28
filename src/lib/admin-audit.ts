import { prisma } from "@/lib/db";

interface LogParams {
  adminId: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details?: string;
  ip?: string;
  userAgent?: string;
}

export async function logAdminAction(params: LogParams): Promise<void> {
  try {
    await prisma.adminLog.create({ data: params });
  } catch (e) {
    console.error("Audit log write failed:", e);
  }
}

export async function logLoginAttempt(email: string, ip: string, success: boolean, userAgent?: string): Promise<void> {
  try {
    await prisma.adminLoginAttempt.create({ data: { email, ip, success, userAgent } });
  } catch (e) {
    console.error("Login attempt log failed:", e);
  }
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
