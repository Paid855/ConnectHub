"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, Key, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", secretKey: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.secretKey) { setError("All 3 fields are required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); return; }
      router.push("/admin/dashboard");
    } catch { setError("Network error"); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <img src="/logo.png" alt="ConnectHub" className="w-10 h-10 rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">ConnectHub Administration</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Admin Email</label>
            <div className="relative">
              <input type="email" required className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-rose-500" placeholder="admin@connecthub.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <div className="relative">
              <input type={show?"text":"password"} required className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-rose-500" placeholder="Enter password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{show?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Secret Key</label>
            <div className="relative">
              <input type="password" required className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-rose-500" placeholder="Enter admin secret key" value={form.secretKey} onChange={e => setForm({...form, secretKey: e.target.value})} />
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
