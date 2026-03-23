"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Ban, X, Shield } from "lucide-react";

export default function BlockedPage() {
  const { dark } = useUser();
  const dc = dark;
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlocked = async () => {
    try {
      const res = await fetch("/api/block?list=true");
      if (res.ok) { const d = await res.json(); setBlocked(d.blocked || []); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadBlocked(); }, []);

  const unblock = async (userId: string) => {
    await fetch("/api/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockedId: userId }) });
    setBlocked(prev => prev.filter(b => b.id !== userId));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><Ban className={"w-6 h-6 " + (dc?"text-red-400":"text-red-500")} /><h1 className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>Blocked Users</h1><span className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>{blocked.length} blocked</span></div>

      {blocked.length === 0 ? (
        <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Shield className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} />
          <p className={"font-bold mb-1 " + (dc?"text-white":"text-gray-900")}>No blocked users</p>
          <p className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>Users you block will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {blocked.map(u => (
            <div key={u.id} className={"flex items-center gap-3 p-4 rounded-xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
              {u.profilePhoto ? <img src={u.profilePhoto} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold">{u.name?.[0]||"?"}</div>}
              <div className="flex-1 min-w-0">
                <p className={"font-bold " + (dc?"text-white":"text-gray-900")}>{u.name}</p>
                <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>{u.email}</p>
              </div>
              <button onClick={() => unblock(u.id)} className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border " + (dc?"bg-gray-700 border-gray-600 text-gray-300 hover:text-white":"bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900")}><X className="w-4 h-4" /> Unblock</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
