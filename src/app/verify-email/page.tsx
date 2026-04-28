"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, ArrowRight, RefreshCw, CheckCircle, Shield } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [emailCode, setEmailCode] = useState(["","","","","",""]);
  const [phoneCode, setPhoneCode] = useState(["","","","","",""]);
  const [step, setStep] = useState<"email"|"phone"|"done">("email");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const emailRefs = useRef<(HTMLInputElement|null)[]>([]);
  const phoneRefs = useRef<(HTMLInputElement|null)[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user) { window.location.href = "/login"; return; }
      setUserEmail(d.user.email || "");
      setUserPhone(d.user.phone || "");
      if (d.user.emailVerified) { setStep("done"); }
      
      
      else { sendCode("email"); }
    }).catch(() => { window.location.href = "/login"; });
  }, []);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  const handleInput = (idx: number, val: string, type: "email"|"phone") => {
    if (!/^\d?$/.test(val)) return;
    const codes = type === "email" ? [...emailCode] : [...phoneCode];
    const refs = type === "email" ? emailRefs : phoneRefs;
    codes[idx] = val;
    type === "email" ? setEmailCode(codes) : setPhoneCode(codes);
    setError("");
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    if (codes.every(c => c !== "")) autoSubmit(codes.join(""), type);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent, type: "email"|"phone") => {
    const codes = type === "email" ? emailCode : phoneCode;
    const refs = type === "email" ? emailRefs : phoneRefs;
    if (e.key === "Backspace" && !codes[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent, type: "email"|"phone") => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const codes = pasted.split("");
      type === "email" ? setEmailCode(codes) : setPhoneCode(codes);
      autoSubmit(pasted, type);
    }
  };

  const autoSubmit = async (code: string, type: "email"|"phone") => {
    if (code.length !== 6) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type })
      });
      const data = await res.json();
      if (data.verified || data.success) {
        setSuccess(type === "email" ? "Email verified!" : "Phone verified!");
        setTimeout(() => {
          if (type === "email") {
            setStep("done");
          } else {
            setStep("done");
          }
        }, 1500);
      } else {
        setError(data.error || "Invalid code");
      }
    } catch { setError("Network error. Try again."); }
    setLoading(false);
  };

  const sendCode = async (type: "email"|"phone") => {
    setResending(true); setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(type === "email" ? "Code sent to your email!" : "Code sent to your phone!");
        setCountdown(60);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(data.error || "Failed to send code"); }
    } catch { setError("Network error"); }
    setResending(false);
  };

  const maskEmail = (e: string) => {
    const [local, domain] = e.split("@");
    if (!domain) return e;
    return local.slice(0, 2) + "***@" + domain;
  };

  const maskPhone = (p: string) => {
    if (p.length < 6) return p;
    return p.slice(0, 3) + "****" + p.slice(-3);
  };

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-rose-100">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-emerald-200/50">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">You're Verified!</h1>
          <p className="text-gray-500 text-sm mb-6">Your account is secure and ready to go. Start finding your perfect match!</p>
          <button onClick={() => window.location.href = "/dashboard"} className="w-full py-3.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full font-bold text-sm shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all flex items-center justify-center gap-2">
            Start Exploring <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const isEmail = step === "email";
  const codes = isEmail ? emailCode : phoneCode;
  const refs = isEmail ? emailRefs : phoneRefs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-rose-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-rose-200/50">
            {isEmail ? <Mail className="w-8 h-8 text-white" /> : <Phone className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
            {isEmail ? "Verify Your Email" : "Verify Your Phone"}
          </h1>
          <p className="text-gray-500 text-sm">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-gray-700">
              {isEmail ? maskEmail(userEmail) : maskPhone(userPhone)}
            </span>
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-6">
          <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-[11px] text-emerald-700">This keeps your account safe from fake signups</p>
        </div>

        {/* OTP inputs */}
        <div className="flex justify-center gap-2 mb-6">
          {codes.map((digit, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleInput(i, e.target.value, step)}
              onKeyDown={e => handleKeyDown(i, e, step)}
              onPaste={e => handlePaste(e, step)}
              className={"w-12 h-14 text-center text-xl font-extrabold rounded-xl border-2 outline-none transition-all " + (digit ? "border-rose-400 bg-rose-50 text-rose-600" : "border-gray-200 bg-gray-50 text-gray-900") + " focus:border-rose-500 focus:ring-2 focus:ring-rose-200"}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4 font-medium">{error}</p>}
        {success && <p className="text-emerald-500 text-sm text-center mb-4 font-medium">{success}</p>}

        {loading && (
          <div className="flex justify-center mb-4">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Resend */}
        <div className="text-center mb-6">
          {countdown > 0 ? (
            <p className="text-gray-400 text-xs">Resend code in <span className="font-bold text-rose-500">{countdown}s</span></p>
          ) : (
            <button onClick={() => sendCode(step)} disabled={resending} className="text-rose-500 text-xs font-bold hover:text-rose-700 flex items-center gap-1 mx-auto">
              <RefreshCw className={"w-3.5 h-3.5 " + (resending ? "animate-spin" : "")} />
              {resending ? "Sending..." : "Resend Code"}
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 justify-center">
          <div className={"w-8 h-1.5 rounded-full " + (isEmail ? "bg-rose-500" : "bg-emerald-500")} />
          
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Email Verification
        </p>

        {/* Skip for now */}
        <button onClick={() => window.location.replace("/dashboard")} className="block mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600">
          Skip for now
        </button>
      </div>
    </div>
  );
}
