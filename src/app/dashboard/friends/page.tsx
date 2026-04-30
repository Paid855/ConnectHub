"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Users, UserPlus, UserCheck, UserX, MessageCircle, Shield, Crown, Gem, Search, Heart } from "lucide-react";
import Link from "next/link";

export default function FriendsPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [tab, setTab] = useState<"friends"|"requests"|"sent">("friends");
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/friends");
      const d = await res.json();
      // Unwrap nested objects - API returns {user:{...}} for friends/requests and {friend:{...}} for sent
      setFriends((d.friends||[]).map((f:any) => ({ ...f.user, friendRecordId: f.id, createdAt: f.createdAt })).filter((f:any) => f.id));
      setRequests((d.requests||[]).map((r:any) => ({ ...r.user, friendRecordId: r.id, createdAt: r.createdAt })).filter((r:any) => r.id));
      setSent((d.sent||[]).map((s:any) => ({ ...s.friend, friendRecordId: s.id, createdAt: s.createdAt })).filter((s:any) => s.id));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    const handleRefresh = () => load();
    window.addEventListener("connecthub:refresh", handleRefresh);
    return () => { clearInterval(i); window.removeEventListener("connecthub:refresh", handleRefresh); };
  }, []);

  const accept = async (userId: string) => {
    await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendId: userId, action: "accept" }) });
    load();
  };
  const reject = async (userId: string) => {
    await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendId: userId, action: "reject" }) });
    load();
  };

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;

  const tabs = [
    { k: "friends" as const, label: "Friends", count: friends.length, icon: Users },
    { k: "requests" as const, label: "Requests", count: requests.length, icon: UserPlus },
    { k: "sent" as const, label: "Sent", count: sent.length, icon: Heart },
  ];

  const currentList = tab === "friends" ? friends : tab === "requests" ? requests : sent;
  const filtered = currentList.filter(p => !search || (p.name||"").toLowerCase().includes(search.toLowerCase()));

  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className={"text-2xl sm:text-3xl font-extrabold " + (dc?"text-white":"text-gray-900")}>
          My <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Connections</span>
        </h1>
        <p className={"text-sm mt-1 " + (dc?"text-gray-500":"text-gray-500")}>{friends.length} friend{friends.length!==1?"s":""} · {requests.length} pending request{requests.length!==1?"s":""}</p>
      </div>

      {/* Tabs */}
      <div className={"flex gap-1 mb-6 rounded-xl p-1 " + (dc?"bg-gray-800":"bg-gray-100")}>
        {tabs.map(t => (
          <button key={t.k} onClick={()=>setTab(t.k)} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all " + (tab===t.k?(dc?"bg-gray-700 text-white shadow":"bg-white text-gray-900 shadow-sm"):(dc?"text-gray-500":"text-gray-500"))}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded-full " + (tab===t.k?"bg-rose-500 text-white":(dc?"bg-gray-600 text-gray-400":"bg-gray-200 text-gray-500"))}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={"flex items-center gap-2 rounded-xl px-4 py-3 border mb-4 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200")}>
        <Search className={"w-4 h-4 " + (dc?"text-gray-500":"text-gray-400")} />
        <input className={"bg-transparent border-none outline-none text-sm w-full " + (dc?"text-white placeholder:text-gray-500":"text-gray-900 placeholder:text-gray-400")} placeholder="Search connections..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className={"rounded-2xl border p-10 text-center " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Users className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} />
          <h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>
            {tab==="friends"?"No friends yet":tab==="requests"?"No pending requests":"No sent requests"}
          </h3>
          <p className={"text-sm mt-1 " + (dc?"text-gray-500":"text-gray-500")}>
            {tab==="friends"?"Start swiping to connect with people!":"Check back later"}
          </p>
          {tab==="friends" && <Link href="/dashboard/browse" className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-bold">Browse People</Link>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p: any) => (
            <div key={p.id} className={"flex items-center gap-3 p-3 rounded-2xl border transition-all " + (dc?"bg-gray-800 border-gray-700 hover:bg-gray-700/50":"bg-white border-gray-100 hover:bg-gray-50 hover:shadow-sm")}>
              <Link href={"/dashboard/user?id="+p.id} className="relative flex-shrink-0">
                {p.profilePhoto ? (
                  <img src={p.profilePhoto} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">{p.name?.[0]||"?"}</div>
                )}
                {isOnline(p.lastSeen) && <div className={"absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 " + (dc?"border-gray-800":"border-white")} />}
              </Link>
              <Link href={"/dashboard/user?id="+p.id} className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={"font-bold text-sm truncate " + (dc?"text-white":"text-gray-900")}>{p.name||"User"}</p>
                  {p.verified && <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                  {p.tier==="gold" && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                  {p.tier==="premium" && <Gem className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />}
                </div>
                <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>
                  {isOnline(p.lastSeen) ? "🟢 Online" : "Offline"}
                </p>
              </Link>
              <div className="flex items-center gap-2">
                {tab === "requests" && (
                  <>
                    <button onClick={()=>accept(p.id)} className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl flex items-center justify-center hover:shadow-lg transition-all"><UserCheck className="w-5 h-5" /></button>
                    <button onClick={()=>reject(p.id)} className={"w-10 h-10 border-2 rounded-xl flex items-center justify-center " + (dc?"border-gray-600 text-gray-400":"border-gray-200 text-gray-400")}><UserX className="w-5 h-5" /></button>
                  </>
                )}
                {tab === "friends" && (
                  <Link href={"/dashboard/messages?chat="+p.id} className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl flex items-center justify-center hover:shadow-lg transition-all">
                    <MessageCircle className="w-5 h-5" />
                  </Link>
                )}
                {tab === "sent" && (
                  <div className="flex items-center gap-2">
                    <span className={"text-xs font-medium px-3 py-1.5 rounded-full " + (dc?"bg-amber-500/20 text-amber-400":"bg-amber-50 text-amber-600")}>Pending</span>
                    {(user?.tier === "plus" || user?.tier === "premium" || user?.tier === "gold") ? (
                      <button onClick={async () => {
                        if (!confirm("Cancel this friend request?")) return;
                        await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendId: p.id, action: "cancel" }) });
                        load();
                      }} className={"w-10 h-10 border-2 rounded-xl flex items-center justify-center hover:bg-red-50 transition-all " + (dc?"border-gray-600 text-red-400 hover:border-red-500":"border-gray-200 text-red-400 hover:border-red-400")}>
                        <UserX className="w-5 h-5" />
                      </button>
                    ) : (
                      <button onClick={() => alert("Upgrade to Plus or Premium to cancel friend requests")} className={"w-10 h-10 border-2 rounded-xl flex items-center justify-center opacity-50 " + (dc?"border-gray-600 text-gray-500":"border-gray-200 text-gray-400")}>
                        <Crown className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
