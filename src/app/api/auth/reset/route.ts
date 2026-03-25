import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

// Store reset codes in memory
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

    // Send email
    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
      await transporter.sendMail({
        from: `"ConnectHub" <${process.env.EMAIL_USER}>`, to: email,
        subject: "Password Reset Code — ConnectHub",
        html: `<div style="font-family:Arial;max-width:400px;margin:0 auto;padding:30px;"><h2 style="color:#e11d48;text-align:center;">ConnectHub</h2><p style="text-align:center;">Your password reset code:</p><div style="background:#f3f4f6;padding:20px;border-radius:12px;text-align:center;font-size:36px;font-weight:bold;letter-spacing:8px;color:#e11d48;">${resetCode}</div><p style="color:#999;font-size:12px;text-align:center;">Expires in 10 minutes.</p></div>`
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
