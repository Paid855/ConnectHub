"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ emailOrUsername: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - romantic visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0"><div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" /><div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" /></div>
        <div className="relative z-10 text-center px-12">
          <div className="text-7xl mb-6">💕</div>
          <h2 className="text-4xl font-bold text-white mb-4">Welcome Back</h2>
          <p className="text-xl text-rose-100 leading-relaxed">Your next meaningful connection is just a login away. We missed you!</p>
          <div className="mt-12 flex justify-center gap-4">
            {["Sarah & James","Priya & Alex","Emma & Carlos"].map((couple,i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/20 flex items-center justify-center text-lg mb-2">💑</div>
                <p className="text-white text-xs font-medium">{couple}</p>
                <p className="text-rose-200 text-[10px]">Found love here</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8"><Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center"><span className="text-white text-xl">💕</span></div>
            <span className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">ConnectHub</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-500 mb-8">Enter your details to access your account</p>

          {error && <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email or Username</label>
              <input type="text" required value={form.emailOrUsername} onChange={e => setForm({ ...form, emailOrUsername: e.target.value })} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 text-sm transition-all" placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-rose-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={show ? "text" : "password"} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 text-sm pr-12 transition-all" placeholder="Enter your password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">{show ? "Hide" : "Show"}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-rose-200 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</> : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-8">
            New to ConnectHub? <Link href="/signup" className="text-rose-600 font-semibold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
