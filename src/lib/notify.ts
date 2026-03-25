import { prisma } from "@/lib/db";

export async function createNotification(userId: string, type: string, title: string, message: string, fromId: string | null) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message: message || "", fromUserId: fromId }
    });
  } catch (e) {
    console.error("Notification error:", e);
  }
}
