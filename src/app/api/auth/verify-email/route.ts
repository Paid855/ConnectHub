import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

// Store verification codes in memory (use Redis in production for scale)
const verificationCodes = new Map<string, { code: string; expires: number; email: string }>();

export async function POST(req: NextRequest) {
  const { action, email, code, userId } = await req.json();

  if (action === "send") {
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Rate limit: 3 verification emails per email per 10 minutes
    const rl = rateLimit("verify_email:" + email, 3, 600000);
    if (!rl.success) return NextResponse.json({ error: "Too many attempts. Wait 10 minutes." }, { status: 429 });

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email.toLowerCase(), {
      code: verifyCode,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      email: email.toLowerCase()
    });

    // Send email
    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
      await transporter.sendMail({
        from: `"ConnectHub" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify your email — ConnectHub",
        html: `<div style="font-family:Arial;max-width:400px;margin:0 auto;padding:30px;background:#fff;border-radius:16px;border:1px solid #ffe0ec;">
          <div style="text-align:center;margin-bottom:20px;"><h1 style="color:#e11d48;margin:0;">ConnectHub</h1></div>
          <h2 style="text-align:center;color:#333;">Verify Your Email</h2>
          <p style="color:#666;text-align:center;">Enter this code to verify your account:</p>
          <div style="background:#f3f4f6;padding:20px;border-radius:12px;text-align:center;font-size:36px;font-weight:bold;letter-spacing:8px;color:#e11d48;margin:20px 0;">${verifyCode}</div>
          <p style="color:#999;font-size:12px;text-align:center;">This code expires in 10 minutes. Don't share it.</p>
        </div>`
      });
    } catch (e) {
      console.error("Email send error:", e);
    }

    return NextResponse.json({ sent: true });
  }

  if (action === "verify") {
    if (!email || !code) return NextResponse.json({ error: "Email and code required" }, { status: 400 });

    const stored = verificationCodes.get(email.toLowerCase());
    if (!stored || Date.now() > stored.expires) {
      return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
    }
    if (stored.code !== code) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Code is valid - clean up
    verificationCodes.delete(email.toLowerCase());

    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
