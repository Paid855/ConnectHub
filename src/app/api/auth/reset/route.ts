import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { sendResetCode } from "@/lib/email";

const resetCodes: Record<string, { code: string; expires: number }> = {};

function generateCode(): string { return Math.floor(100000 + Math.random() * 900000).toString(); }
function maskEmail(e: string): string { const [n, d] = e.split("@"); return n[0] + "***" + n[n.length - 1] + "@" + d; }
function maskPhone(p: string): string { if (!p || p.length < 4) return ""; return "***" + p.slice(-4); }

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const { step, email, securityAnswer, code, newPassword } = body;

  if (step === "verify") {
    if (!email?.trim()) return NextResponse.json({ error: "Enter your email" }, { status: 400 });
    try {
      const user = await (prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } }));
      if (!user) return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
      if (!user.securityQuestion || !user.securityAnswer) return NextResponse.json({ error: "No security question set. Contact support." }, { status: 400 });
      return NextResponse.json({ question: user.securityQuestion, maskedEmail: maskEmail(user.email), maskedPhone: maskPhone(user.phone || "") });
    } catch (e) {
      console.error("Reset verify:", e);
      return NextResponse.json({ error: "Could not connect to database. Please try again." }, { status: 500 });
    }
  }

  if (step === "answer") {
    if (!email || !securityAnswer) return NextResponse.json({ error: "Please enter your answer" }, { status: 400 });
    try {
      const user = await (prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } }));
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      if (!user.securityAnswer || user.securityAnswer.toLowerCase().trim() !== securityAnswer.toLowerCase().trim()) {
        return NextResponse.json({ error: "Incorrect answer. Please try again." }, { status: 401 });
      }
      const verifyCode = generateCode();
      resetCodes[email.toLowerCase().trim()] = { code: verifyCode, expires: Date.now() + 10 * 60 * 1000 };
      const emailSent = await sendResetCode(user.email, verifyCode, user.name);
      return NextResponse.json({
        verified: true, maskedEmail: maskEmail(user.email), maskedPhone: maskPhone(user.phone || ""),
        emailSent, message: emailSent ? "Code sent to your email!" : "Could not send email. Use code below.",
        _testCode: emailSent ? undefined : verifyCode
      });
    } catch (e) {
      console.error("Reset answer:", e);
      return NextResponse.json({ error: "Database connection error. Try again." }, { status: 500 });
    }
  }

  if (step === "verifyCode") {
    if (!email || !code) return NextResponse.json({ error: "Enter the verification code" }, { status: 400 });
    const stored = resetCodes[email.toLowerCase().trim()];
    if (!stored) return NextResponse.json({ error: "No code found. Start over." }, { status: 400 });
    if (Date.now() > stored.expires) { delete resetCodes[email.toLowerCase().trim()]; return NextResponse.json({ error: "Code expired." }, { status: 400 }); }
    if (stored.code !== code.trim()) return NextResponse.json({ error: "Invalid code." }, { status: 401 });
    return NextResponse.json({ codeVerified: true });
  }

  if (step === "reset") {
    if (!email || !newPassword) return NextResponse.json({ error: "Password required" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "Min 6 characters" }, { status: 400 });
    const stored = resetCodes[email.toLowerCase().trim()];
    if (!stored) return NextResponse.json({ error: "Session expired. Start over." }, { status: 400 });
    try {
      const hashed = await bcrypt.hash(newPassword, 12);
      await (prisma.user.update({ where: { email: email.toLowerCase().trim() }, data: { password: hashed } }));
      delete resetCodes[email.toLowerCase().trim()];
      return NextResponse.json({ success: true });
    } catch (e) {
      console.error("Reset pw:", e);
      return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
