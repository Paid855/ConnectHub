"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email:"", password:"", secretKey:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/admin");
      } else {
        setError(data.error || "Login failed");
      }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4"><span className="text-3xl">💕</span></div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">ConnectHub Administration</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-xl">
          {error && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
              <input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-rose-500 text-sm" placeholder="admin@connecthub.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-rose-500 text-sm" placeholder="Enter admin password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Secret Key</label>
              <input type="password" required value={form.secretKey} onChange={e=>setForm({...form,secretKey:e.target.value})} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-rose-500 text-sm" placeholder="Admin secret key" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-60 transition-all">
              {loading ? "Signing in..." : "Sign In to Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
