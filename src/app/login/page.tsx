"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ emailOrUsername: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); setLoading(false); return; }
      router.push("/dashboard");
    } catch { setError("Network error. Try again."); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <img src="/logo.png" alt="ConnectHub" className="w-20 h-20 mx-auto mb-6 rounded-2xl" />
          <h1 className="text-4xl font-bold text-white mb-4">Welcome Back</h1>
          <p className="text-rose-100 text-lg">Your matches are waiting. Sign in to continue your journey to love.</p>
          <div className="flex items-center justify-center gap-6 mt-10">
            {[{n:"10K+",l:"Members"},{n:"50K+",l:"Matches"},{n:"4.9★",l:"Rating"}].map(s => <div key={s.l} className="text-center"><p className="text-2xl font-bold text-white">{s.n}</p><p className="text-xs text-rose-200">{s.l}</p></div>)}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8"><img src="/logo.png" alt="ConnectHub" className="w-8 h-8 rounded-lg" /><span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span></Link>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in to your account</h2>
          <p className="text-gray-500 text-sm mb-8">Don't have an account? <Link href="/signup" className="text-rose-500 font-semibold hover:underline">Sign up free</Link></p>
          
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
              <div className="relative">
                <input type="text" required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-300" placeholder="Enter email or username" value={form.emailOrUsername} onChange={e => setForm({...form, emailOrUsername: e.target.value})} />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1"><label className="block text-sm font-medium text-gray-700">Password</label><Link href="/reset-password" className="text-xs text-rose-500 font-medium hover:underline">Forgot password?</Link></div>
              <div className="relative">
                <input type={show?"text":"password"} required className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-300" placeholder="Enter password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-6">By signing in you agree to our <Link href="/terms" className="text-rose-500 hover:underline">Terms</Link> and <Link href="/privacy" className="text-rose-500 hover:underline">Privacy Policy</Link></p>
        </div>
      </div>
    </div>
  );
}
