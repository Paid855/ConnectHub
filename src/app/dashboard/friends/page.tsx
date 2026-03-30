"use client";
import { useState, useEffect } from "react";
import { useUser, TierBadge } from "../layout";
import { Users, UserPlus, Check, X, MessageCircle, Shield, Clock } from "lucide-react";
import Link from "next/link";

export default function FriendsPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [tab, setTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const res = await fetch("/api/friends"); if (res.ok) { const d = await res.json(); setFriends(d.friends||[]); setRequests(d.requests||[]); setSent(d.sent||[]); } } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleRequest = async (userId, action) => {
    await fetch("/api/friends", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ friendId:userId, action }) });
    load();
  };

  const isOnline = (d) => d ? Date.now() - new Date(d).getTime() < 300000 : false;
  if (!user) return null;
  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;

  const renderAvatar = (u) => u?.profilePhoto ? <img src={u.profilePhoto} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{u?.name?.[0]}</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={"text-2xl font-bold mb-5 " + (dc?"text-white":"text-gray-900")}>Friends</h1>
      <div className={"flex gap-1 mb-5 rounded-xl p-1 " + (dc?"bg-gray-800":"bg-gray-100")}>
        {[["friends","Friends ("+friends.length+")"],["requests","Requests ("+requests.length+")"],["sent","Sent ("+sent.length+")"]].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} className={"flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all " + (tab===k?(dc?"bg-gray-700 text-white":"bg-white text-gray-900 shadow-sm"):(dc?"text-gray-500":"text-gray-500"))}>{l}</button>
        ))}
      </div>

      {tab === "friends" && (friends.length === 0 ? (
        <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Users className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} />
          <p className={"font-bold mb-1 " + (dc?"text-white":"text-gray-900")}>No friends yet</p>
          <p className={"text-sm mb-4 " + (dc?"text-gray-500":"text-gray-400")}>Browse profiles and send friend requests!</p>
          <Link href="/dashboard" className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold">Discover People</Link>
        </div>
      ) : (
        <div className="space-y-2">{friends.map((f) => {
          const u = f.user;
          return (
            <div key={f.id} className={"flex items-center gap-3 p-4 rounded-xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
              <Link href={"/dashboard/user?id=" + u?.id} className="flex-shrink-0">{renderAvatar(u)}</Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={"/dashboard/user?id=" + u?.id} className={"font-bold text-sm hover:text-rose-500 " + (dc?"text-white":"text-gray-900")}>{u?.name}</Link>
                  {u?.verified && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                  <TierBadge tier={u?.tier} />
                </div>
                <p className={"text-xs " + (isOnline(u?.lastSeen)?"text-emerald-500":"text-gray-400")}>{isOnline(u?.lastSeen)?"Online":"Offline"}</p>
              </div>
              <Link href={"/dashboard/messages?user=" + u?.id} className={"p-2.5 rounded-xl border " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-rose-50 border-rose-200 text-rose-500")}><MessageCircle className="w-4 h-4" /></Link>
            </div>
          );
        })}</div>
      ))}

      {tab === "requests" && (requests.length === 0 ? (
        <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}><UserPlus className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} /><p className={"font-bold " + (dc?"text-white":"text-gray-900")}>No pending requests</p></div>
      ) : (
        <div className="space-y-2">{requests.map((r) => (
          <div key={r.id} className={"flex items-center gap-3 p-4 rounded-xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
            <Link href={"/dashboard/user?id=" + r.user?.id} className="flex-shrink-0">{renderAvatar(r.user)}</Link>
            <div className="flex-1">
              <Link href={"/dashboard/user?id=" + r.user?.id} className={"font-bold text-sm hover:text-rose-500 " + (dc?"text-white":"text-gray-900")}>{r.user?.name}</Link>
              <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Wants to be friends</p>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>handleRequest(r.user?.id,"accept")} className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600"><Check className="w-5 h-5" /></button>
              <button onClick={()=>handleRequest(r.user?.id,"reject")} className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-red-100 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>
          </div>
        ))}</div>
      ))}

      {tab === "sent" && (sent.length === 0 ? (
        <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}><Clock className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} /><p className={"font-bold " + (dc?"text-white":"text-gray-900")}>No sent requests</p></div>
      ) : (
        <div className="space-y-2">{sent.map((s) => (
          <div key={s.id} className={"flex items-center gap-3 p-4 rounded-xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
            <Link href={"/dashboard/user?id=" + s.friend?.id} className="flex-shrink-0">{renderAvatar(s.friend)}</Link>
            <div className="flex-1">
              <Link href={"/dashboard/user?id=" + s.friend?.id} className={"font-bold text-sm hover:text-rose-500 " + (dc?"text-white":"text-gray-900")}>{s.friend?.name}</Link>
            </div>
            <span className={"text-xs font-medium px-3 py-1 rounded-full " + (dc?"bg-amber-500/20 text-amber-400":"bg-amber-50 text-amber-600")}>Pending</span>
          </div>
        ))}</div>
      ))}
    </div>
  );
}