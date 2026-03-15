"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Lock, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !pw) return setError("Enter credentials");
    setError(""); setLoading(true);
    const res = await fetch("/api/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email,password:pw}) });
    if (res.ok) { router.push("/admin/dashboard"); }
    else { setError("Invalid admin credentials"); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25"><Heart className="w-6 h-6 text-white fill-white" /></div>
            <span className="text-2xl font-bold text-white">ConnectHub</span>
            <span className="bg-rose-500/20 text-rose-400 text-xs font-bold px-3 py-1 rounded-full border border-rose-500/30">ADMIN</span>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center"><Shield className="w-5 h-5 text-rose-400" /></div>
            <div><h2 className="text-xl font-bold text-white">Owner Access</h2><p className="text-sm text-slate-400">Manage ConnectHub platform</p></div>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label><input className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500/50 focus:border-transparent outline-none text-sm" placeholder="admin@connecthub.com" value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label><input type="password" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500/50 focus:border-transparent outline-none text-sm" placeholder="Admin password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} /></div>
          </div>
          <button onClick={login} disabled={loading} className="w-full mt-6 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2">{loading?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:"Access Dashboard"}</button>
        </div>
        <p className="text-center mt-6"><Link href="/" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Back to site</Link></p>
      </motion.div>
    </div>
  );
}
