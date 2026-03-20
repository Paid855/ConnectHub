import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { step, email, securityAnswer, newPassword } = body;

  if (step === "verify") {
    if (!email || !email.trim()) return NextResponse.json({ error: "Enter your email" }, { status: 400 });
    try {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (!user) return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
      if (!user.securityQuestion || !user.securityAnswer) return NextResponse.json({ error: "No security question set. Contact support." }, { status: 400 });
      return NextResponse.json({ question: user.securityQuestion });
    } catch (e) {
      console.error("Reset verify error:", e);
      return NextResponse.json({ error: "Database connection error. Try again." }, { status: 500 });
    }
  }

  if (step === "answer") {
    if (!email || !securityAnswer) return NextResponse.json({ error: "Please enter your answer" }, { status: 400 });
    try {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      if (!user.securityAnswer || user.securityAnswer.toLowerCase().trim() !== securityAnswer.toLowerCase().trim()) {
        return NextResponse.json({ error: "Incorrect answer. Please try again." }, { status: 401 });
      }
      return NextResponse.json({ verified: true });
    } catch (e) {
      console.error("Reset answer error:", e);
      return NextResponse.json({ error: "Database error. Try again." }, { status: 500 });
    }
  }

  if (step === "reset") {
    if (!email || !newPassword) return NextResponse.json({ error: "Password required" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    try {
      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { email: email.toLowerCase().trim() }, data: { password: hashed } });
      return NextResponse.json({ success: true });
    } catch (e) {
      console.error("Reset password error:", e);
      return NextResponse.json({ error: "Could not reset password. Try again." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
