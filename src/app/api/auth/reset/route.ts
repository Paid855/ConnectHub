import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

async function sendResetEmail(email: string, resetCode: string) {
  const { sendResetCode: sendCode } = require("@/lib/email");
  await sendCode(email, resetCode, "there");
}

export async function POST(req: NextRequest) {
  const { action, email, code, securityAnswer, newPassword } = await req.json();

  // Step 1: Request reset — generate code, store in DB, send email
  if (action === "request") {
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const rl = rateLimit("reset:" + email, 5, 600000);
    if (!rl.success) return NextResponse.json({ error: "Too many attempts. Wait 10 minutes." }, { status: 429 });

    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: "No account with that email" }, { status: 404 });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in database — works across ALL serverless instances
    await prisma.user.update({
      where: { id: user.id },
      data: { resetCode, resetCodeExpires: expires }
    });

    try { await sendResetEmail(email, resetCode); } catch (e) { console.error("Reset email error:", e); }

    return NextResponse.json({ success: true, codeSent: true });
  }

  // Step 2: Verify the 6-digit code
  if (action === "verify_code") {
    if (!email || !code) return NextResponse.json({ error: "Code required" }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!user.resetCode || !user.resetCodeExpires) {
      return NextResponse.json({ error: "No reset code found. Please request a new one." }, { status: 400 });
    }

    if (new Date() > new Date(user.resetCodeExpires)) {
      // Clear expired code
      await prisma.user.update({ where: { id: user.id }, data: { resetCode: null, resetCodeExpires: null } });
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
    }

    if (user.resetCode !== code) {
      return NextResponse.json({ error: "Invalid code. Please check and try again." }, { status: 400 });
    }

    // Code is valid — check if user has security question
    const hasSecQ = !!(user.securityQuestion);

    return NextResponse.json({ verified: true, hasSecurityQuestion: hasSecQ, securityQuestion: user.securityQuestion || "" });
  }

  // Step 3: Verify security answer
  if (action === "verify_security") {
    if (!email || !securityAnswer) return NextResponse.json({ error: "Answer required" }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Make sure code was verified (still exists in DB)
    if (!user.resetCode) return NextResponse.json({ error: "Please verify your code first" }, { status: 400 });

    if (user.securityAnswer && user.securityAnswer.toLowerCase() !== securityAnswer.toLowerCase().trim()) {
      return NextResponse.json({ error: "Incorrect answer. Please try again." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  }

  // Step 4: Reset password
  if (action === "reset") {
    if (!email || !newPassword) return NextResponse.json({ error: "All fields required" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Make sure code was verified
    if (!user.resetCode) return NextResponse.json({ error: "Please verify your code first" }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 12);

    // Update password AND clear the reset code
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetCode: null, resetCodeExpires: null }
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
