import { prisma } from "@/lib/db";

export async function createNotification(userId: string, type: string, title: string, body: string, fromId: string | null) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body: body || "", fromId }
    });
  } catch (e) {
    console.error("Notification error:", e);
  }
}
