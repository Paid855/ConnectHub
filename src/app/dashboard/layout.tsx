"use client";
import { useState, useEffect, createContext, useContext , useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LANGUAGES, t } from "@/lib/translations";
import LocationDetector from "@/components/LocationDetector";
import PushNotifications from "@/components/PushNotifications";
import { Heart, Compass, Search, MessageCircle, Video, Shield, User, LogOut, Menu, X, Crown, HelpCircle, Gem, Sparkles, Rss, Users, Bell, Moon, Sun, Coins, Eye, Trophy, Ban, Camera, Gift } from "lucide-react";

type UserData = { id:string; name:string; email:string; username?:string; age:number|null; gender:string|null; lookingFor:string|null; bio:string|null; country:string|null; profilePhoto:string|null; tier:string; verified:boolean; verificationStatus:string; phone:string|null; isPrivate:boolean; interests:string[]; coins:number; createdAt:string; };
const UserCtx = createContext<{ user:UserData|null; reload:()=>void; unread:number; dark:boolean; setDark:(v:boolean)=>void }>({ user:null, reload:()=>{}, unread:0, dark:false, setDark:()=>{} });
export const useUser = () => useContext(UserCtx);

function TierBadge({ tier }: { tier: string }) {
  if (tier === "gold") return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200"><Crown className="w-3 h-3" />Gold</span>;
  if (tier === "premium") return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 border border-rose-200"><Gem className="w-3 h-3" />Premium</span>;
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
  const [lang, setLang] = useState("en");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [rewardCoins, setRewardCoins] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const userCache = useRef<any>(null);
  const loadUser = async () => {
    if (userCache.current && Date.now() - userCache.current.time < 10000) {
      setUser(userCache.current.data);
      return;
    } try { const res = await fetch("/api/auth/me"); if (res.status===403) { router.push("/login?banned=true"); return; } const data = await res.json(); if (!data.user) { router.push("/login"); return; } setUser(data.user);
        userCache.current = { data: data.user, time: Date.now() }; } catch { router.push("/login"); } finally { setLoading(false); } };
  const loadUnread = async () => { try { const res = await fetch("/api/messages"); if (res.ok) { const d = await res.json(); setUnread((d.conversations||[]).reduce((s:number,c:any)=>s+(c.unreadCount||0),0)); } } catch {} };
  const loadNotifications = async () => { try { const res = await fetch("/api/notifications"); if (res.ok) { const d = await res.json(); setNotifCount(d.unreadCount||0); setNotifications(d.notifications||[]); } } catch {} };
  const markAllRead = async () => { await fetch("/api/notifications", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"readAll" }) }); setNotifCount(0); setNotifications(p => p.map(n => ({...n, read:true}))); };

  useEffect(() => { const savedLang = typeof window !== "undefined" ? localStorage.getItem("ch_lang") || "en" : "en"; setLang(savedLang); loadUser(); if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{}); }, []);
  const checkDailyReward = async () => {
    const today = new Date().toDateString();
    const last = typeof window !== "undefined" ? localStorage.getItem("lastRewardCheck") : null;
    if (last === today) return;
    if (typeof window !== "undefined") localStorage.setItem("lastRewardCheck", today);
    setTimeout(() => setShowReward(true), 2000);
  };

  const claimReward = async () => {
    try {
      const res = await fetch("/api/daily-reward", { method:"POST" });
      const data = await res.json();
      if (res.ok) { setRewardCoins(data.reward); setRewardClaimed(true); loadUser(); }
      else { setRewardClaimed(true); setRewardCoins(0); }
    } catch {}
  };

  useEffect(() => { if (user) { loadUnread(); loadNotifications(); checkDailyReward(); const i = setInterval(loadUnread, 10000); const j = setInterval(loadNotifications, 15000); return () => { clearInterval(i); clearInterval(j); }; } }, [user]);
  useEffect(() => { const s = typeof window !== "undefined" ? localStorage.getItem("dark") : null; if (s === "true") setDark(true); }, []);
  useEffect(() => { if (dark) document.documentElement.classList.add("dark"); else document.documentElement.classList.remove("dark"); if (typeof window !== "undefined") localStorage.setItem("dark", String(dark)); }, [dark]);

  const logout = async () => { await fetch("/api/auth/logout", { method:"POST" }); router.push("/"); };
  const formatTime = (d: string) => { const diff = Date.now()-new Date(d).getTime(); if(diff<60000) return "Just now"; if(diff<3600000) return Math.floor(diff/60000)+"m ago"; if(diff<86400000) return Math.floor(diff/3600000)+"h ago"; return new Date(d).toLocaleDateString([],{month:"short",day:"numeric"}); };

  const nav = [
    { href:"/dashboard", label:"Discover", icon:Compass },
    { href:"/dashboard/browse", label:"Browse", icon:Search },
    { href:"/dashboard/feed", label:"Feed", icon:Rss },
    { href:"/dashboard/friends", label:"Friends", icon:Users },
    { href:"/dashboard/messages", label:"Messages", icon:MessageCircle, badge:unread },
    { href:"/dashboard/video", label:"Video", icon:Video },
    { href:"/dashboard/verify", label:"Verification", icon:Shield },
    { href:"/dashboard/profile", label:"Profile", icon:User },
    { href:"/dashboard/views", label:"Who Viewed", icon:Eye },
    { href:"/dashboard/leaderboard", label:"Leaderboard", icon:Trophy },
    { href:"/dashboard/stories", label:"Stories", icon:Camera },
    { href:"/dashboard/quiz", label:"Explore", icon:Heart },
    { href:"/dashboard/referral", label:"Invite", icon:Gift },
    { href:"/dashboard/search", label:"Search", icon:Search },
    { href:"/dashboard/blocked", label:"Blocked", icon:Ban },
    { href:"/dashboard/support", label:"Support", icon:HelpCircle },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;

  const dc = dark;

  return (
    <UserCtx.Provider value={{ user, reload: loadUser, unread, dark, setDark }}>
      <div className={"flex min-h-screen " + (dc?"bg-gray-900":"bg-gray-50")}>
        {/* Sidebar */}
        <aside className={"hidden lg:flex w-[230px] flex-col fixed inset-y-0 left-0 z-40 border-r " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Link href="/dashboard" className={"flex items-center gap-2.5 px-5 py-4 border-b " + (dc?"border-gray-700":"border-gray-100")}><img src="/logo.png" alt="ConnectHub" className="h-12 w-auto" /></Link>
          {user && (
            <div className={"mx-3 mt-3 mb-1 p-3 rounded-xl border " + (dc?"bg-gray-700/50 border-gray-600":"bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100")}>
              <div className="flex items-center gap-2.5">
                {user.profilePhoto ? <img src={user.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">{user.name[0]}</div>}
                <div className="flex-1 min-w-0"><p className={"text-sm font-bold truncate " + (dc?"text-white":"text-gray-900")}>{user.name.split(" ")[0]}</p><TierBadge tier={user.tier} /></div>
              </div>
              {/* Coin balance */}
              <div className={"flex items-center gap-2 mt-2 pt-2 border-t " + (dc?"border-gray-600":"border-rose-100")}>
                <Coins className="w-4 h-4 text-amber-500" />
                <span className={"text-sm font-bold " + (dc?"text-amber-400":"text-amber-600")}>{user.coins.toLocaleString()}</span>
                <span className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>coins</span>
                <Link href="/dashboard/coins" className="ml-auto text-[10px] font-bold text-rose-500 hover:underline">+Buy</Link>
              </div>
            </div>
          )}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            {nav.map(item => { const active = pathname === item.href; return <Link key={item.href} href={item.href} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " + (active?(dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600"):(dc?"text-gray-400 hover:bg-gray-700":"text-gray-600 hover:bg-gray-50"))}><item.icon className={"w-[18px] h-[18px] " + (active?"text-rose-500":(dc?"text-gray-500":"text-gray-400"))} />{item.label}{item.badge && item.badge > 0 ? <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span> : null}</Link>; })}
          </nav>
          <div className={"mx-3 mb-2 flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer " + (dc?"bg-gray-700 hover:bg-gray-600":"bg-gray-50 hover:bg-gray-100")} onClick={() => setDark(!dc)}>
            {dc ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px] text-gray-400" />}
            <span className={"text-sm font-medium " + (dc?"text-gray-300":"text-gray-600")}>{dc?"Light Mode":"Dark Mode"}</span>
          </div>
          {user && user.tier === "basic" && <div className="mx-3 mb-2"><Link href="/dashboard/upgrade" className="flex items-center gap-2 px-3 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-sm font-bold hover:shadow-lg transition-all"><Crown className="w-5 h-5" /> Upgrade Plan</Link></div>}
          <div className={"px-3 py-3 border-t " + (dc?"border-gray-700":"border-gray-100")}><button onClick={logout} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full " + (dc?"text-gray-400 hover:bg-gray-700":"text-gray-500 hover:bg-gray-50")}><LogOut className="w-[18px] h-[18px]" /> Log Out</button></div>
        </aside>

        {/* Mobile header */}
        <div className={"lg:hidden fixed top-0 left-0 right-0 z-40 backdrop-blur-lg border-b px-4 h-14 flex items-center justify-between " + (dc?"bg-gray-800/95 border-gray-700":"bg-white/95 border-gray-100")}>
          <button onClick={() => setSideOpen(!sideOpen)} className="p-2"><Menu className={"w-5 h-5 " + (dc?"text-gray-400":"text-gray-600")} /></button>
          <Link href="/dashboard"><img src="/logo.png" alt="ConnectHub" className="h-9 w-auto" /></Link>
          <div className="flex items-center gap-1">
            <Link href="/dashboard/coins" className={"flex items-center gap-1 px-2 py-1 rounded-lg " + (dc?"bg-gray-700":"bg-amber-50")}><Coins className="w-3.5 h-3.5 text-amber-500" /><span className={"text-xs font-bold " + (dc?"text-amber-400":"text-amber-600")}>{user?.coins||0}</span></Link>
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2"><Bell className={"w-5 h-5 " + (dc?"text-gray-400":"text-gray-600")} />{notifCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{notifCount}</span>}</button>
          </div>
        </div>

        {/* Mobile sidebar */}
        {sideOpen && <div className="lg:hidden fixed inset-0 z-50"><div className="absolute inset-0 bg-black/30" onClick={() => setSideOpen(false)} /><div className={"absolute left-0 top-0 bottom-0 w-[280px] shadow-xl p-4 overflow-y-auto " + (dc?"bg-gray-800":"bg-white")}><div className="flex justify-between items-center mb-4"><span className={"font-bold " + (dc?"text-white":"text-gray-900")}>Menu</span><button onClick={() => setSideOpen(false)}><X className={"w-5 h-5 " + (dc?"text-gray-400":"text-gray-500")} /></button></div><nav className="space-y-1">{nav.map(item => <Link key={item.href} href={item.href} onClick={() => setSideOpen(false)} className={"flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium " + (pathname===item.href?(dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600"):(dc?"text-gray-400 hover:bg-gray-700":"text-gray-600 hover:bg-gray-50"))}><item.icon className="w-5 h-5" /> {item.label}{item.badge && item.badge > 0 ? <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span> : null}</Link>)}<button onClick={() => setDark(!dc)} className={"flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium w-full mt-2 " + (dc?"text-gray-400 hover:bg-gray-700":"text-gray-500 hover:bg-gray-50")}>{dc?<Sun className="w-5 h-5 text-amber-400"/>:<Moon className="w-5 h-5"/>} {dc?"Light Mode":"Dark Mode"}</button><button onClick={logout} className={"flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium w-full mt-2 border-t pt-4 " + (dc?"text-gray-400 hover:bg-gray-700 border-gray-700":"text-gray-500 hover:bg-gray-50 border-gray-100")}><LogOut className="w-5 h-5" /> Log Out</button></nav></div></div>}

        {/* RIGHT SIDE — Notification bell + Dark mode (desktop) */}
        <div className="hidden lg:flex fixed top-4 right-6 z-30 items-center gap-2">
          <Link href="/dashboard/coins" className={"flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all " + (dc?"bg-gray-800 border-gray-700 hover:bg-gray-700":"bg-white border-gray-200 hover:bg-gray-50 shadow-sm")}>
            <Coins className="w-4 h-4 text-amber-500" />
            <span className={"text-sm font-bold " + (dc?"text-amber-400":"text-amber-600")}>{user?.coins?.toLocaleString()||0}</span>
            <span className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>coins</span>
          </Link>
          <button onClick={() => setShowNotif(!showNotif)} className={"relative p-2.5 rounded-xl border transition-all " + (dc?"bg-gray-800 border-gray-700 hover:bg-gray-700":"bg-white border-gray-200 hover:bg-gray-50 shadow-sm")}>
            <Bell className={"w-5 h-5 " + (dc?"text-gray-400":"text-gray-600")} />
            {notifCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notifCount}</span>}
          </button>
          <button onClick={() => setDark(!dc)} className={"p-2.5 rounded-xl border transition-all " + (dc?"bg-gray-800 border-gray-700 hover:bg-gray-700":"bg-white border-gray-200 hover:bg-gray-50 shadow-sm")}>
            {dc?<Sun className="w-5 h-5 text-amber-400"/>:<Moon className="w-5 h-5 text-gray-500"/>}
          </button>
        </div>

        {/* Notification Dropdown */}
        {showNotif && (
          <div className="fixed inset-0 z-50" onClick={() => setShowNotif(false)}>
            <div className={"absolute right-4 top-16 lg:right-6 lg:top-14 w-80 rounded-2xl shadow-2xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200")} onClick={e => e.stopPropagation()}>
              <div className={"p-4 border-b flex items-center justify-between " + (dc?"border-gray-700":"border-gray-100")}>
                <h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>Notifications</h3>
                {notifCount > 0 && <button onClick={markAllRead} className="text-xs text-rose-500 font-semibold hover:underline">Mark all read</button>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center"><Bell className={"w-10 h-10 mx-auto mb-2 " + (dc?"text-gray-600":"text-gray-200")} /><p className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>No notifications yet</p></div>
                ) : notifications.slice(0, 15).map(n => (
                  <div key={n.id} onClick={() => { setShowNotif(false); const link = n.type==="message"?"/dashboard/messages":n.type==="friend_request"||n.type==="friend_accepted"?"/dashboard/friends":n.type==="like"?"/dashboard/feed":n.type==="gift"?"/dashboard/coins":n.type==="verification"?"/dashboard/profile":n.type==="story_reply"||n.type==="story_react"?"/dashboard/messages":n.type==="boost"||n.type==="purchase"||n.type==="purchase_failed"?"/dashboard/coins":"/dashboard"; router.push(link); fetch("/api/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"read",notificationId:n.id})}); }} className={"flex items-start gap-3 p-3 border-b last:border-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors " + (!n.read?(dc?"bg-rose-500/10 border-gray-700":"bg-rose-50/50 border-gray-50"):(dc?"border-gray-700":"border-gray-50"))}>
                    {n.fromUser?.profilePhoto ? <img src={n.fromUser.profilePhoto} className="w-9 h-9 rounded-full object-cover flex-shrink-0" /> : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{n.fromUser?.name?.[0]||"?"}</div>}
                    <div className="flex-1 min-w-0"><p className={"text-xs " + (dc?"text-gray-300":"text-gray-800")}><span className="font-bold">{n.fromUser?.name||"Someone"}</span> {n.message}</p><p className={"text-[10px] mt-0.5 " + (dc?"text-gray-500":"text-gray-400")}>{formatTime(n.createdAt)}</p></div>
                    {!n.read && <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className={"flex-1 lg:ml-[230px] pt-14 lg:pt-0 " + (dc?"bg-gray-900":"bg-gray-50")}><div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto pb-20 lg:pb-8">{children}</div><LocationDetector />
        <PushNotifications />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-800 safe-area-bottom">
          <div className="flex items-center justify-around py-2">
            {[
              { href:"/dashboard", icon:Compass, label:"Discover" },
              { href:"/dashboard/messages", icon:MessageCircle, label:"Messages" },
              { href:"/dashboard/feed", icon:Rss, label:"Feed" },
              { href:"/dashboard/stories", icon:Camera, label:"Stories" },
              { href:"/dashboard/profile", icon:User, label:"Profile" },
            ].map(item => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={"flex flex-col items-center gap-0.5 px-2 py-1 " + (active ? "text-rose-500" : (dc ? "text-gray-500" : "text-gray-400"))}>
                  <item.icon className={"w-5 h-5 " + (active ? "text-rose-500" : "")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {showReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { if(rewardClaimed) setShowReward(false); }}>
            <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200") + " w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden"} onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 p-8 text-center">
                <div className="text-6xl mb-3">{rewardClaimed ? "🎉" : "🎁"}</div>
                <h2 className="text-2xl font-bold text-white">{rewardClaimed ? "Coins Claimed!" : "Daily Reward!"}</h2>
                <p className="text-amber-100 text-sm mt-1">{rewardClaimed ? (rewardCoins > 0 ? "+" + rewardCoins + " coins added!" : "Already claimed today!") : "Claim your free coins"}</p>
              </div>
              <div className="p-6 text-center">
                {!rewardClaimed ? (
                  <>
                    <div className={"flex items-center justify-center gap-2 mb-4 " + (dc?"text-white":"text-gray-900")}><Coins className="w-6 h-6 text-amber-500" /><span className="text-3xl font-bold">+10</span><span className="text-lg">coins</span></div>
                    <p className={"text-sm mb-5 " + (dc?"text-gray-400":"text-gray-500")}>Log in every day to earn free coins!</p>
                    <button onClick={claimReward} className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-bold hover:shadow-lg">Claim Reward</button>
                  </>
                ) : (
                  <button onClick={() => setShowReward(false)} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold hover:shadow-lg">Continue</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </UserCtx.Provider>
  );
}
