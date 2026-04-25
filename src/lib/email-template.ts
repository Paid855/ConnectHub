// Premium HTML email template for ConnectHub
// Styled like Facebook/Instagram email notifications

export function emailWrapper(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>ConnectHub</title>
  <style>
    body { margin:0; padding:0; background:#f5f5f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; }
    .wrapper { max-width:560px; margin:0 auto; padding:24px 16px; }
    .card { background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06); }
    .header { background:linear-gradient(135deg,#e11d48 0%,#ec4899 50%,#a855f7 100%); padding:32px 32px 28px; text-align:center; }
    .logo-text { color:#ffffff; font-size:26px; font-weight:800; letter-spacing:-0.5px; margin:0; }
    .logo-sub { color:rgba(255,255,255,0.75); font-size:12px; margin:6px 0 0; letter-spacing:0.5px; }
    .body { padding:36px 32px 32px; }
    .greeting { color:#111827; font-size:18px; font-weight:700; margin:0 0 12px; }
    .text { color:#4b5563; font-size:14px; line-height:1.7; margin:0 0 20px; }
    .code-box { background:linear-gradient(135deg,#fff1f2,#fce7f3); border:2px solid #fda4af; border-radius:14px; padding:28px; text-align:center; margin:24px 0; }
    .code { font-size:42px; font-weight:800; letter-spacing:12px; color:#e11d48; font-family:'Courier New',monospace; }
    .btn { display:inline-block; background:linear-gradient(135deg,#e11d48,#ec4899); color:#ffffff !important; text-decoration:none; padding:14px 40px; border-radius:50px; font-size:15px; font-weight:700; text-align:center; box-shadow:0 4px 16px rgba(225,29,72,0.3); }
    .btn-outline { display:inline-block; border:2px solid #e11d48; color:#e11d48 !important; text-decoration:none; padding:12px 36px; border-radius:50px; font-size:14px; font-weight:700; text-align:center; }
    .divider { border:none; border-top:1px solid #f3f4f6; margin:28px 0; }
    .note { color:#9ca3af; font-size:12px; line-height:1.6; text-align:center; margin:0; }
    .footer { padding:24px 32px; text-align:center; }
    .footer-brand { color:#9ca3af; font-size:13px; font-weight:600; margin:0 0 8px; }
    .footer-links { margin:12px 0 0; }
    .footer-links a { color:#9ca3af; font-size:11px; text-decoration:none; margin:0 8px; }
    .footer-links a:hover { color:#e11d48; }
    .footer-text { color:#d1d5db; font-size:10px; margin:16px 0 0; line-height:1.5; }
    .highlight { background:linear-gradient(135deg,#fff1f2,#fce7f3); border-radius:12px; padding:16px 20px; margin:16px 0; border-left:4px solid #e11d48; }
    .highlight p { color:#6b7280; font-size:13px; margin:0; line-height:1.6; }
    .stats-row { display:flex; justify-content:center; gap:24px; margin:20px 0; }
    .stat { text-align:center; }
    .stat-num { color:#e11d48; font-size:20px; font-weight:800; display:block; }
    .stat-label { color:#9ca3af; font-size:10px; text-transform:uppercase; letter-spacing:1px; display:block; margin-top:2px; }
    .badge { display:inline-block; background:linear-gradient(135deg,#e11d48,#ec4899); color:#fff; font-size:10px; font-weight:700; padding:4px 12px; border-radius:50px; letter-spacing:0.5px; }
    .social-row { display:flex; justify-content:center; gap:12px; margin:16px 0; }
    .social-icon { width:32px; height:32px; border-radius:50%; background:#f3f4f6; display:inline-flex; align-items:center; justify-content:center; text-decoration:none; color:#9ca3af; font-size:14px; }
    @media (max-width:600px) {
      .wrapper { padding:12px 8px; }
      .header { padding:24px 20px 20px; }
      .body { padding:28px 20px 24px; }
      .code { font-size:32px; letter-spacing:8px; }
      .btn { padding:12px 32px; font-size:14px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      ${content}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p class="footer-brand">💕 ConnectHub</p>
      <div class="footer-links">
        <a href="https://connecthub.love">Home</a>
        <a href="https://connecthub.love/help">Help</a>
        <a href="https://connecthub.love/privacy">Privacy</a>
        <a href="https://connecthub.love/terms">Terms</a>
      </div>
      <p class="footer-text">
        ConnectHub — Where meaningful connections begin.<br />
        You're receiving this because you have an account at connecthub.love<br />
        © ${new Date().getFullYear()} ConnectHub. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// Password reset code email
export function resetCodeEmail(name: string, code: string) {
  return emailWrapper(`
    <div class="header">
      <h1 class="logo-text">ConnectHub</h1>
      <p class="logo-sub">PASSWORD RESET REQUEST</p>
    </div>
    <div class="body">
      <h2 class="greeting">Hi ${name || "there"} 👋</h2>
      <p class="text">We received a request to reset your password. Use the code below to verify your identity and create a new password.</p>
      
      <div class="code-box">
        <div class="code">${code}</div>
      </div>
      
      <p class="note" style="margin-bottom:20px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      
      <div class="highlight">
        <p>🔒 <strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your account is still secure.</p>
      </div>
    </div>
  `);
}

// Welcome email after signup
export function welcomeEmail(name: string) {
  return emailWrapper(`
    <div class="header">
      <h1 class="logo-text">ConnectHub</h1>
      <p class="logo-sub">WELCOME TO THE COMMUNITY</p>
    </div>
    <div class="body">
      <h2 class="greeting">Welcome, ${name}! 🎉</h2>
      <p class="text">You've just joined the most exciting dating community. Your journey to finding meaningful connections starts now!</p>
      
      <p class="text">Here's what you can do next:</p>
      
      <div class="highlight">
        <p>📸 <strong>Add your best photos</strong> — Profiles with photos get 10x more matches</p>
      </div>
      <div class="highlight">
        <p>✅ <strong>Get verified</strong> — Earn the blue badge and build trust with your matches</p>
      </div>
      <div class="highlight">
        <p>💕 <strong>Start swiping</strong> — Discover people who share your interests and values</p>
      </div>
      
      <div style="text-align:center;margin:28px 0;">
        <a href="https://connecthub.love/dashboard" class="btn">Start Matching Now →</a>
      </div>
      
      <hr class="divider" />
      <p class="note">Need help getting started? Visit our <a href="https://connecthub.love/help" style="color:#e11d48;text-decoration:none;font-weight:600;">Help Center</a> or reply to this email.</p>
    </div>
  `);
}

// New match notification
export function matchEmail(name: string, matchName: string) {
  return emailWrapper(`
    <div class="header">
      <h1 class="logo-text">ConnectHub</h1>
      <p class="logo-sub">NEW MATCH!</p>
    </div>
    <div class="body" style="text-align:center;">
      <div style="font-size:64px;margin:10px 0 20px;">💕</div>
      <h2 class="greeting" style="font-size:24px;">It's a Match!</h2>
      <p class="text" style="text-align:center;">You and <strong>${matchName}</strong> liked each other! Don't be shy — send the first message and start your conversation.</p>
      
      <div style="text-align:center;margin:28px 0;">
        <a href="https://connecthub.love/dashboard/messages" class="btn">Send a Message 💬</a>
      </div>
      
      <hr class="divider" />
      <p class="note">Tip: People who message first are 3x more likely to get a response!</p>
    </div>
  `);
}

// Someone liked you
export function likeEmail(name: string, likerName: string, isSuperLike: boolean) {
  return emailWrapper(`
    <div class="header">
      <h1 class="logo-text">ConnectHub</h1>
      <p class="logo-sub">${isSuperLike ? "SUPER LIKE RECEIVED ⭐" : "SOMEONE LIKES YOU"}</p>
    </div>
    <div class="body" style="text-align:center;">
      <div style="font-size:64px;margin:10px 0 20px;">${isSuperLike ? "⭐" : "❤️"}</div>
      <h2 class="greeting">${isSuperLike ? "You Got a Super Like!" : "Someone Likes You!"}</h2>
      <p class="text" style="text-align:center;"><strong>${likerName}</strong> ${isSuperLike ? "Super Liked" : "liked"} your profile. Check them out and see if you feel the same way!</p>
      
      <div style="text-align:center;margin:28px 0;">
        <a href="https://connecthub.love/dashboard/liked" class="btn">See Who Likes You →</a>
      </div>
    </div>
  `);
}

// New message notification
export function messageEmail(name: string, senderName: string, preview: string) {
  const safePreview = preview.length > 80 ? preview.substring(0, 80) + "..." : preview;
  return emailWrapper(`
    <div class="header">
      <h1 class="logo-text">ConnectHub</h1>
      <p class="logo-sub">NEW MESSAGE</p>
    </div>
    <div class="body">
      <h2 class="greeting">New message from ${senderName} 💬</h2>
      
      <div style="background:#f9fafb;border-radius:16px;padding:20px;margin:20px 0;border:1px solid #f3f4f6;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:40px;height:40px;background:linear-gradient(135deg,#e11d48,#ec4899);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;">${senderName[0]}</div>
          <div>
            <strong style="color:#111827;font-size:14px;">${senderName}</strong>
            <div style="color:#9ca3af;font-size:11px;">Just now</div>
          </div>
        </div>
        <p style="color:#4b5563;font-size:14px;margin:0;padding:12px 16px;background:#fff;border-radius:12px;border:1px solid #f3f4f6;">${safePreview}</p>
      </div>
      
      <div style="text-align:center;margin:24px 0;">
        <a href="https://connecthub.love/dashboard/messages" class="btn">Reply Now</a>
      </div>
      
      <hr class="divider" />
      <p class="note">Respond quickly — fast repliers get 2x more matches!</p>
    </div>
  `);
}

// Gift received
export function giftEmail(name: string, senderName: string, giftEmoji: string, giftName: string, coinsEarned: number) {
  return emailWrapper(`
    <div class="header">
      <h1 class="logo-text">ConnectHub</h1>
      <p class="logo-sub">GIFT RECEIVED!</p>
    </div>
    <div class="body" style="text-align:center;">
      <div style="font-size:72px;margin:10px 0 16px;">${giftEmoji}</div>
      <h2 class="greeting">You Received a ${giftName}!</h2>
      <p class="text" style="text-align:center;"><strong>${senderName}</strong> sent you a gift on ConnectHub. ${coinsEarned > 0 ? `You earned <strong>${coinsEarned} coins</strong>!` : ""}</p>
      
      <div style="text-align:center;margin:28px 0;">
        <a href="https://connecthub.love/dashboard" class="btn">View Gift 🎁</a>
      </div>
    </div>
  `);
}

// Coins purchased
export function coinsPurchasedEmail(name: string, coins: number, amount: string) {
  return emailWrapper(`
    <div class="header">
      <h1 class="logo-text">ConnectHub</h1>
      <p class="logo-sub">PURCHASE CONFIRMATION</p>
    </div>
    <div class="body">
      <h2 class="greeting">Payment Successful! ✅</h2>
      <p class="text">Hi ${name}, your purchase has been confirmed.</p>
      
      <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:14px;padding:24px;text-align:center;margin:20px 0;border:1px solid #fde68a;">
        <div style="font-size:36px;margin-bottom:8px;">💰</div>
        <div style="color:#92400e;font-size:28px;font-weight:800;">${coins.toLocaleString()} Coins</div>
        <div style="color:#b45309;font-size:13px;margin-top:4px;">Amount paid: <strong>${amount}</strong></div>
      </div>
      
      <p class="text">Your coins are ready to use. Send gifts, boost your profile, and unlock premium features!</p>
      
      <div style="text-align:center;margin:24px 0;">
        <a href="https://connecthub.love/dashboard/coins" class="btn">Use Your Coins</a>
      </div>
      
      <hr class="divider" />
      <p class="note">Questions about your purchase? Contact <a href="mailto:support@connecthub.love" style="color:#e11d48;text-decoration:none;font-weight:600;">support@connecthub.love</a></p>
    </div>
  `);
}

// Plan upgraded
export function upgradeEmail(name: string, plan: string) {
  const planEmoji = plan === "premium" ? "💎" : "⭐";
  const planName = plan === "premium" ? "Premium" : "Plus";
  return emailWrapper(`
    <div class="header">
      <h1 class="logo-text">ConnectHub</h1>
      <p class="logo-sub">PLAN UPGRADED ${planEmoji}</p>
    </div>
    <div class="body" style="text-align:center;">
      <div style="font-size:64px;margin:10px 0 20px;">${planEmoji}</div>
      <h2 class="greeting" style="font-size:24px;">Welcome to ${planName}!</h2>
      <p class="text" style="text-align:center;">Congratulations, ${name}! You now have access to all ${planName} features.</p>
      
      <div style="text-align:left;margin:20px 0;">
        ${plan === "premium" ? `
          <div class="highlight"><p>👁️ <strong>See who likes you</strong> — No more guessing</p></div>
          <div class="highlight"><p>⭐ <strong>5 Super Likes/week</strong> — Stand out from the crowd</p></div>
          <div class="highlight"><p>🚀 <strong>Profile boosts</strong> — Get seen by more people</p></div>
          <div class="highlight"><p>✉️ <strong>Read receipts</strong> — Know when they've read your message</p></div>
        ` : `
          <div class="highlight"><p>🚫 <strong>No ads</strong> — Clean, distraction-free experience</p></div>
          <div class="highlight"><p>❤️ <strong>Unlimited likes</strong> — Never run out</p></div>
          <div class="highlight"><p>📡 <strong>Live streaming</strong> — Go live and connect</p></div>
          <div class="highlight"><p>⏪ <strong>Rewind swipes</strong> — Changed your mind? Go back</p></div>
        `}
      </div>
      
      <div style="text-align:center;margin:28px 0;">
        <a href="https://connecthub.love/dashboard" class="btn">Explore ${planName} Features →</a>
      </div>
    </div>
  `);
}

// Verification approved
export function verifiedEmail(name: string) {
  return emailWrapper(`
    <div class="header">
      <h1 class="logo-text">ConnectHub</h1>
      <p class="logo-sub">VERIFICATION APPROVED ✅</p>
    </div>
    <div class="body" style="text-align:center;">
      <div style="font-size:64px;margin:10px 0 20px;">🛡️</div>
      <h2 class="greeting" style="font-size:24px;">You're Verified!</h2>
      <p class="text" style="text-align:center;">Congratulations, ${name}! Your identity has been verified. You now have the trusted blue badge on your profile.</p>
      
      <div class="highlight" style="text-align:left;">
        <p>✅ <strong>Blue verification badge</strong> — visible on your profile and in chats<br/>
        💕 <strong>Higher trust score</strong> — verified profiles get 5x more matches<br/>
        🎥 <strong>Video calls unlocked</strong> — connect face-to-face with matches</p>
      </div>
      
      <div style="text-align:center;margin:28px 0;">
        <a href="https://connecthub.love/dashboard/profile" class="btn">View Your Profile →</a>
      </div>
    </div>
  `);
}
