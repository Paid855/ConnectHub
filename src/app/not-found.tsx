import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="relative mb-6">
          <span className="text-[120px] font-extrabold bg-gradient-to-r from-rose-200 to-pink-200 bg-clip-text text-transparent leading-none">404</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl animate-bounce">💔</span>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-8">Looks like this love connection got lost. Let&apos;s get you back to finding your match!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm hover:shadow-lg hover:shadow-rose-200 transition-all">
            Back to Home
          </Link>
          <Link href="/dashboard" className="px-6 py-3 border-2 border-rose-200 text-rose-600 rounded-full font-bold text-sm hover:bg-rose-50 transition-all">
            Go to Dashboard
          </Link>
        </div>
        <p className="mt-8 text-xs text-gray-400">ConnectHub — Where Love Finds You</p>
      </div>
    </div>
  );
}
