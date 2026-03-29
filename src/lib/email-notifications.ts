import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER || "", pass: process.env.EMAIL_PASS || "" },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;
  try {
    await transporter.sendMail({ from: `"ConnectHub" <${process.env.EMAIL_USER}>`, to, subject, html });
    return true;
  } catch (e) { console.error("Email error:", e); return false; }
};

const template = (title: string, body: string, cta?: string, ctaUrl?: string) => `
<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#fff;border-radius:16px;border:1px solid #ffe0ec;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#e11d48;margin:0;font-size:24px;">ConnectHub</h1>
    <p style="color:#888;font-size:12px;">Connecting Hearts Together</p>
  </div>
  <h2 style="color:#333;font-size:18px;text-align:center;">${title}</h2>
  <div style="color:#555;font-size:14px;line-height:1.6;padding:16px 0;">${body}</div>
  ${cta ? `<div style="text-align:center;padding:16px 0;"><a href="${ctaUrl || 'https://connecthub.love/dashboard'}" style="background:linear-gradient(135deg,#e11d48,#ec4899);color:#fff;padding:12px 32px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:14px;">${cta}</a></div>` : ''}
  <hr style="border:none;border-top:1px solid #ffe0ec;margin:20px 0;" />
  <p style="color:#aaa;font-size:11px;text-align:center;">ConnectHub — Finding meaningful connections</p>
</div>`;

export async function emailNewMessage(toEmail: string, toName: string, fromName: string) {
  return sendEmail(toEmail, `${fromName} sent you a message on ConnectHub`,
    template("New Message!", `<p>Hi ${toName},</p><p><strong>${fromName}</strong> just sent you a message. Don't keep them waiting!</p>`, "Read Message", "https://connecthub.love/dashboard/messages")
  );
}

export async function emailNewMatch(toEmail: string, toName: string, fromName: string) {
  return sendEmail(toEmail, `You have a new match on ConnectHub! 💕`,
    template("It's a Match! 💕", `<p>Hi ${toName},</p><p>Great news! <strong>${fromName}</strong> wants to connect with you. Start a conversation now!</p>`, "Say Hello", "https://connecthub.love/dashboard/messages")
  );
}

export async function emailFriendRequest(toEmail: string, toName: string, fromName: string) {
  return sendEmail(toEmail, `${fromName} wants to be your friend on ConnectHub`,
    template("New Friend Request!", `<p>Hi ${toName},</p><p><strong>${fromName}</strong> sent you a friend request. Check out their profile and connect!</p>`, "View Request", "https://connecthub.love/dashboard/friends")
  );
}

export async function emailGiftReceived(toEmail: string, toName: string, fromName: string, giftEmoji: string, giftName: string) {
  return sendEmail(toEmail, `${fromName} sent you a ${giftEmoji} ${giftName}!`,
    template(`You received a ${giftEmoji} ${giftName}!`, `<p>Hi ${toName},</p><p><strong>${fromName}</strong> sent you a <strong>${giftEmoji} ${giftName}</strong> on ConnectHub! Your coin balance has been updated.</p>`, "View Gifts", "https://connecthub.love/dashboard/coins")
  );
}

export async function emailVerified(toEmail: string, toName: string) {
  return sendEmail(toEmail, `You're verified on ConnectHub! ✅`,
    template("Identity Verified! ✅", `<p>Hi ${toName},</p><p>Congratulations! Your identity has been verified. You now have the verified badge and will get up to 5x more matches!</p>`, "View Profile", "https://connecthub.love/dashboard/profile")
  );
}

export async function emailStoryReply(toEmail: string, toName: string, fromName: string) {
  return sendEmail(toEmail, `${fromName} replied to your story`,
    template("Story Reply!", `<p>Hi ${toName},</p><p><strong>${fromName}</strong> replied to your story. Check your messages to see what they said!</p>`, "View Reply", "https://connecthub.love/dashboard/messages")
  );
}

export async function emailWelcome(toEmail: string, toName: string) {
  return sendEmail(toEmail, `Welcome to ConnectHub! 💕`,
    template("Welcome to ConnectHub! 💕", `
      <p>Hi ${toName},</p>
      <p>Welcome to ConnectHub! We're thrilled to have you join our community of real, verified people looking for meaningful connections.</p>
      <p>Here's how to get started:</p>
      <p>1. <strong>Upload a profile photo</strong> — profiles with photos get 10x more matches</p>
      <p>2. <strong>Get verified</strong> — face scan + ID for the trusted badge</p>
      <p>3. <strong>Add your interests</strong> — helps our system find better matches</p>
      <p>4. <strong>Start swiping!</strong> — your perfect match is waiting</p>
    `, "Complete Your Profile", "https://connecthub.love/dashboard/profile")
  );
}
