"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Shield, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Check, KeyRound, Smartphone, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<"email"|"answer"|"code"|"reset"|"done">("email");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [code, setCode] = useState("");
  const [testCode, setTestCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyEmail = async () => {
    if (!email.trim()) { setError("Enter your email address"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ step:"verify", email }) });
      const data = await res.json(); setLoading(false);
      if (!res.ok) { setError(data.error); return; }
      setQuestion(data.question); setMaskedEmail(data.maskedEmail); setMaskedPhone(data.maskedPhone); setStep("answer");
    } catch { setLoading(false); setError("Network error. Try again."); }
  };

  const verifyAnswer = async () => {
    if (!answer.trim()) { setError("Please enter your answer"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ step:"answer", email, securityAnswer:answer }) });
      const data = await res.json(); setLoading(false);
      if (!res.ok) { setError(data.error); return; }
      setMaskedEmail(data.maskedEmail); setMaskedPhone(data.maskedPhone);
      if (data._testCode) setTestCode(data._testCode);
      setStep("code");
    } catch { setLoading(false); setError("Network error. Try again."); }
  };

  const verifyCode = async () => {
    if (!code.trim() || code.length !== 6) { setError("Enter the 6-digit code"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ step:"verifyCode", email, code }) });
      const data = await res.json(); setLoading(false);
      if (!res.ok) { setError(data.error); return; }
      setStep("reset");
    } catch { setLoading(false); setError("Network error. Try again."); }
  };

  const resetPassword = async () => {
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ step:"reset", email, newPassword }) });
      const data = await res.json(); setLoading(false);
      if (!res.ok) { setError(data.error); return; }
      setStep("done");
    } catch { setLoading(false); setError("Network error. Try again."); }
  };

  const steps = ["email","answer","code","reset"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-white p-6">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8"><img src="/logo.png" alt="ConnectHub" className="h-16 w-auto" /></Link>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {step === "done" ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-emerald-500" /></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
              <p className="text-gray-500 mb-6">Your password has been changed successfully. Your account is secure.</p>
              <Link href="/login?reset=true" className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold inline-flex items-center justify-center gap-2 hover:shadow-lg">Sign In Now <ArrowRight className="w-4 h-4" /></Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200"><KeyRound className="w-7 h-7 text-white" /></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h2>
                <p className="text-gray-500 text-sm">
                  {step==="email" && "Enter your registered email to get started"}
                  {step==="answer" && "Answer your security question"}
                  {step==="code" && "Enter the verification code sent to you"}
                  {step==="reset" && "Create a new secure password"}
                </p>
              </div>

              <div className="flex gap-2 mb-6">{steps.map((s,i) => <div key={s} className={"flex-1 h-1.5 rounded-full transition-all duration-500 " + (steps.indexOf(step)>=i?"bg-gradient-to-r from-rose-500 to-pink-500":"bg-gray-200")} />)}</div>

              {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-start gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}</motion.div>}

              {step === "email" && (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><div className="relative"><input type="email" className="w-full px-4 py-3.5 pl-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm" placeholder="Your registered email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verifyEmail()} /><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div></div>
                  <button onClick={verifyEmail} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">{loading?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Finding account...</>:<>Continue <ArrowRight className="w-4 h-4"/></>}</button>
                </div>
              )}

              {step === "answer" && (
                <div className="space-y-4">
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4"><p className="text-xs text-rose-500 font-semibold mb-1">Security Question</p><p className="text-sm font-bold text-rose-800 flex items-center gap-2"><Shield className="w-4 h-4 flex-shrink-0" />{question}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Your Answer</label><input className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm" placeholder="Type your answer" value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verifyAnswer()} autoFocus /></div>
                  <div className="flex gap-3">
                    <button onClick={()=>{setStep("email");setError("");}} className="flex-1 py-3.5 border-2 border-gray-200 rounded-full font-semibold text-gray-600 flex items-center justify-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
                    <button onClick={verifyAnswer} disabled={loading} className="flex-[2] py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">{loading?"Verifying...":"Verify Answer"}</button>
                  </div>
                </div>
              )}

              {step === "code" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2"><Smartphone className="w-4 h-4" /> Verification Code Sent</p>
                    <p className="text-xs text-blue-600">We sent a 6-digit code to:</p>
                    <p className="text-xs text-blue-800 font-bold mt-1">Email: {maskedEmail}</p>
                    {maskedPhone && <p className="text-xs text-blue-800 font-bold">Phone: {maskedPhone}</p>}
                    <p className="text-xs text-blue-500 mt-2">Code expires in 10 minutes</p>
                  </div>

                  {/* Testing helper - remove in production */}
                  {testCode && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs text-amber-700 font-semibold">Testing Mode — Your code: <span className="text-lg font-bold text-amber-900">{testCode}</span></p>
                      <p className="text-[10px] text-amber-500">This will be sent via email/SMS in production</p>
                    </div>
                  )}

                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-Digit Code</label><input type="text" maxLength={6} className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-2xl text-center font-bold tracking-[0.5em]" placeholder="000000" value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g,"").slice(0,6))} onKeyDown={e=>e.key==="Enter"&&code.length===6&&verifyCode()} autoFocus /></div>
                  <div className="flex gap-3">
                    <button onClick={()=>{setStep("answer");setError("");setCode("");}} className="flex-1 py-3.5 border-2 border-gray-200 rounded-full font-semibold text-gray-600 flex items-center justify-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
                    <button onClick={verifyCode} disabled={loading || code.length !== 6} className="flex-[2] py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">{loading?"Verifying...":"Verify Code"}</button>
                  </div>
                </div>
              )}

              {step === "reset" && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /><p className="text-sm text-emerald-700 font-medium">Identity verified! Set your new password.</p></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password</label><div className="relative"><input type={showPw?"text":"password"} className="w-full px-4 py-3.5 pl-11 pr-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm" placeholder="Min 6 characters" value={newPassword} onChange={e=>setNewPassword(e.target.value)} /><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label><div className="relative"><input type={showPw?"text":"password"} className="w-full px-4 py-3.5 pl-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm" placeholder="Re-enter new password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&resetPassword()} /><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div>{confirmPassword&&newPassword===confirmPassword&&newPassword.length>=6&&<p className="text-xs text-emerald-500 mt-1 flex items-center gap-1"><Check className="w-3 h-3"/>Passwords match</p>}{confirmPassword&&newPassword!==confirmPassword&&<p className="text-xs text-red-500 mt-1">Passwords do not match</p>}</div>
                  <button onClick={resetPassword} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">{loading?"Resetting...":"Reset Password"}</button>
                </div>
              )}
            </>
          )}
        </div>
        <p className="text-center mt-6 text-sm text-gray-500">Remember your password? <Link href="/login" className="text-rose-500 font-semibold hover:underline">Sign In</Link></p>
      </motion.div>
    </div>
  );
}
