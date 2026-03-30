"use client";
import { useState, useEffect } from "react";
import { useUser, TierBadge } from "../layout";
import { Users, UserPlus, Check, X, MessageCircle, Shield, Clock } from "lucide-react";
import Link from "next/link";

export default function FriendsPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [tab, setTab] = useState<"friends"|"requests"|"sent">("friends");
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const res = await fetch("/api/friends"); if (res.ok) { const d = await res.json(); setFriends(d.friends||[]); setRequests(d.requests||[]); setSent(d.sent||[]); } } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRequest = async (userId: string, action: "accept"|"reject") => {
    await fetch("/api/friends", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ friendId:userId, action }) });
    load();
  };

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={"text-2xl font-bold mb-5 " + (dc?"text-white":"text-gray-900")}>Friends</h1>

      <div className={"flex gap-1 mb-5 rounded-xl p-1 " + (dc?"bg-gray-800":"bg-gray-100")}>
        {[
          { k:"friends" as const, l:"Friends ("+friends.length+")", icon:Users },
          { k:"requests" as const, l:"Requests ("+requests.length+")", icon:UserPlus },
          { k:"sent" as const, l:"Sent ("+sent.length+")", icon:Clock },
        ].map(t => (
          <button key={t.k} onClick={()=>setTab(t.k)} className={"flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all " + (tab===t.k?(dc?"bg-gray-700 text-white":"bg-white text-gray-900 shadow-sm"):(dc?"text-gray-500":"text-gray-500"))}><t.icon className="w-4 h-4"/>{t.l}</button>
        ))}
      </div>

      {tab === "friends" && (
        friends.length === 0 ? (
          <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
            <Users className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} />
            <p className={"font-bold mb-1 " + (dc?"text-white":"text-gray-900")}>No friends yet</p>
            <p className={"text-sm mb-4 " + (dc?"text-gray-500":"text-gray-400")}>Browse profiles and send friend requests!</p>
            <Link href="/dashboard" className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg">Discover People</Link>
          </div>
        ) : (
          <div className="space-y-2">{friends.map((f:any) => (
            <div key={f.id} className={"flex items-center gap-3 p-4 rounded-xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
              <Link href={"/dashboard/user?id=" + f.user?.id} className="relative flex-shrink-0">
                {f.user?.profilePhoto ? <img src={f.user.profilePhoto} className="w-12 h-12 rounded-full object-cover"/> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{f.user?.name?.[0]}</div>}
                {isOnline(f.user?.lastSeen) && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"/>}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={"/dashboard/user?id=" + f.user?.id} className={"font-bold text-sm hover:text-rose-500 transition-colors " + (dc?"text-white":"text-gray-900")}>{f.user?.name}</Link>
                  {f.user?.verified && <Shield className="w-3.5 h-3.5 text-blue-500"/>}
                  <TierBadge tier={f.user?.tier}/>
                </div>
                <p className={"text-xs " + (isOnline(f.user?.lastSeen)?"text-emerald-500":"text-gray-400")}>{isOnline(f.user?.lastSeen)?"Online":"Offline"}</p>
              </div>
              <Link href={"/dashboard/messages?user=" + f.user?.id} className={"p-2.5 rounded-xl border " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-rose-50 border-rose-200 text-rose-500")}><MessageCircle className="w-4 h-4"/></Link>
            </div>
          ))}</div>
        )
      )}

      {tab === "requests" && (
        requests.length === 0 ? (
          <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}><UserPlus className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} /><p className={"font-bold " + (dc?"text-white":"text-gray-900")}>No pending requests</p></div>
        ) : (
          <div className="space-y-2">{requests.map((r:any) => (
            <div key={r.id} className={"flex items-center gap-3 p-4 rounded-xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
              <Link href={"/dashboard/user?id=" + r.user?.id} className="flex-shrink-0">
                {r.user?.profilePhoto ? <img src={r.user.profilePhoto} className="w-12 h-12 rounded-full object-cover"/> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{r.user?.name?.[0]}</div>}
              </Link>
              <div className="flex-1">
                <Link href={"/dashboard/user?id=" + r.user?.id} className={"font-bold text-sm hover:text-rose-500 " + (dc?"text-white":"text-gray-900")}>{r.user?.name}</Link>
                <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Wants to be friends</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>handleRequest(r.user?.id,"accept")} className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600"><Check className="w-5 h-5"/></button>
                <button onClick={()=>handleRequest(r.user?.id,"reject")} className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-red-100 hover:text-red-500"><X className="w-5 h-5"/></button>
              </div>
            </div>
          ))}</div>
        )
      )}

      {tab === "sent" && (
        sent.length === 0 ? (
          <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}><Clock className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} /><p className={"font-bold " + (dc?"text-white":"text-gray-900")}>No sent requests</p></div>
        ) : (
          <div className="space-y-2">{sent.map((s:any) => (
            <div key={s.id} className={"flex items-center gap-3 p-4 rounded-xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
              <Link href={"/dashboard/user?id=" + s.friend?.id} className="flex-shrink-0">
                {s.friend?.profilePhoto ? <img src={s.friend.profilePhoto} className="w-12 h-12 rounded-full object-cover"/> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{s.friend?.name?.[0]}</div>}
              </Link>
              <div className="flex-1">
                <Link href={"/dashboard/user?id=" + s.friend?.id} className={"font-bold text-sm hover:text-rose-500 " + (dc?"text-white":"text-gray-900")}>{s.friend?.name}</Link>
              </div>
              <span className={"text-xs font-medium px-3 py-1 rounded-full " + (dc?"bg-amber-500/20 text-amber-400":"bg-amber-50 text-amber-600")}>Pending</span>
            </div>
          ))}</div>
        )
      )}
    </div>
  );
}
