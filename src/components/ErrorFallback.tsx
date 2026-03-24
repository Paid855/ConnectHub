"use client";
import { Heart, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ErrorFallback({ error, reset }: { error?: Error; reset?: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-6">{error?.message || "An unexpected error occurred."}</p>
        <div className="flex gap-3 justify-center">
          {reset && <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold text-sm hover:shadow-lg"><RefreshCw className="w-4 h-4" /> Try Again</button>}
          <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 rounded-full font-semibold text-sm text-gray-600 hover:bg-gray-50"><ArrowLeft className="w-4 h-4" /> Go Home</Link>
        </div>
      </div>
    </div>
  );
}
