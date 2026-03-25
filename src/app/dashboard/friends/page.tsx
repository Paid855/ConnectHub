"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Users, UserPlus, Check, X, Shield, Crown, Gem, Globe, MessageCircle } from "lucide-react";
import Link from "next/link";

type FriendUser = { id:string; name:string; profilePhoto:string|null; tier:string; country:string|null; online:boolean; };

const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;

export default function FriendsPage() {
  const { user } = useUser();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [pending, setPending] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  const loadFriends = async () => {
    const res = await fetch("/api/friends");
    if (res.ok) { const d = await res.json(); setFriends(d.friends||[]); setPending(d.pending||[]); }
    setLoading(false);
  };

  useEffect(() => { loadFriends(); }, []);

  const handleAction = async (friendId: string, action: string) => {
    await fetch("/api/friends", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ friendId, action }) });
    await loadFriends();
  };

  const online = friends.filter(f => f.online);
  const offline = friends.filter(f => !f.online);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Friends</h1><p className="text-sm text-gray-500">{friends.length} friends · {online.length} online</p></div>
        <Link href="/dashboard/browse" className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold border border-rose-200 hover:bg-rose-100"><UserPlus className="w-4 h-4" /> Find Friends</Link>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2"><UserPlus className="w-5 h-5" /> Friend Requests ({pending.length})</h3>
          <div className="space-y-3">
            {pending.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-100">
                <Link href={"/dashboard/user?id="+p.id}>
                  {p.profilePhoto ? <img src={p.profilePhoto} className="w-11 h-11 rounded-full object-cover" /> : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{p.name[0]}</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={"/dashboard/user?id="+p.id} className="text-sm font-bold text-gray-900 hover:text-rose-500 truncate block">{p.name}</Link>
                  <p className="text-xs text-gray-500">wants to be your friend</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(p.id, "accept")} className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                  <button onClick={() => handleAction(p.id, "reject")} className="w-9 h-9 bg-red-100 text-red-500 rounded-full flex items-center justify-center hover:bg-red-200"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {[{k:"all",l:"All ("+friends.length+")"},{k:"online",l:"Online ("+online.length+")"},{k:"offline",l:"Offline ("+offline.length+")"}].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} className={"flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all " + (tab===t.k?"bg-white text-gray-900 shadow-sm":"text-gray-500")}>{t.l}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div> : (
        <>
          {(tab==="all"?friends:tab==="online"?online:offline).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="font-bold text-gray-400 mb-1">{tab==="online"?"No friends online":"No friends yet"}</h3>
              <p className="text-sm text-gray-400 mb-4">{tab==="all"?"Browse profiles and add friends!":"Check back later"}</p>
              {tab==="all" && <Link href="/dashboard/browse" className="text-rose-500 font-semibold text-sm hover:underline">Browse People</Link>}
            </div>
          ) : (
            <div className="space-y-2">
              {(tab==="all"?friends:tab==="online"?online:offline).map(f => (
                <div key={f.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-sm transition-all">
                  <Link href={"/dashboard/user?id="+f.id} className="relative flex-shrink-0">
                    {f.profilePhoto ? <img src={f.profilePhoto} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{f.name[0]}</div>}
                    <div className={"absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white " + (f.online ? "bg-emerald-400" : "bg-gray-300")} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={"/dashboard/user?id="+f.id} className="text-sm font-bold text-gray-900 hover:text-rose-500 flex items-center gap-1.5">
                      {f.name}
                      {f.tier==="verified"&&<Shield className="w-3.5 h-3.5 text-blue-500"/>}
                      {f.tier==="gold"&&<Crown className="w-3.5 h-3.5 text-amber-500"/>}
                      {f.tier==="premium"&&<Gem className="w-3.5 h-3.5 text-rose-500"/>}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={f.online?"text-emerald-500 font-semibold":""}>{f.online?"Online":"Offline"}</span>
                      {f.country && <span className="flex items-center gap-0.5"><Globe className="w-3 h-3"/>{f.country}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/dashboard/messages" className="w-9 h-9 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-100 border border-rose-200"><MessageCircle className="w-4 h-4" /></Link>
                    <button onClick={() => handleAction(f.id, "unfriend")} className="w-9 h-9 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 border border-gray-200"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
