import { prisma } from "@/lib/db";

export async function createNotification(userId: string, type: string, title: string, message: string, fromId: string | null) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message: message || "", fromUserId: fromId }
    });

    // Send email notification for important events if user is offline
    if (["message", "friend_request", "like", "gift", "call"].includes(type)) {
      sendOfflineEmail(userId, type, title, message, fromId).catch(e => console.error("Offline email error:", e));
    }
  } catch (e) {
    console.error("Notification error:", e);
  }
}

async function sendOfflineEmail(userId: string, type: string, title: string, message: string, fromId: string | null) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, lastActive: true } });
    if (!user?.email) return;

    // Only email if user has been inactive for 5+ minutes
    if (user.lastActive && Date.now() - new Date(user.lastActive).getTime() < 5 * 60 * 1000) return;

    // Don't spam — check if we sent an email recently (last 30 min)
    const recentNotifs = await prisma.notification.count({
      where: { userId, type, createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } }
    });
    if (recentNotifs > 3) return; // Max 3 emails per type per 30 min

    const fromUser = fromId ? await prisma.user.findUnique({ where: { id: fromId }, select: { name: true } }) : null;
    const senderName = fromUser?.name || "Someone";

    const subjects: Record<string, string> = {
      message: `${senderName} sent you a message on ConnectHub`,
      friend_request: `${senderName} wants to connect with you on ConnectHub`,
      like: `${senderName} liked your profile on ConnectHub`,
      gift: `${senderName} sent you a gift on ConnectHub`,
      call: `You missed a call from ${senderName} on ConnectHub`,
    };

    const emojis: Record<string, string> = {
      message: "💬", friend_request: "👋", like: "❤️", gift: "🎁", call: "📞",
    };

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: "mail.privateemail.com",
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER || "noreply@connecthub.love", pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: '"ConnectHub" <noreply@connecthub.love>',
      to: user.email,
      subject: subjects[type] || title,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#e11d48,#ec4899);padding:30px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:white;font-size:24px;margin:0;">ConnectHub</h1>
        </div>
        <div style="background:white;padding:30px;border:1px solid #f3f4f6;border-top:none;border-radius:0 0 16px 16px;">
          <div style="text-align:center;font-size:48px;margin-bottom:16px;">${emojis[type] || "💕"}</div>
          <h2 style="color:#111;font-size:20px;text-align:center;margin:0 0 8px;">${title}</h2>
          <p style="color:#6b7280;font-size:14px;text-align:center;margin:0 0 24px;">${message}</p>
          <div style="text-align:center;">
            <a href="https://connecthub.love/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#e11d48,#ec4899);color:white;text-decoration:none;border-radius:50px;font-weight:bold;font-size:14px;">Open ConnectHub</a>
          </div>
          <p style="color:#9ca3af;font-size:11px;text-align:center;margin:24px 0 0;">You received this because you have an account on ConnectHub. <a href="https://connecthub.love/dashboard/profile" style="color:#e11d48;">Manage notifications</a></p>
        </div>
      </div>`
    });
  } catch (e) {
    console.error("Offline email send error:", e);
  }
}
