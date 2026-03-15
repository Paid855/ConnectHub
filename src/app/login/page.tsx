"use client";
import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Heart, Eye, EyeOff, Check } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success] = useState(justRegistered ? "Account created! Sign in to continue." : "");

  const handleLogin = async () => {
    if (!email || !password) return setError("Enter email and password");
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email,password}) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push("/dashboard");
    } catch { setError("Network error."); setLoading(false); }
  };

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md">
      <Link href="/" className="lg:hidden flex items-center gap-2 mb-8"><Heart className="w-6 h-6 text-rose-500 fill-rose-500" /><span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span></Link>
      <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome Back</h2>
      <p className="text-gray-500 mb-6 text-sm">Enter your credentials to continue</p>
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2"><Check className="w-4 h-4 flex-shrink-0"/> {success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}
      <div className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="hello@example.com" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><div className="relative"><input type={showPw?"text":"password"} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm pr-12" placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} /><button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw?<EyeOff className="w-5 h-5"/>:<Eye className="w-5 h-5"/>}</button></div></div>
      </div>
      <button onClick={handleLogin} disabled={loading} className="w-full mt-6 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2">{loading?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in...</>:"Sign In"}</button>
      <p className="text-center mt-6 text-sm text-gray-500">No account yet? <Link href="/signup" className="text-rose-500 font-semibold hover:underline">Sign Up</Link></p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-500 to-rose-500 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <Link href="/" className="flex items-center gap-3 mb-12"><div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Heart className="w-5 h-5 fill-white" /></div><span className="text-2xl font-bold">ConnectHub</span></Link>
          <h2 className="text-4xl font-bold mb-4 leading-tight">Welcome Back</h2>
          <p className="text-lg text-purple-100 leading-relaxed">Your matches are waiting. Sign in to continue your journey to finding love.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <Suspense fallback={<div className="text-gray-400">Loading...</div>}><LoginForm /></Suspense>
      </div>
    </div>
  );
}
