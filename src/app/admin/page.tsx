"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Mail, Eye, EyeOff, KeyRound, ArrowRight, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password || !secretKey) { setError("All fields are required"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, password, secretKey }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push("/admin/dashboard");
    } catch { setError("Network error"); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-6">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg"><Shield className="w-8 h-8 text-white" /></div>
          <h1 className="text-3xl font-bold text-white mb-1">Admin Panel</h1>
          <p className="text-gray-400 text-sm">ConnectHub Administration — Authorized Access Only</p>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">This is a restricted area. Unauthorized access is prohibited and will be logged.</p>
          </div>

          {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">{error}</motion.div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
              <div className="relative">
                <input type="email" className="w-full px-4 py-3.5 pl-11 rounded-xl bg-gray-700 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-red-500 text-sm" placeholder="admin@connecthub.com" value={email} onChange={e=>setEmail(e.target.value)} />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Admin Password</label>
              <div className="relative">
                <input type={showPw?"text":"password"} className="w-full px-4 py-3.5 pl-11 pr-11 rounded-xl bg-gray-700 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-red-500 text-sm" placeholder="Enter admin password" value={password} onChange={e=>setPassword(e.target.value)} />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Secret Access Key</label>
              <div className="relative">
                <input type={showKey?"text":"password"} className="w-full px-4 py-3.5 pl-11 pr-11 rounded-xl bg-gray-700 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-red-500 text-sm" placeholder="Enter secret key" value={secretKey} onChange={e=>setSecretKey(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <button type="button" onClick={()=>setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showKey?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
              </div>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} className="w-full mt-6 py-3.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {loading?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Authenticating...</>:<><Shield className="w-4 h-4"/>Access Admin Panel</>}
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500"><Link href="/" className="text-gray-400 hover:text-white transition-colors">Back to ConnectHub</Link></p>
      </motion.div>
    </div>
  );
}
