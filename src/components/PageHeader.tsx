"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PageHeader() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => { fetch("/api/auth/me").then(r => { if (r.ok) setLoggedIn(true); }).catch(() => {}); }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center"><span className="text-white text-lg">💕</span></div>
          <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">ConnectHub</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="px-3 py-2 text-sm text-gray-600 hover:text-rose-600 font-medium">Home</Link>
          {loggedIn ? (
            <Link href="/dashboard" className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-bold hover:shadow-lg">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-sm text-gray-600 hover:text-rose-600 font-medium hidden sm:inline">Sign In</Link>
              <Link href="/signup" className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-bold hover:shadow-lg">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
