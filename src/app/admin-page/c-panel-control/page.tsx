"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        (() => {
          // Extract slug from current URL path (e.g., /x7fdde2b81ed32ed8-vault-95df8c5e -> slug)
          const slug = window.location.pathname.split("/")[1];
          router.push("/" + slug + "/dashboard");
        })();
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Control Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Authorized access only</p>
        </div>
        <form onSubmit={handleLogin} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-blue-500 focus:outline-none" placeholder="Enter email" />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-10 text-white text-sm focus:border-blue-500 focus:outline-none" placeholder="Enter password" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
