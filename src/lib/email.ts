import nodemailer from "nodemailer";
import { resetCodeEmail, welcomeEmail, matchEmail, likeEmail, messageEmail, giftEmail, coinsPurchasedEmail, upgradeEmail, verifiedEmail } from "./email-template";

const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || "noreply@connecthub.love",
    pass: process.env.EMAIL_PASS || "",
  },
});

const FROM = '"ConnectHub" <noreply@connecthub.love>';

export async function sendResetCode(to: string, code: string, name: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject: "Your Password Reset Code — ConnectHub", html: resetCodeEmail(name, code) });
    console.log("[EMAIL] Reset code sent to:", to);
    return true;
  } catch (e: any) { console.error("[EMAIL] Failed:", e?.message); return false; }
}

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    console.log("[Email] Sending welcome email to:", to);
    const info = await transporter.sendMail({
      from: FROM, to,
      subject: "Welcome to ConnectHub - Your account is ready",
      html: welcomeEmail(name),
      text: "Hi " + name + ", welcome to ConnectHub! Your account has been created and you received 20 free coins. Start exploring at https://connecthub.love/dashboard",
      headers: {
        "X-Priority": "3",
        "X-Mailer": "ConnectHub Mailer",
        "List-Unsubscribe": "<mailto:support@connecthub.love?subject=unsubscribe>"
      }
    });
    console.log("[Email] Welcome email sent:", info.messageId);
    return true;
  } catch (e: any) { console.error("[Email] Welcome email failed:", e.message || e); return false; }
}

export async function sendMatchEmail(to: string, name: string, matchName: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject: `ConnectHub: You matched with ${matchName}`, html: matchEmail(name, matchName) });
    return true;
  } catch { return false; }
}

export async function sendLikeEmail(to: string, name: string, likerName: string, isSuperLike = false) {
  try {
    await transporter.sendMail({ from: FROM, to, subject: isSuperLike ? `${likerName} Super Liked you on ConnectHub` : `Someone likes your profile on ConnectHub`, html: likeEmail(name, likerName, isSuperLike) });
    return true;
  } catch { return false; }
}

export async function sendMessageEmail(to: string, name: string, senderName: string, preview: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject: `${senderName} sent you a message 💬`, html: messageEmail(name, senderName, preview) });
    return true;
  } catch { return false; }
}

export async function sendGiftNotification(to: string, name: string, senderName: string, giftEmoji: string, giftName: string, coinsEarned = 0) {
  try {
    await transporter.sendMail({ from: FROM, to, subject: `${senderName} sent you a ${giftEmoji} ${giftName}!`, html: giftEmail(name, senderName, giftEmoji, giftName, coinsEarned) });
    return true;
  } catch { return false; }
}

export async function sendCoinsPurchasedEmail(to: string, name: string, coins: number, amount: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject: `Payment Confirmed — ${coins} coins added! 💰`, html: coinsPurchasedEmail(name, coins, amount) });
    return true;
  } catch { return false; }
}

export async function sendUpgradeEmail(to: string, name: string, plan: string) {
  try {
    const planName = plan === "premium" ? "Premium" : "Plus";
    await transporter.sendMail({ from: FROM, to, subject: `Welcome to ConnectHub ${planName}! ${plan === "premium" ? "💎" : "⭐"}`, html: upgradeEmail(name, plan) });
    return true;
  } catch { return false; }
}

export async function sendVerifiedEmail(to: string, name: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject: "You're Verified! 🛡️ — ConnectHub", html: verifiedEmail(name) });
    return true;
  } catch { return false; }
}


// Generic send email function
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await transporter.sendMail({ from: FROM, to, subject, html });
}
