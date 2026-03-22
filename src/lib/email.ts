import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
});

export async function sendResetCode(to: string, code: string, name: string) {
  try {
    await transporter.sendMail({
      from: `"ConnectHub" <${process.env.EMAIL_USER}>`,
      to,
      subject: "ConnectHub - Password Reset Code",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#fff;border-radius:16px;border:1px solid #ffe0ec;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="color:#e11d48;margin:0;font-size:28px;">ConnectHub</h1>
            <p style="color:#888;font-size:13px;margin-top:4px;">Connecting Hearts Together</p>
          </div>
          <h2 style="color:#333;font-size:20px;text-align:center;">Password Reset Code</h2>
          <p style="color:#555;font-size:14px;">Hi ${name},</p>
          <p style="color:#555;font-size:14px;">You requested a password reset. Use this code to verify your identity:</p>
          <div style="background:linear-gradient(135deg,#e11d48,#ec4899);border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
            <span style="color:#fff;font-size:36px;font-weight:bold;letter-spacing:8px;">${code}</span>
          </div>
          <p style="color:#888;font-size:12px;text-align:center;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#888;font-size:12px;text-align:center;">If you didn't request this, please ignore this email.</p>
          <hr style="border:none;border-top:1px solid #ffe0ec;margin:20px 0;" />
          <p style="color:#aaa;font-size:11px;text-align:center;">ConnectHub — Finding meaningful connections</p>
        </div>
      `,
    });
    console.log("[EMAIL] Reset code sent to:", to);
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    return false;
  }
}

export async function sendGiftNotification(to: string, name: string, senderName: string, giftEmoji: string, giftName: string) {
  try {
    await transporter.sendMail({
      from: `"ConnectHub" <${process.env.EMAIL_USER}>`,
      to,
      subject: `${senderName} sent you a ${giftEmoji} ${giftName} on ConnectHub!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#fff;border-radius:16px;">
          <h1 style="color:#e11d48;text-align:center;">ConnectHub</h1>
          <div style="text-align:center;font-size:48px;margin:20px 0;">${giftEmoji}</div>
          <h2 style="text-align:center;color:#333;">You received a ${giftName}!</h2>
          <p style="color:#555;text-align:center;">${senderName} sent you a gift. Log in to see your updated coin balance!</p>
        </div>
      `,
    });
    return true;
  } catch { return false; }
}
