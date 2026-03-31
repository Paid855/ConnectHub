"use client";
import { useState } from "react";
import Link from "next/link";
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
    if (!email) { setError("Enter your email"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"request", email }) });
    const d = await res.json();
    if (res.ok) { setSecQ(d.securityQuestion || ""); setStep(d.hasSecurityQuestion ? 2 : 3); }
    else setError(d.error || "Failed");
    setLoading(false);
  };

  const verifySec = async () => {
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"verify_security", email, securityAnswer:secA }) });
    if (res.ok) setStep(3);
    else { const d = await res.json(); setError(d.error || "Wrong answer"); }
    setLoading(false);
  };

  const verifyCode = async () => {
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"verify_code", email, code }) });
    if (res.ok) setStep(4);
    else { const d = await res.json(); setError(d.error || "Invalid code"); }
    setLoading(false);
  };

  const resetPwd = async () => {
    if (newPwd.length < 6) { setError("Min 6 characters"); return; }
    if (newPwd !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"reset", email, code, newPassword:newPwd }) });
    if (res.ok) setStep(5);
    else { const d = await res.json(); setError(d.error || "Failed"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center"><span className="text-white text-xl">💕</span></div>
          <span className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">ConnectHub</span>
        </Link>
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          {step === 5 ? (
            <div className="text-center"><div className="text-5xl mb-4">✅</div><h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2><p className="text-gray-500 text-sm mb-6">You can now sign in with your new password.</p><Link href="/login" className="inline-block px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold">Sign In</Link></div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-500 text-sm mb-6">{step===1?"Enter your email":step===2?"Answer security question":step===3?"Enter the code sent to your email":"Set new password"}</p>
              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              {step===1 && (<><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm mb-4" placeholder="Your email address" /><button onClick={requestReset} disabled={loading} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm disabled:opacity-60">{loading?"Sending...":"Continue"}</button></>)}
              {step===2 && (<><p className="text-sm font-medium text-gray-700 mb-2">{secQ}</p><input value={secA} onChange={e=>setSecA(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm mb-4" placeholder="Your answer" /><button onClick={verifySec} disabled={loading} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm disabled:opacity-60">{loading?"Checking...":"Verify"}</button></>)}
              {step===3 && (<><input value={code} onChange={e=>setCode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm mb-4 text-center text-2xl tracking-widest" placeholder="000000" maxLength={6} /><button onClick={verifyCode} disabled={loading} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm disabled:opacity-60">{loading?"Verifying...":"Verify Code"}</button></>)}
              {step===4 && (<><input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm mb-3" placeholder="New password (min 6 chars)" /><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm mb-4" placeholder="Confirm password" /><button onClick={resetPwd} disabled={loading} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm disabled:opacity-60">{loading?"Resetting...":"Reset Password"}</button></>)}
            </>
          )}
          {step < 5 && <p className="text-center text-gray-500 text-sm mt-6">Remember your password? <Link href="/login" className="text-rose-600 font-semibold hover:underline">Sign In</Link></p>}
        </div>
      </div>
    </div>
  );
}
