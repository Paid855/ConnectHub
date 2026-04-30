"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Heart, MessageCircle, Star, Shield, Gift, Bell, Sparkles, Users, Trash2 } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    fetch("/api/notifications").then(r => r.json()).then(d => { setNotifs(d.notifications || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, []);

  const markRead = async (id: string) => { await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read", notificationId: id }) }); setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); };
  const markAllRead = async () => { await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "readAll" }) }); setNotifs(prev => prev.map(n => ({ ...n, read: true }))); };
  const deleteNotif = async (id: string) => { await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", notificationId: id }) }); setNotifs(prev => prev.filter(n => n.id !== id)); };

  const getIcon = (type: string) => {
    const base = "w-10 h-10 rounded-full flex items-center justify-center";
    if (type === "match") return <div className={base + " bg-gradient-to-br from-rose-500 to-pink-500"}><Heart className="w-5 h-5 text-white fill-white" /></div>;
    if (type === "superlike") return <div className={base + " bg-gradient-to-br from-amber-400 to-orange-500"}><Star className="w-5 h-5 text-white fill-white" /></div>;
    if (type === "like") return <div className={base + " bg-gradient-to-br from-pink-400 to-rose-400"}><Heart className="w-5 h-5 text-white" /></div>;
    if (type === "message") return <div className={base + " bg-gradient-to-br from-blue-500 to-cyan-500"}><MessageCircle className="w-5 h-5 text-white" /></div>;
    if (type === "gift") return <div className={base + " bg-gradient-to-br from-purple-500 to-violet-500"}><Gift className="w-5 h-5 text-white" /></div>;
    if (type === "verify") return <div className={base + " bg-gradient-to-br from-emerald-500 to-green-500"}><Shield className="w-5 h-5 text-white" /></div>;
    if (type === "friend") return <div className={base + " bg-gradient-to-br from-sky-500 to-blue-500"}><Users className="w-5 h-5 text-white" /></div>;
    return <div className={base + " bg-gradient-to-br from-gray-400 to-gray-500"}><Bell className="w-5 h-5 text-white" /></div>;
  };

  const getLink = (n: any) => {
    if (n.type === "match" || n.type === "like" || n.type === "superlike") return "/dashboard/liked";
    if (n.type === "message") return "/dashboard/messages" + (n.fromUserId ? "?chat=" + n.fromUserId : "");
    if (n.type === "friend") return "/dashboard/friends";
    if (n.type === "gift") return "/dashboard/wallet";
    if (n.type === "verify") return "/dashboard/verify";
    return "/dashboard";
  };

  const ago = (d: string) => {
    const ms = Date.now() - new Date(d).getTime();
    if (ms < 60000) return "Just now";
    if (ms < 3600000) return Math.floor(ms / 60000) + "m ago";
    if (ms < 86400000) return Math.floor(ms / 3600000) + "h ago";
    if (ms < 604800000) return Math.floor(ms / 86400000) + "d ago";
    return new Date(d).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const unreadCount = notifs.filter(n => !n.read).length;
  const filtered = filter === "all" ? notifs : filter === "unread" ? notifs.filter(n => !n.read) : notifs.filter(n => n.type === filter);

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;

  return (
    <div className={"max-w-2xl mx-auto " + (dc ? "text-white" : "")}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={"text-xl font-bold " + (dc ? "" : "text-gray-900")}>Notifications</h1>
          <p className={"text-sm " + (dc ? "text-gray-400" : "text-gray-500")}>{unreadCount > 0 ? unreadCount + " unread" : "All caught up!"}</p>
        </div>
        {unreadCount > 0 && <button onClick={markAllRead} className={"text-xs font-medium px-3 py-1.5 rounded-lg " + (dc ? "bg-gray-800 text-rose-400" : "bg-rose-50 text-rose-600")}>Mark all read</button>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {[{ k:"all", label:"All", count:notifs.length }, { k:"unread", label:"Unread", count:unreadCount }, { k:"match", label:"Matches" }, { k:"like", label:"Likes" }, { k:"message", label:"Messages" }, { k:"gift", label:"Gifts", "Whispers" }].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} className={"px-3.5 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap " + (filter === f.k ? (dc ? "bg-rose-500/20 border-rose-500/50 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-600") : (dc ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-600"))}>
            {f.label} {f.count !== undefined && <span className="ml-1 opacity-60">{f.count}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={"text-center py-16 rounded-2xl border " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <Sparkles className={"w-12 h-12 mx-auto mb-3 " + (dc ? "text-gray-600" : "text-gray-300")} />
          <p className={"font-medium " + (dc ? "text-gray-400" : "text-gray-500")}>No notifications yet</p>
          <p className={"text-sm mt-1 " + (dc ? "text-gray-600" : "text-gray-400")}>When someone likes, matches, or messages you, it will show here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <Link key={n.id} href={getLink(n)} onClick={() => !n.read && markRead(n.id)} className={"flex items-start gap-3 p-4 rounded-2xl border transition-all group " + (!n.read ? (dc ? "bg-rose-500/5 border-rose-500/20" : "bg-rose-50/50 border-rose-100") : (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"))}>
              <div className="flex-shrink-0">{getIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={"text-sm font-medium " + (!n.read ? (dc ? "text-white" : "text-gray-900") : (dc ? "text-gray-300" : "text-gray-700"))}>{n.title}</p>
                <p className={"text-xs mt-0.5 " + (dc ? "text-gray-500" : "text-gray-500")}>{n.body}</p>
                <p className={"text-[10px] mt-1 " + (dc ? "text-gray-600" : "text-gray-400")}>{ago(n.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!n.read && <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />}
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotif(n.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className={"w-3.5 h-3.5 " + (dc ? "text-gray-500" : "text-gray-400")} /></button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
