export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-rose-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-rose-500 rounded-full animate-spin" />
          <div className="absolute inset-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">💕</span>
          </div>
        </div>
        <p className="text-gray-400 text-sm font-medium">Loading ConnectHub...</p>
      </div>
    </div>
  );
}
