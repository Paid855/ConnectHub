"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Heart, Compass, Search, MessageCircle, Video, Shield, User, LogOut, Menu, X, Crown, HelpCircle, Gem, Sparkles, Rss, Users, Bell, Moon, Sun } from "lucide-react";

type UserData = { id:string; name:string; email:string; username?:string; age:number|null; gender:string|null; lookingFor:string|null; bio:string|null; country:string|null; profilePhoto:string|null; tier:string; verified:boolean; verificationStatus:string; phone:string|null; isPrivate:boolean; interests:string[]; };
const UserCtx = createContext<{ user:UserData|null; reload:()=>void; unread:number; dark:boolean; setDark:(v:boolean)=>void }>({ user:null, reload:()=>{}, unread:0, dark:false, setDark:()=>{} });
export const useUser = () => useContext(UserCtx);

function TierBadge({ tier }: { tier: string }) {
  if (tier === "gold") return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200"><Crown className="w-3 h-3" />Gold</span>;
  if (tier === "premium") return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 border border-rose-200"><Gem className="w-3 h-3" />Premium</span>;
  if (tier === "verified") return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200"><Shield className="w-3 h-3" />Verified</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"><Sparkles className="w-3 h-3" />Basic</span>;
}
export { TierBadge };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData|null>(null);
  const [loading, setLoading] = useState(true);
  const [sideOpen, setSideOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [dark, setDark] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const loadUser = async () => {
    try { const res = await fetch("/api/auth/me"); if (res.status===403) { router.push("/login?banned=true"); return; } const data = await res.json(); if (!data.user) { router.push("/login"); return; } setUser(data.user); } catch { router.push("/login"); }
    finally { setLoading(false); }
  };

  const loadUnread = async () => { try { const res = await fetch("/api/messages"); if (res.ok) { const d = await res.json(); setUnread((d.conversations||[]).reduce((s:number,c:any)=>s+(c.unreadCount||0),0)); } } catch {} };

  const loadNotifications = async () => {
    try { const res = await fetch("/api/notifications"); if (res.ok) { const d = await res.json(); setNotifCount(d.unreadCount||0); setNotifications(d.notifications||[]); } } catch {}
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"readAll" }) });
    setNotifCount(0);
    setNotifications(prev => prev.map(n => ({...n, read:true})));
  };

  useEffect(() => { loadUser(); }, []);
  useEffect(() => {
    if (user) {
      loadUnread(); loadNotifications();
      const i = setInterval(loadUnread, 10000);
      const j = setInterval(loadNotifications, 15000);
      return () => { clearInterval(i); clearInterval(j); };
    }
  }, [user]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("dark") : null;
    if (saved === "true") setDark(true);
  }, []);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    if (typeof window !== "undefined") localStorage.setItem("dark", String(dark));
  }, [dark]);

  const logout = async () => { await fetch("/api/auth/logout", { method:"POST" }); router.push("/"); };

  const nav = [
    { href:"/dashboard", label:"Discover", icon:Compass },
    { href:"/dashboard/browse", label:"Browse", icon:Search },
    { href:"/dashboard/feed", label:"Feed", icon:Rss },
    { href:"/dashboard/friends", label:"Friends", icon:Users },
    { href:"/dashboard/messages", label:"Messages", icon:MessageCircle, badge:unread },
    { href:"/dashboard/video", label:"Video", icon:Video },
    { href:"/dashboard/verify", label:"Verification", icon:Shield },
    { href:"/dashboard/profile", label:"Profile", icon:User },
    { href:"/dashboard/support", label:"Support", icon:HelpCircle },
  ];

  const formatTime = (d: string) => { const diff = Date.now()-new Date(d).getTime(); if(diff<60000) return "Just now"; if(diff<3600000) return Math.floor(diff/60000)+"m ago"; if(diff<86400000) return Math.floor(diff/3600000)+"h ago"; return new Date(d).toLocaleDateString([],{month:"short",day:"numeric"}); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" /></div>;

  return (
    <UserCtx.Provider value={{ user, reload: loadUser, unread, dark, setDark }}>
      <div className={"flex min-h-screen " + (dark?"bg-gray-900":"bg-gray-50")}>
        {/* Sidebar */}
        <aside className={"hidden lg:flex w-[230px] flex-col fixed inset-y-0 left-0 z-40 border-r " + (dark?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Link href="/dashboard" className={"flex items-center gap-2.5 px-5 py-4 border-b " + (dark?"border-gray-700":"border-gray-100")}>
            <img src="/logo.png" alt="ConnectHub" className="h-12 w-auto" />
          </Link>
          {user && (
            <div className={"mx-3 mt-3 mb-1 p-3 rounded-xl border " + (dark?"bg-gray-700/50 border-gray-600":"bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100")}>
              <div className="flex items-center gap-2.5">
                {user.profilePhoto ? <img src={user.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">{user.name[0]}</div>}
                <div className="flex-1 min-w-0"><p className={"text-sm font-bold truncate " + (dark?"text-white":"text-gray-900")}>{user.name.split(" ")[0]}</p><TierBadge tier={user.tier} /></div>
              </div>
            </div>
          )}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            {nav.map(item => {
              const active = pathname === item.href;
              return <Link key={item.href} href={item.href} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " + (active?(dark?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600"):(dark?"text-gray-400 hover:bg-gray-700":"text-gray-600 hover:bg-gray-50"))}>
                <item.icon className={"w-[18px] h-[18px] " + (active?"text-rose-500":(dark?"text-gray-500":"text-gray-400"))} />{item.label}
                {item.badge && item.badge > 0 ? <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span> : null}
              </Link>;
            })}
          </nav>
          {/* Dark mode toggle */}
          <div className={"mx-3 mb-2 flex items-center gap-3 px-3 py-2.5 rounded-xl " + (dark?"bg-gray-700":"bg-gray-50")}>
            <button onClick={() => setDark(!dark)} className="flex items-center gap-3 w-full text-sm font-medium">
              {dark ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px] text-gray-400" />}
              <span className={dark?"text-gray-300":"text-gray-600"}>{dark?"Light Mode":"Dark Mode"}</span>
            </button>
          </div>
          {user && user.tier === "basic" && (
            <div className="mx-3 mb-2"><Link href="/dashboard/upgrade" className="flex items-center gap-2 px-3 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-sm font-bold hover:shadow-lg transition-all"><Crown className="w-5 h-5" /> Upgrade Plan</Link></div>
          )}
          <div className={"px-3 py-3 border-t " + (dark?"border-gray-700":"border-gray-100")}><button onClick={logout} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full " + (dark?"text-gray-400 hover:bg-gray-700":"text-gray-500 hover:bg-gray-50")}><LogOut className="w-[18px] h-[18px]" /> Log Out</button></div>
        </aside>

        {/* Mobile header */}
        <div className={"lg:hidden fixed top-0 left-0 right-0 z-40 backdrop-blur-lg border-b px-4 h-14 flex items-center justify-between " + (dark?"bg-gray-800/95 border-gray-700":"bg-white/95 border-gray-100")}>
          <Link href="/dashboard" className="flex items-center gap-2"><img src="/logo.png" alt="ConnectHub" className="h-10 w-auto" /></Link>
          <div className="flex items-center gap-2">
            {/* Notification bell mobile */}
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2">
              <Bell className={"w-5 h-5 " + (dark?"text-gray-400":"text-gray-600")} />
              {notifCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{notifCount}</span>}
            </button>
            <button onClick={() => setDark(!dark)} className="p-2">{dark?<Sun className="w-5 h-5 text-amber-400"/>:<Moon className="w-5 h-5 text-gray-400"/>}</button>
            <button onClick={() => setSideOpen(!sideOpen)} className="p-2"><Menu className={"w-5 h-5 " + (dark?"text-gray-400":"text-gray-600")} /></button>
          </div>
        </div>

        {/* Mobile sidebar */}
        {sideOpen && <div className="lg:hidden fixed inset-0 z-50"><div className="absolute inset-0 bg-black/30" onClick={() => setSideOpen(false)} /><div className={"absolute left-0 top-0 bottom-0 w-[260px] shadow-xl p-4 overflow-y-auto " + (dark?"bg-gray-800":"bg-white")}><div className="flex justify-between items-center mb-4"><span className={"font-bold " + (dark?"text-white":"text-gray-900")}>Menu</span><button onClick={() => setSideOpen(false)}><X className={"w-5 h-5 " + (dark?"text-gray-400":"text-gray-500")} /></button></div><nav className="space-y-1">{nav.map(item => <Link key={item.href} href={item.href} onClick={() => setSideOpen(false)} className={"flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium " + (pathname===item.href?(dark?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600"):(dark?"text-gray-400 hover:bg-gray-700":"text-gray-600 hover:bg-gray-50"))}><item.icon className="w-5 h-5" /> {item.label}{item.badge && item.badge > 0 ? <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span> : null}</Link>)}<button onClick={logout} className={"flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium w-full mt-4 border-t pt-4 " + (dark?"text-gray-400 hover:bg-gray-700 border-gray-700":"text-gray-500 hover:bg-gray-50 border-gray-100")}><LogOut className="w-5 h-5" /> Log Out</button></nav></div></div>}

        {/* Notification Bell Dropdown */}
        {showNotif && (
          <div className="fixed inset-0 z-50" onClick={() => setShowNotif(false)}>
            <div className={"absolute right-4 top-16 lg:right-auto lg:left-[240px] lg:top-4 w-80 rounded-2xl shadow-2xl border overflow-hidden " + (dark?"bg-gray-800 border-gray-700":"bg-white border-gray-200")} onClick={e => e.stopPropagation()}>
              <div className={"p-4 border-b flex items-center justify-between " + (dark?"border-gray-700":"border-gray-100")}>
                <h3 className={"font-bold " + (dark?"text-white":"text-gray-900")}>Notifications</h3>
                {notifCount > 0 && <button onClick={markAllRead} className="text-xs text-rose-500 font-semibold hover:underline">Mark all read</button>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center"><Bell className={"w-10 h-10 mx-auto mb-2 " + (dark?"text-gray-600":"text-gray-200")} /><p className={"text-sm " + (dark?"text-gray-500":"text-gray-400")}>No notifications yet</p></div>
                ) : (
                  notifications.slice(0, 15).map(n => (
                    <div key={n.id} className={"flex items-start gap-3 p-3 border-b last:border-0 " + (!n.read?(dark?"bg-rose-500/10 border-gray-700":"bg-rose-50/50 border-gray-50"):(dark?"border-gray-700":"border-gray-50"))}>
                      {n.fromUser?.profilePhoto ? <img src={n.fromUser.profilePhoto} className="w-9 h-9 rounded-full object-cover flex-shrink-0" /> : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{n.fromUser?.name?.[0]||"?"}</div>}
                      <div className="flex-1 min-w-0">
                        <p className={"text-xs " + (dark?"text-gray-300":"text-gray-800")}><span className="font-bold">{n.fromUser?.name||"Someone"}</span> {n.message}</p>
                        <p className={"text-[10px] mt-0.5 " + (dark?"text-gray-500":"text-gray-400")}>{formatTime(n.createdAt)}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0 mt-1.5" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Desktop notification bell - fixed position */}
        <div className="hidden lg:flex fixed top-4 left-[240px] z-30 items-center gap-2">
          <button onClick={() => setShowNotif(!showNotif)} className={"relative p-2.5 rounded-xl border transition-all " + (dark?"bg-gray-800 border-gray-700 hover:bg-gray-700":"bg-white border-gray-200 hover:bg-gray-50 shadow-sm")}>
            <Bell className={"w-5 h-5 " + (dark?"text-gray-400":"text-gray-600")} />
            {notifCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notifCount}</span>}
          </button>
          <button onClick={() => setDark(!dark)} className={"p-2.5 rounded-xl border transition-all " + (dark?"bg-gray-800 border-gray-700 hover:bg-gray-700":"bg-white border-gray-200 hover:bg-gray-50 shadow-sm")}>
            {dark?<Sun className="w-5 h-5 text-amber-400"/>:<Moon className="w-5 h-5 text-gray-500"/>}
          </button>
        </div>

        <main className={"flex-1 lg:ml-[230px] pt-14 lg:pt-0 " + (dark?"bg-gray-900":"bg-gray-50")}><div className="p-6 lg:p-8 max-w-6xl mx-auto">{children}</div></main>
      </div>
    </UserCtx.Provider>
  );
}
