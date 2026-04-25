"use client";
import { useState, useEffect } from "react";
import { Mail, Key, Shield, Lock, CheckCircle, ArrowLeft, RefreshCw, Eye, EyeOff, Heart, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secQ, setSecQ] = useState("");
  const [secA, setSecA] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const requestReset = async () => {
    if (!email.trim()) { setError("Please enter your email address"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", email: email.trim() }) });
      const d = await res.json();
      if (res.ok) setStep(2);
      else setError(d.error || "Failed to send code");
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  const verifyCode = async () => {
    if (code.length !== 6) { setError("Please enter the 6-digit code"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_code", email, code }) });
      const d = await res.json();
      if (res.ok) {
        if (d.hasSecurityQuestion && d.securityQuestion) { setSecQ(d.securityQuestion); setStep(3); }
        else { setSecQ(""); setStep(3); }
      } else setError(d.error || "Invalid code");
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const verifySecurity = async () => {
    if (secQ && !secA.trim()) { setError("Please enter your answer"); return; }
    setLoading(true); setError("");
    if (!secQ) { setStep(4); setLoading(false); return; }
    try {
      const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_security", email, securityAnswer: secA }) });
      const d = await res.json();
      if (res.ok) setStep(4);
      else setError(d.error || "Incorrect answer");
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const resetPwd = async () => {
    if (newPwd.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPwd !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset", email, newPassword: newPwd }) });
      if (res.ok) setStep(5);
      else { const d = await res.json(); setError(d.error || "Failed to reset"); }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const resendCode = async () => {
    setLoading(true); setError("");
    try { await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", email }) }); setCode(""); setError(""); } catch {}
    setLoading(false);
  };

  const images = [
    "https://images.unsplash.com/photo-1516589091380-5d8e87df6999?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1522098543979-ffc7f79a56c4?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=1200&q=80&fit=crop",
  ];

  const titles = [
    { h: "Don't Worry,", h2: "We've Got You", desc: "Enter your email and we'll send you a code to reset your password." },
    { h: "Check Your", h2: "Inbox", desc: "We sent a 6-digit code to your email. Enter it below to continue." },
    { h: "Verify Your", h2: "Identity", desc: "Answer your security question to confirm it's really you." },
    { h: "Create New", h2: "Password", desc: "Choose a strong password to protect your account." },
    { h: "You're All", h2: "Set!", desc: "Your password has been reset successfully. Welcome back!" },
  ];

  const t = titles[step - 1];

  return (
    <div className="min-h-screen flex font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Left — Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={images[step - 1] || images[0]} alt="" className="absolute inset-0 w-full h-full object-cover transition-all duration-700" />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/80 via-pink-900/60 to-purple-900/70" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />

        <div className={"relative z-10 flex flex-col justify-between p-12 transition-all duration-700 " + (mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform">
              <span className="text-2xl">💕</span>
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">ConnectHub</span>
          </a>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6 font-display">
              {t.h}<br /><span className="italic text-rose-200">{t.h2}</span>
            </h1>
            <p className="text-lg text-rose-100/80 leading-relaxed">{t.desc}</p>
          </div>

          <div className="flex items-center gap-3">
            {[{ icon: Shield, text: "Secure Reset" }, { icon: Lock, text: "Encrypted" }, { icon: Heart, text: "Your Privacy Matters" }].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 backdrop-blur rounded-full border border-white/10">
                <b.icon className="w-3.5 h-3.5 text-white/70" />
                <span className="text-[10px] font-medium text-white/70">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className={"flex-1 flex flex-col bg-white transition-all duration-500 " + (mounted ? "opacity-100" : "opacity-0")}>
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100">
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md"><span className="text-lg">💕</span></div>
            <span className="text-lg font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">ConnectHub</span>
          </a>
          {step < 5 && <span className="text-xs font-bold text-gray-400">Step {step} of 4</span>}
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <div className="w-full max-w-md font-body">

            {/* Progress bar */}
            {step < 5 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className={"h-1.5 flex-1 rounded-full transition-all duration-500 " + (s <= step ? "bg-gradient-to-r from-rose-500 to-pink-500" : "bg-gray-100")} />
                  ))}
                </div>
                <div className="flex justify-between">
                  {[{ n: 1, l: "Email", icon: Mail }, { n: 2, l: "Code", icon: Key }, { n: 3, l: "Verify", icon: Shield }, { n: 4, l: "Reset", icon: Lock }].map(s => (
                    <div key={s.n} className="flex flex-col items-center gap-1.5">
                      <div className={"w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 " + (s.n === step ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200/50" : s.n < step ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-300")}>
                        {s.n < step ? <CheckCircle className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                      </div>
                      <span className={"text-[10px] font-semibold " + (s.n === step ? "text-rose-600" : s.n < step ? "text-emerald-600" : "text-gray-300")}>{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
                <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-xs flex-shrink-0">!</span>
                {error}
              </div>
            )}

            {/* ═══ STEP 1: EMAIL ═══ */}
            {step === 1 && (
              <div>
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Mail className="w-8 h-8 text-rose-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center font-display">Forgot Password?</h2>
                <p className="text-gray-400 text-sm mb-7 text-center">No worries! Enter your email and we will send you a reset code.</p>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2"><Mail className="w-4 h-4 text-gray-400" /></div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && requestReset()} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" placeholder="you@example.com" autoFocus />
                  </div>
                </div>

                <button onClick={requestReset} disabled={loading} className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-rose-200/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Send Reset Code"}
                </button>
              </div>
            )}

            {/* ═══ STEP 2: CODE ═══ */}
            {step === 2 && (
              <div>
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Key className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center font-display">Enter Code</h2>
                <p className="text-gray-400 text-sm mb-2 text-center">We sent a 6-digit code to</p>
                <p className="text-rose-600 text-sm font-bold mb-7 text-center">{email}</p>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reset Code</label>
                  <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={e => e.key === "Enter" && verifyCode()} className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white text-3xl text-center tracking-[0.5em] font-bold transition-all" placeholder="000000" maxLength={6} inputMode="numeric" autoFocus />
                </div>

                <button onClick={resendCode} disabled={loading} className="flex items-center gap-1.5 justify-center mx-auto text-xs text-rose-500 font-semibold mb-5 hover:text-rose-600 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Resend Code
                </button>

                <button onClick={verifyCode} disabled={loading || code.length !== 6} className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-rose-200/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verify Code"}
                </button>

                <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs text-amber-700 text-center leading-relaxed">Check your inbox and spam folder. The code expires in 10 minutes.</p>
                </div>
              </div>
            )}

            {/* ═══ STEP 3: SECURITY ═══ */}
            {step === 3 && (
              <div>
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Shield className="w-8 h-8 text-violet-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center font-display">Security Check</h2>

                {secQ ? (
                  <>
                    <p className="text-gray-400 text-sm mb-7 text-center">Answer your security question to verify your identity.</p>

                    <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-5 mb-5">
                      <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wider mb-1.5">Your Security Question</p>
                      <p className="text-sm font-bold text-violet-900">{secQ}</p>
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Answer</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2"><Shield className="w-4 h-4 text-gray-400" /></div>
                        <input value={secA} onChange={e => setSecA(e.target.value)} onKeyDown={e => e.key === "Enter" && verifySecurity()} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 focus:bg-white transition-all" placeholder="Enter your answer" autoFocus />
                      </div>
                    </div>

                    <button onClick={verifySecurity} disabled={loading} className="w-full py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-violet-200/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]">
                      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verify Identity"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-7 text-center">No security question was set on your account.</p>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
                      <p className="text-xs text-amber-700 leading-relaxed">We recommend setting a security question in your profile settings after resetting your password for added protection.</p>
                    </div>
                    <button onClick={() => setStep(4)} className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-rose-200/50 transition-all active:scale-[0.98]">
                      Continue to Reset Password
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ═══ STEP 4: NEW PASSWORD ═══ */}
            {step === 4 && (
              <div>
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Lock className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center font-display">New Password</h2>
                <p className="text-gray-400 text-sm mb-7 text-center">Create a strong password to protect your account.</p>

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2"><Lock className="w-4 h-4 text-gray-400" /></div>
                      <input type={showPwd ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)} className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" placeholder="Min 6 characters" autoFocus />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2"><Lock className="w-4 h-4 text-gray-400" /></div>
                      <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && resetPwd()} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" placeholder="Re-enter your password" />
                      {confirm && newPwd === confirm && <div className="absolute right-4 top-1/2 -translate-y-1/2"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>}
                    </div>
                  </div>
                </div>

                {/* Password strength */}
                {newPwd.length > 0 && (
                  <div className="mb-6 bg-gray-50 rounded-xl p-4 space-y-2">
                    {[
                      { check: newPwd.length >= 6, text: "At least 6 characters" },
                      { check: /[A-Z]/.test(newPwd), text: "One uppercase letter" },
                      { check: /\d/.test(newPwd), text: "One number" },
                      { check: newPwd === confirm && confirm.length > 0, text: "Passwords match" },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className={"w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all " + (r.check ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-400")}>
                          {r.check ? "✓" : "·"}
                        </div>
                        <span className={"text-xs font-medium transition-colors " + (r.check ? "text-emerald-600" : "text-gray-400")}>{r.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={resetPwd} disabled={loading} className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-rose-200/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Lock className="w-4 h-4" /> Reset Password</>}
                </button>
              </div>
            )}

            {/* ═══ STEP 5: SUCCESS ═══ */}
            {step === 5 && (
              <div className="text-center py-4">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20" />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3 font-display">Password Reset!</h2>
                <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">Your password has been changed successfully. You can now sign in with your new password.</p>
                <a href="/login" className="inline-block w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-xl font-bold text-sm text-center hover:shadow-xl hover:shadow-rose-200/50 transition-all active:scale-[0.98]">
                  Sign In Now →
                </a>
                <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <p className="text-xs font-medium">Your matches are waiting for you!</p>
                </div>
              </div>
            )}

            {/* Back to login */}
            {step < 5 && (
              <div className="text-center mt-7">
                <a href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-rose-500 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
