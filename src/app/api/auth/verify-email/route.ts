import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

function getUserId(req: NextRequest) {
  try {
    const c = req.cookies.get("session")?.value;
    if (!c) return null;
    return JSON.parse(c).id || null;
  } catch { return null; }
}

// POST — send verification code (email or phone)
export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const type = body.type || "email";

  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, phone: true, name: true, emailVerified: true, phoneVerified: true }
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  if (type === "phone") {
    if (!user.phone) return NextResponse.json({ error: "No phone number on your account" }, { status: 400 });
    if (user.phoneVerified) return NextResponse.json({ success: true, message: "Phone already verified", verified: true });

    await prisma.user.update({ where: { id }, data: { phoneOtp: otp, phoneOtpExpiry: expiry } });

    // Send OTP via email for now (Twilio SMS coming soon)
    try {
      await sendEmail({
        to: user.email,
        subject: "ConnectHub — Phone Verification Code",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#fff;border-radius:16px;border:1px solid #f3f4f6;">
            <div style="text-align:center;margin-bottom:24px;">
              <span style="font-size:40px;">📱</span>
              <h1 style="font-size:24px;font-weight:800;color:#111;margin:12px 0 4px;">Verify Your Phone</h1>
              <p style="color:#6b7280;font-size:14px;">Hi ${user.name || "there"}, here's your phone verification code for ConnectHub</p>
              <p style="color:#9ca3af;font-size:12px;">We sent this to your email while SMS is being set up</p>
            </div>
            <div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
              <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 8px;letter-spacing:2px;text-transform:uppercase;">Phone Verification Code</p>
              <p style="font-size:36px;font-weight:800;color:#fff;letter-spacing:8px;margin:0;">${otp}</p>
            </div>
            <p style="color:#9ca3af;font-size:12px;text-align:center;">This code expires in 10 minutes.</p>
          </div>
        `
      });
    } catch (e) {
      console.error("Phone verify email error:", e);
      return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Verification code sent to your email (SMS coming soon)" });
  }

  // Email verification
  if (user.emailVerified) return NextResponse.json({ success: true, message: "Email already verified", verified: true });

  await prisma.user.update({ where: { id }, data: { emailOtp: otp, emailOtpExpiry: expiry } });

  try {
    await sendEmail({
      to: user.email,
      subject: "ConnectHub — Verify Your Email",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#fff;border-radius:16px;border:1px solid #f3f4f6;">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:40px;">💕</span>
            <h1 style="font-size:24px;font-weight:800;color:#111;margin:12px 0 4px;">Verify Your Email</h1>
            <p style="color:#6b7280;font-size:14px;">Hi ${user.name || "there"}, enter this code to verify your ConnectHub account</p>
          </div>
          <div style="background:linear-gradient(135deg,#f43f5e,#ec4899);border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
            <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 8px;letter-spacing:2px;text-transform:uppercase;">Your Verification Code</p>
            <p style="font-size:36px;font-weight:800;color:#fff;letter-spacing:8px;margin:0;">${otp}</p>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;">This code expires in 10 minutes.</p>
        </div>
      `
    });
  } catch (e) {
    console.error("Email verify error:", e);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Verification code sent to your email" });
}

// PUT — verify code
export async function PUT(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { code, type = "email" } = await req.json();
  if (!code || code.length !== 6) return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id },
    select: { emailOtp: true, emailOtpExpiry: true, emailVerified: true, phoneOtp: true, phoneOtpExpiry: true, phoneVerified: true }
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (type === "phone") {
    if (user.phoneVerified) return NextResponse.json({ success: true, verified: true });
    if (!user.phoneOtp || !user.phoneOtpExpiry) return NextResponse.json({ error: "No code sent. Request a new one." }, { status: 400 });
    if (new Date() > new Date(user.phoneOtpExpiry)) return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
    if (user.phoneOtp !== code.trim()) return NextResponse.json({ error: "Incorrect code" }, { status: 400 });

    await prisma.user.update({ where: { id }, data: { phoneVerified: true, phoneOtp: null, phoneOtpExpiry: null } });
    return NextResponse.json({ success: true, verified: true, message: "Phone verified!" });
  }

  // Email verification
  if (user.emailVerified) return NextResponse.json({ success: true, verified: true });
  if (!user.emailOtp || !user.emailOtpExpiry) return NextResponse.json({ error: "No code sent. Request a new one." }, { status: 400 });
  if (new Date() > new Date(user.emailOtpExpiry)) return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
  if (user.emailOtp !== code.trim()) return NextResponse.json({ error: "Incorrect code" }, { status: 400 });

  await prisma.user.update({ where: { id }, data: { emailVerified: true, emailOtp: null, emailOtpExpiry: null } });
  return NextResponse.json({ success: true, verified: true, message: "Email verified!" });
}
