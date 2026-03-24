"use client";
export function SkeletonCard({ dark }: { dark?: boolean }) {
  const dc = dark;
  return (
    <div className={"rounded-2xl border p-5 animate-pulse " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
      <div className="flex items-center gap-3 mb-4">
        <div className={"w-12 h-12 rounded-full " + (dc?"bg-gray-700":"bg-gray-200")} />
        <div className="flex-1"><div className={"h-4 rounded-full w-32 mb-2 " + (dc?"bg-gray-700":"bg-gray-200")} /><div className={"h-3 rounded-full w-24 " + (dc?"bg-gray-700":"bg-gray-200")} /></div>
      </div>
      <div className={"h-40 rounded-xl mb-3 " + (dc?"bg-gray-700":"bg-gray-200")} />
      <div className={"h-3 rounded-full w-full mb-2 " + (dc?"bg-gray-700":"bg-gray-200")} />
      <div className={"h-3 rounded-full w-2/3 " + (dc?"bg-gray-700":"bg-gray-200")} />
    </div>
  );
}

export function SkeletonList({ count = 5, dark }: { count?: number; dark?: boolean }) {
  const dc = dark;
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={"flex items-center gap-3 p-4 rounded-xl animate-pulse " + (dc?"bg-gray-800":"bg-white")}>
          <div className={"w-12 h-12 rounded-full " + (dc?"bg-gray-700":"bg-gray-200")} />
          <div className="flex-1"><div className={"h-4 rounded-full w-28 mb-2 " + (dc?"bg-gray-700":"bg-gray-200")} /><div className={"h-3 rounded-full w-40 " + (dc?"bg-gray-700":"bg-gray-200")} /></div>
          <div className={"h-4 w-12 rounded-full " + (dc?"bg-gray-700":"bg-gray-200")} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile({ dark }: { dark?: boolean }) {
  const dc = dark;
  return (
    <div className="animate-pulse">
      <div className={"h-44 rounded-t-3xl " + (dc?"bg-gray-700":"bg-gray-200")} />
      <div className={"rounded-b-3xl p-6 pt-20 " + (dc?"bg-gray-800":"bg-white")}>
        <div className={"w-28 h-28 rounded-2xl -mt-32 mb-4 " + (dc?"bg-gray-700":"bg-gray-300")} />
        <div className={"h-6 rounded-full w-40 mb-2 " + (dc?"bg-gray-700":"bg-gray-200")} />
        <div className={"h-4 rounded-full w-64 mb-4 " + (dc?"bg-gray-700":"bg-gray-200")} />
      </div>
    </div>
  );
}
