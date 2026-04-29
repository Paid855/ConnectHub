"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50 p-4">
      <div className="text-center max-w-md">
        <span className="text-6xl mb-4 block">💔</span>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Something went wrong</h1>
        <p className="text-gray-500 mb-6">Don&apos;t worry, love finds a way! Let&apos;s try that again.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm hover:shadow-lg transition-all">Try Again</button>
          <a href="/" className="px-6 py-3 border-2 border-rose-200 text-rose-600 rounded-full font-bold text-sm hover:bg-rose-50 transition-all">Go Home</a>
        </div>
      </div>
    </div>
  );
}
