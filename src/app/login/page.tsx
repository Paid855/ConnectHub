"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Sparkles, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ emailOrUsername: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.emailOrUsername || !form.password) { setError("Please enter your email and password"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); setLoading(false); return; }
      window.location.replace("/dashboard");
    } catch { setError("Network error. Please try again."); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Left — Image side */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80&auto=format&fit=crop" alt="Romantic couple" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/80 via-pink-900/60 to-purple-900/70" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize:"24px 24px" }} />

        <div className={"relative z-10 flex flex-col justify-between p-12 transition-all duration-1000 " + (mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform">
              <span className="text-2xl">💕</span>
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">ConnectHub</span>
          </a>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6 font-display">
              Welcome<br /><span className="italic text-rose-200">Back</span>
            </h1>
            <p className="text-lg text-rose-100/80 leading-relaxed mb-10">
              Your matches are waiting. Sign in to continue your journey to finding meaningful love.
            </p>

            <div className="flex items-center gap-8">
              {[{n:"10M+",l:"Active Users"},{n:"50K+",l:"Matches Made"},{n:"4.9★",l:"App Rating"}].map((s,i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-extrabold text-white">{s.n}</p>
                  <p className="text-xs text-rose-200/70 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["from-rose-400 to-pink-400","from-violet-400 to-purple-400","from-amber-400 to-orange-400"].map((g,i) => (
                <div key={i} className={"w-8 h-8 rounded-full border-2 border-white/30 bg-gradient-to-br " + g + " flex items-center justify-center text-white text-[10px] font-bold"}>
                  {["S","M","A"][i]}
                </div>
              ))}
            </div>
            <p className="text-xs text-rose-200/60">2,847 people found love this week</p>
          </div>
        </div>
      </div>

      {/* Right — Form side */}
      <div className={"flex-1 flex items-center justify-center p-6 sm:p-12 bg-white transition-all duration-700 " + (mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8")}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200/50">
              <span className="text-xl">💕</span>
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">ConnectHub</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-display">Sign In</h2>
            <p className="text-gray-500 text-sm font-body">Welcome back! Enter your details to continue.</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2 font-body">
              <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-xs flex-shrink-0">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 font-body notranslate" translate="no">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email or Username</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><Mail className="w-4 h-4 text-gray-400" /></div>
                <input type="text" className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all placeholder-gray-400" placeholder="Enter email or @username" value={form.emailOrUsername} onChange={e => setForm(f=>({...f, emailOrUsername:e.target.value}))} autoComplete="email" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <a href="/forgot-password" className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><Lock className="w-4 h-4 text-gray-400" /></div>
                <input type={show?"text":"password"} className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all placeholder-gray-400" placeholder="Enter your password" value={form.password} onChange={e => setForm(f=>({...f, password:e.target.value}))} autoComplete="current-password" />
                <button type="button" onClick={()=>setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-rose-200/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium font-body">New to ConnectHub?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <a href="/signup" className="block w-full py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-bold text-center hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/50 transition-all font-body">
            Create an Account
          </a>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {[{icon:Shield,text:"Verified"},{icon:Lock,text:"Encrypted"},{icon:Heart,text:"Real People"}].map((b,i) => (
              <div key={i} className="flex items-center gap-1.5 text-gray-400">
                <b.icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
