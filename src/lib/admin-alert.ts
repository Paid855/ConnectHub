import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 465,
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function checkAndAlertFailedLogins(email: string, ip: string): Promise<void> {
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const failures = await prisma.adminLoginAttempt.count({
      where: { ip, success: false, createdAt: { gte: tenMinAgo } }
    });
    if (failures >= 3) {
      await transporter.sendMail({
        from: '"ConnectHub Security" <support@connecthub.love>',
        to: "support@connecthub.love",
        subject: "🚨 Admin login attack detected",
        html: `
          <h2 style="color:#dc2626">Admin login failures detected</h2>
          <p><strong>Failed attempts:</strong> ${failures} in 10 minutes</p>
          <p><strong>IP address:</strong> ${ip}</p>
          <p><strong>Email tried:</strong> ${email}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p style="color:#666">If this wasn't you, the IP is now rate-limited. Consider rotating ADMIN_SECRET if attacks continue.</p>
        `
      });
    }
  } catch (e) {
    console.error("Alert email failed:", e);
  }
}
