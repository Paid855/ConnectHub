"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, AtSign } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const HEART_POS = [{e:"💕",l:"10%",x:50,y:620},{e:"💖",l:"25%",x:150,y:680},{e:"💗",l:"40%",x:250,y:710},{e:"💘",l:"55%",x:100,y:650},{e:"💝",l:"70%",x:300,y:730},{e:"❤️",l:"85%",x:200,y:690},{e:"🥰",l:"15%",x:350,y:750},{e:"😍",l:"50%",x:80,y:660},{e:"💑",l:"35%",x:280,y:720},{e:"💏",l:"75%",x:180,y:700}];

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered");
  const banned = params.get("banned");
  const reset = params.get("reset");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!identifier.trim() || !password) { setError("Enter your email/username and password"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ identifier, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); return; }
      router.push("/dashboard");
    } catch { setError("Network error"); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-red-500" />
        <div className="absolute inset-0 opacity-30" style={{backgroundImage:"url('https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1200&fit=crop')", backgroundSize:"cover", backgroundPosition:"center"}} />
        <div className="absolute inset-0 bg-gradient-to-t from-rose-900/80 via-rose-600/40 to-pink-600/60" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {HEART_POS.map((h,i) => (
            <motion.div key={i} className="absolute text-2xl" initial={{x:h.x, y:h.y, opacity:0}} animate={{y:-100, opacity:[0,1,1,0]}} transition={{duration:6+i*0.4, repeat:Infinity, delay:i*0.8, ease:"linear"}} style={{left:h.l}}>
              {h.e}
            </motion.div>
          ))}
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-3"><img src="/logo.png" alt="ConnectHub" className="h-14 w-auto" /></Link>
          <div className="max-w-md">
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">Welcome<br />Back</h2>
            <p className="text-lg text-rose-100 leading-relaxed">Your matches are waiting for you. Sign in to continue your journey to love.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop","https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&fit=crop","https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop"].map((img,i) => <img key={i} src={img} className="w-10 h-10 rounded-full border-2 border-white/50 object-cover" alt="" />)}
            </div>
            <p className="text-rose-100 text-sm">10,000+ members online now</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-b from-white to-rose-50/30">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md">
          <Link href="/" className="lg:hidden flex items-center justify-center mb-8"><img src="/logo.png" alt="ConnectHub" className="h-16 w-auto" /></Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200"><Heart className="w-8 h-8 text-white fill-white" /></div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Sign In</h2>
            <p className="text-gray-500 text-sm">Welcome back to ConnectHub</p>
          </div>

          {registered && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Account created successfully! Sign in to get started.</motion.div>}
          {reset && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Password reset successful! Sign in with your new password.</motion.div>}
          {banned && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">Your account has been suspended. Contact support@connecthub.com</div>}
          {error && <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{error}</motion.div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
              <div className="relative">
                <input className="w-full px-4 py-3.5 pl-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm bg-white" placeholder="Enter email or @username" value={identifier} onChange={e=>setIdentifier(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
                {identifier && !identifier.includes(".") && identifier.includes("@") ? <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /> : <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/reset-password" className="text-xs text-rose-500 hover:text-rose-600 font-semibold hover:underline">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input type={showPw?"text":"password"} className="w-full px-4 py-3.5 pl-11 pr-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm bg-white" placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
              </div>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} className="w-full mt-6 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 hover:-translate-y-0.5">
            {loading?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in...</>:<>Sign In <ArrowRight className="w-4 h-4"/></>}
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">Do not have an account? <Link href="/signup" className="text-rose-500 font-semibold hover:underline">Create Account</Link></p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>}><LoginContent /></Suspense>;
}
