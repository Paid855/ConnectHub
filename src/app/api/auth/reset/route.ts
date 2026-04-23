import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

const resetCodes = new Map<string, { code: string; expires: number }>();

export async function POST(req: NextRequest) {
  const { action, email, code, securityAnswer, newPassword } = await req.json();

  if (action === "request") {
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const rl = rateLimit("reset:" + email, 3, 600000);
    if (!rl.success) return NextResponse.json({ error: "Too many attempts. Wait 10 minutes." }, { status: 429 });

    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: "No account with that email" }, { status: 404 });

    return NextResponse.json({ success: true, hasSecurityQuestion: !!user.securityQuestion, securityQuestion: user.securityQuestion });
  }

  if (action === "verify_security") {
    if (!email || !securityAnswer) return NextResponse.json({ error: "Answer required" }, { status: 400 });
    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.securityAnswer && user.securityAnswer.toLowerCase() !== securityAnswer.toLowerCase().trim()) {
      return NextResponse.json({ error: "Incorrect answer" }, { status: 400 });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodes.set(email.toLowerCase(), { code: resetCode, expires: Date.now() + 10 * 60 * 1000 });

    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: "mail.privateemail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER || "noreply@connecthub.love",
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: '"ConnectHub" <noreply@connecthub.love>',
        to: email,
        subject: "Your Password Reset Code — ConnectHub",
        html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:0;">
          <div style="background:linear-gradient(135deg,#e11d48,#ec4899);padding:40px 30px;border-radius:16px 16px 0 0;text-align:center;">
            <h1 style="color:white;font-size:28px;margin:0;">ConnectHub</h1>
            <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Password Reset Request</p>
          </div>
          <div style="background:white;padding:40px 30px;border:1px solid #f3f4f6;border-top:none;border-radius:0 0 16px 16px;">
            <p style="color:#374151;font-size:15px;margin:0 0 20px;">Hi there! Here is your password reset code:</p>
            <div style="background:linear-gradient(135deg,#fff1f2,#fce7f3);padding:24px;border-radius:12px;text-align:center;border:2px dashed #fda4af;">
              <span style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#e11d48;">${resetCode}</span>
            </div>
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:16px 0 0;">This code expires in 10 minutes. Do not share it with anyone.</p>
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
            <p style="color:#9ca3af;font-size:11px;text-align:center;">If you did not request this, please ignore this email.</p>
          </div>
        </div>`
      });
    } catch (e) { console.error("Reset email error:", e); }

    return NextResponse.json({ codeSent: true });
  }

  if (action === "verify_code") {
    if (!email || !code) return NextResponse.json({ error: "Code required" }, { status: 400 });
    const stored = resetCodes.get(email.toLowerCase());
    if (!stored || Date.now() > stored.expires) return NextResponse.json({ error: "Code expired" }, { status: 400 });
    if (stored.code !== code) return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    return NextResponse.json({ verified: true });
  }

  if (action === "reset") {
    if (!email || !code || !newPassword) return NextResponse.json({ error: "All fields required" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    const stored = resetCodes.get(email.toLowerCase());
    if (!stored || stored.code !== code) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.updateMany({ where: { email: email.toLowerCase() }, data: { password: hashed } });
    resetCodes.delete(email.toLowerCase());
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
