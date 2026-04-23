"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, Shield, Key, Lock, CheckCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secQ, setSecQ] = useState("");
  const [secA, setSecA] = useState("");

  const requestReset = async () => {
    if (!email.trim()) { setError("Enter your email"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"request", email:email.trim() }) });
      const d = await res.json();
      if (res.ok) {
        if (d.hasSecurityQuestion) { setSecQ(d.securityQuestion); setStep(2); }
        else { setStep(3); } // Code already sent
      } else { setError(d.error || "Failed to send reset code"); }
    } catch { setError("Network error. Try again."); }
    setLoading(false);
  };

  const verifySec = async () => {
    if (!secA.trim()) { setError("Enter your answer"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"verify_security", email, securityAnswer:secA }) });
      if (res.ok) setStep(3);
      else { const d = await res.json(); setError(d.error || "Wrong answer"); }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const verifyCode = async () => {
    if (code.length !== 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"verify_code", email, code }) });
      if (res.ok) setStep(4);
      else { const d = await res.json(); setError(d.error || "Invalid code"); }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const resetPwd = async () => {
    if (newPwd.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPwd !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"reset", email, code, newPassword:newPwd }) });
      if (res.ok) setStep(5);
      else { const d = await res.json(); setError(d.error || "Failed to reset"); }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const resendCode = async () => {
    setLoading(true); setError("");
    try {
      await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"request", email }) });
      setError(""); setCode("");
    } catch {}
    setLoading(false);
  };

  const steps = [
    { num:1, label:"Email", icon:Mail },
    { num:2, label:"Security", icon:Shield },
    { num:3, label:"Code", icon:Key },
    { num:4, label:"Password", icon:Lock },
    { num:5, label:"Done", icon:CheckCircle },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200"><span className="text-white text-xl">💕</span></div>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">ConnectHub</span>
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          {/* Progress bar */}
          {step < 5 && (
            <div className="flex items-center gap-1 mb-8">
              {[1,2,3,4].map(s => (
                <div key={s} className={"h-1.5 flex-1 rounded-full transition-all " + (s <= step ? "bg-gradient-to-r from-rose-500 to-pink-500" : "bg-gray-100")} />
              ))}
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mb-5">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Password Reset!</h2>
              <p className="text-gray-500 text-sm mb-8">Your password has been changed successfully. You can now sign in.</p>
              <Link href="/login" className="inline-block w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-center hover:shadow-lg transition-all">Sign In Now</Link>
            </div>
          )}

          {/* Step 1: Enter email */}
          {step === 1 && (
            <>
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center mb-5">
                <Mail className="w-8 h-8 text-rose-500" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Forgot Password?</h1>
              <p className="text-gray-500 text-sm mb-6 text-center">Enter your email and we will send you a reset code</p>
              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 text-sm transition-all mb-5" placeholder="you@example.com" />
              <button onClick={requestReset} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm disabled:opacity-60 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Send Reset Code"}
              </button>
            </>
          )}

          {/* Step 2: Security question */}
          {step === 2 && (
            <>
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-5">
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Security Question</h1>
              <p className="text-gray-500 text-sm mb-6 text-center">Answer your security question to receive the code</p>
              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-purple-800">{secQ}</p>
              </div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Answer</label>
              <input value={secA} onChange={e=>setSecA(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 text-sm transition-all mb-5" placeholder="Type your answer" />
              <button onClick={verifySec} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm disabled:opacity-60 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verify & Send Code"}
              </button>
            </>
          )}

          {/* Step 3: Enter code */}
          {step === 3 && (
            <>
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-5">
                <Key className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Enter Code</h1>
              <p className="text-gray-500 text-sm mb-6 text-center">
                We sent a 6-digit code to<br/>
                <span className="font-semibold text-gray-700">{email}</span>
              </p>
              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reset Code</label>
              <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 text-2xl text-center tracking-[0.5em] font-bold transition-all mb-3" placeholder="000000" maxLength={6} inputMode="numeric" />
              <button onClick={resendCode} disabled={loading} className="block mx-auto text-xs text-rose-500 font-semibold mb-5 hover:underline flex items-center gap-1 justify-center">
                <RefreshCw className="w-3 h-3" /> Resend Code
              </button>
              <button onClick={verifyCode} disabled={loading || code.length !== 6} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm disabled:opacity-60 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verify Code"}
              </button>
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-800 text-center">Check your inbox and spam folder. Code expires in 10 minutes.</p>
              </div>
            </>
          )}

          {/* Step 4: New password */}
          {step === 4 && (
            <>
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mb-5">
                <Lock className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">New Password</h1>
              <p className="text-gray-500 text-sm mb-6 text-center">Create a strong password for your account</p>
              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 text-sm transition-all mb-3" placeholder="Min 6 characters" />
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 text-sm transition-all mb-5" placeholder="Re-enter password" />
              {newPwd.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs"><span className={newPwd.length >= 6 ? "text-emerald-500" : "text-gray-300"}>●</span><span className={newPwd.length >= 6 ? "text-emerald-600" : "text-gray-400"}>At least 6 characters</span></div>
                  <div className="flex items-center gap-2 text-xs"><span className={/[A-Z]/.test(newPwd) ? "text-emerald-500" : "text-gray-300"}>●</span><span className={/[A-Z]/.test(newPwd) ? "text-emerald-600" : "text-gray-400"}>One uppercase letter</span></div>
                  <div className="flex items-center gap-2 text-xs"><span className={/\d/.test(newPwd) ? "text-emerald-500" : "text-gray-300"}>●</span><span className={/\d/.test(newPwd) ? "text-emerald-600" : "text-gray-400"}>One number</span></div>
                  <div className="flex items-center gap-2 text-xs"><span className={newPwd === confirm && confirm.length > 0 ? "text-emerald-500" : "text-gray-300"}>●</span><span className={newPwd === confirm && confirm.length > 0 ? "text-emerald-600" : "text-gray-400"}>Passwords match</span></div>
                </div>
              )}
              <button onClick={resetPwd} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm disabled:opacity-60 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Reset Password"}
              </button>
            </>
          )}

          {/* Back to login */}
          {step < 5 && (
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-600 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
