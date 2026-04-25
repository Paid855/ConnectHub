import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET(req: NextRequest) {
  try {
    const transporter = nodemailer.createTransport({
      host: "mail.privateemail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
      },
    });

    const info = await transporter.sendMail({
      from: '"ConnectHub" <' + (process.env.EMAIL_USER || "noreply@connecthub.love") + '>',
      to: process.env.EMAIL_USER || "noreply@connecthub.love",
      subject: "Email Test",
      text: "If you see this, email is working!",
    });

    return NextResponse.json({ success: true, messageId: info.messageId, user: process.env.EMAIL_USER ? "set" : "missing", pass: process.env.EMAIL_PASS ? "set" : "missing" });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, user: process.env.EMAIL_USER ? "set" : "missing", pass: process.env.EMAIL_PASS ? "set" : "missing" });
  }
}
