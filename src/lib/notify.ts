import { prisma } from "@/lib/db";

export async function createNotification(userId: string, type: string, title: string, message: string, fromUserId?: string) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message, fromUserId }
    });
  } catch (e) {
    console.error("Notification error:", e);
  }
}
