"use client";
import { useState, useEffect, createContext, useContext, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import LocationDetector from "@/components/LocationDetector";
import PushPrompt from "@/components/PushPrompt";
import PushNotifications from "@/components/PushNotifications";
import IncomingCall from "@/components/IncomingCall";
import { Heart, Compass, Search, MessageCircle, Video, Shield, User, LogOut, Menu, X, Crown, HelpCircle, Gem, Sparkles, Rss, Users, Bell, Moon, Sun, Coins, Eye, Trophy, Ban, Camera, Gift, Wallet, Lock, ChevronRight } from "lucide-react";

type UserData = { id:string; name:string; email:string; username?:string; age:number|null; gender:string|null; lookingFor:string|null; bio:string|null; country:string|null; profilePhoto:string|null; tier:string; verified:boolean; verificationStatus:string; phone:string|null; isPrivate:boolean; interests:string[]; coins:number; createdAt:string; };
const UserCtx = createContext<{ user:UserData|null; reload:()=>void; unread:number; dark:boolean; setDark:(v:boolean)=>void }>({ user:null, reload:()=>{}, unread:0, dark:false, setDark:()=>{} });
export const useUser = () => useContext(UserCtx);

function TierBadge({ tier, createdAt }: { tier: string; createdAt?: string }) {
  const isNew = createdAt && Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
  const badge = tier === "gold" 
    ? <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm shadow-amber-200"><Crown className="w-3 h-3" />GOLD</span>
    : tier === "premium" || tier === "plus"
    ? <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm shadow-rose-200"><Gem className="w-3 h-3" />PRO</span>
    : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Free</span>;
  return <span className="inline-flex items-center gap-1.5">{badge}{isNew && <span className="inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white animate-pulse">NEW</span>}</span>;
}
export { TierBadge };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData|null>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const prevUnread = useRef(0);
  const layoutNotifSound = useRef<HTMLAudioElement|null>(null);

  useEffect(() => {
    layoutNotifSound.current = new Audio("/sounds/notify.wav");
    layoutNotifSound.current.volume = 0.3;
  }, []);

  useEffect(() => {
    if (unread > prevUnread.current && prevUnread.current >= 0) {
      layoutNotifSound.current?.play().catch(() => {});
    }
    prevUnread.current = unread;
  }, [unread]);
  const [dark, setDark] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const lastReadTime = useRef(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [rewardCoins, setRewardCoins] = useState(0);
  const [rewardStreak, setRewardStreak] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userCache = useRef<any>(null);
  const inactivityTimer = useRef<any>(null);
  const prevPath = useRef(pathname);

  // === PAGE LOADING TRANSITION (#6) ===
  useEffect(() => {
    if (prevPath.current !== pathname) {
      setPageLoading(true);
      const t = setTimeout(() => setPageLoading(false), 600);
      prevPath.current = pathname;
      return () => clearTimeout(t);
    }
  }, [pathname]);

  // === AUTO-LOGOUT AFTER 10 MIN INACTIVITY (#3) ===
  const lastActivity = useRef(Date.now());
  useEffect(() => {
    const TIMEOUT = 10 * 60 * 1000; // 10 minutes
    const STORAGE_KEY = "ch_last_active";

    // Check if user was inactive before page reload (mobile browser kills page)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const elapsed = Date.now() - parseInt(stored, 10);
      if (elapsed >= TIMEOUT) {
        localStorage.removeItem(STORAGE_KEY);
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login?reason=inactive";
        return;
      }
    }

    const resetTimer = () => {
      lastActivity.current = Date.now();
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(async () => {
        localStorage.removeItem(STORAGE_KEY);
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login?reason=inactive";
      }, TIMEOUT);
    };

    // When user returns to tab (mobile: reopens app), check if timed out
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const last = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) || lastActivity.current;
        const elapsed = Date.now() - last;
        if (elapsed >= TIMEOUT) {
          localStorage.removeItem(STORAGE_KEY);
          document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          fetch("/api/auth/logout", { method: "POST" }).then(() => {
            window.location.href = "/login?reason=inactive";
          });
        } else {
          resetTimer();
        }
      }
    };

    // Periodic check — catches Android background kills
    const periodicCheck = setInterval(() => {
      const last = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      if (last > 0 && Date.now() - last >= TIMEOUT) {
        localStorage.removeItem(STORAGE_KEY);
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login?reason=inactive";
      }
    }, 30000);

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    document.addEventListener("visibilitychange", handleVisibility);
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(periodicCheck);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [router]);

  const loadUser = async () => {
    if (userCache.current && Date.now() - userCache.current.time < 10000) { setUser(userCache.current.data); return; }
    const tryAuth = async (attempt = 0): Promise<boolean> => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 403) { router.push("/login?banned=true"); return true; }
        const data = await res.json();
        if (!data.user) {
          if (attempt < 2) { await new Promise(r => setTimeout(r, 800)); return tryAuth(attempt + 1); }
          router.push("/login"); return true;
        }
        setUser(data.user);
        userCache.current = { data: data.user, time: Date.now() };
        return true;
      } catch {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 800)); return tryAuth(attempt + 1); }
        router.push("/login"); return true;
      }
    };
    await tryAuth();
    setLoading(false);
  };
  const loadUnread = async () => { try { const res = await fetch("/api/messages"); if (res.ok) { const d = await res.json(); setUnread((d.conversations||[]).reduce((s:number,c:any)=>s+(c.unreadCount||0),0)); } } catch {} };
  const loadNotifications = async () => { if (Date.now() - lastReadTime.current < 8000) return; try { const res = await fetch("/api/notifications"); if (res.ok) { const d = await res.json(); setNotifCount(d.unreadCount||0); setNotifications(d.notifications||[]); } } catch {} };
  const markAllRead = async () => { lastReadTime.current=Date.now(); await fetch("/api/notifications", { method:"PUT" }); setNotifCount(0); setNotifications(p => p.map(n => ({...n, read:true}))); };

  useEffect(() => {
    loadUser();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
    // Listen for push notifications to auto-refresh data
    const handlePush = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_RECEIVED") {
        loadUnread();
        if (Date.now() - lastReadTime.current > 8000) loadNotifications();
        window.dispatchEvent(new CustomEvent("connecthub:refresh", { detail: event.data.payload }));
      }
    };
    navigator.serviceWorker?.addEventListener("message", handlePush);
    // Also listen for visibility change — refresh when user returns to tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadUnread();
        if (Date.now() - lastReadTime.current > 8000) loadNotifications();
        window.dispatchEvent(new CustomEvent("connecthub:refresh"));
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handlePush);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const checkDailyReward = async () => {
    const today = new Date().toDateString();
    const last = typeof window !== "undefined" ? localStorage.getItem("lastRewardCheck") : null;
    if (last === today) return;
    // Check server first — don't show if already claimed on another device
    try {
      const res = await fetch("/api/daily-reward", { method: "POST" });
      const data = await res.json();
      if (typeof window !== "undefined") localStorage.setItem("lastRewardCheck", today);
      if (res.ok && data.reward > 0) {
        setRewardCoins(data.reward);
        setRewardStreak(data.streak || 1);
        setRewardClaimed(true);
        loadUser();
        setTimeout(() => setShowReward(true), 2000);
      }
      // If already claimed (400), just save to localStorage so it doesn't ask again
    } catch {}
  };
  const claimReward = async () => {
    try {
      const res = await fetch("/api/daily-reward", { method:"POST" });
      const data = await res.json();
      if (res.ok) { setRewardCoins(data.reward); setRewardStreak(data.streak || 1); setRewardClaimed(true); loadUser(); }
      else { setRewardClaimed(true); setRewardCoins(0); setRewardStreak(data.streak || 0); }
    } catch {}
  };

  useEffect(() => { if (user) { loadUnread(); loadNotifications(); checkDailyReward(); const i = setInterval(loadUnread, 10000); const j = setInterval(loadNotifications, 15000); return () => { clearInterval(i); clearInterval(j); }; } }, [user]);
  useEffect(() => { const s = typeof window !== "undefined" ? localStorage.getItem("dark") : null; if (s === "true") setDark(true); }, []);
  useEffect(() => { if (dark) document.documentElement.classList.add("dark"); else document.documentElement.classList.remove("dark"); if (typeof window !== "undefined") localStorage.setItem("dark", String(dark)); }, [dark]);

  const logout = async () => { await fetch("/api/auth/logout", { method:"POST" }); router.push("/"); };
  const formatTime = (d: string) => { const diff = Date.now()-new Date(d).getTime(); if(diff<60000) return "Just now"; if(diff<3600000) return Math.floor(diff/60000)+"m ago"; if(diff<86400000) return Math.floor(diff/3600000)+"h ago"; return new Date(d).toLocaleDateString([],{month:"short",day:"numeric"}); };

  // === COMPACT COIN DISPLAY (#10) ===
  const formatCoins = (n: number) => {
    if (n >= 1000000) return (n/1000000).toFixed(1) + "M";
    if (n >= 10000) return (n/1000).toFixed(0) + "K";
    if (n >= 1000) return (n/1000).toFixed(1) + "K";
    return n.toLocaleString();
  };

  // Core nav — clean 5 items
  const nav = [
    { href:"/dashboard", label:"Discover", icon:Compass },
    { href:"/dashboard/messages", label:"Messages", icon:MessageCircle, badge:unread },
    { href:"/dashboard/notifications", label:"Notifications", icon:Bell },
    { href:"/dashboard/liked", label:"Who Likes You", icon:Heart },
    { href:"/dashboard/feed", label:"Feed", icon:Rss },
    { href:"/dashboard/stories", label:"Stories", icon:Camera },
    { href:"/dashboard/video", label:"Live Streams", icon:Video },
    { href:"/dashboard/browse", label:"Browse People", icon:Search },
    { href:"/dashboard/search", label:"Advanced Search", icon:Search },
    { href:"/dashboard/friends", label:"Friends", icon:Users },
    { href:"/dashboard/profile", label:"Profile", icon:User },
  ];

  // Everything else goes in avatar dropdown menu
  const menuItems = [
    { section: "Quick Access" },
    { href:"/dashboard/views", label:"Who Viewed Me", icon:Eye },
    { href:"/dashboard/verify", label:"Get Verified", icon:Shield },
    { href:"/dashboard/upgrade", label:"Upgrade Plan", icon:Crown },
    { section: "Account" },
    { href:"/dashboard/settings", label:"Settings", icon:Lock },
    { href:"/dashboard/blocked", label:"Blocked Users", icon:Ban },
    { href:"/dashboard/support", label:"Help & Support", icon:HelpCircle },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="text-center"><div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" /><p className="text-gray-400 text-sm">Loading ConnectHub...</p></div></div>;

  const dc = dark;

  return (
    <UserCtx.Provider value={{ user, reload: loadUser, unread, dark, setDark }}>
      <div className={"flex min-h-screen " + (dc?"bg-gray-900":"bg-gray-50")}>

        {/* === PAGE LOADING OVERLAY (#6) === */}
        {pageLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-3">
                <div className="absolute inset-0 border-4 border-rose-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-rose-500 rounded-full animate-spin" />
                <div className="absolute inset-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center"><span className="text-white text-lg">💕</span></div>
              </div>
              <p className={"text-sm font-medium " + (dc?"text-gray-400":"text-gray-500")}>Loading...</p>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <aside className={"hidden lg:flex w-[230px] flex-col fixed inset-y-0 left-0 z-40 border-r " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Link href="/dashboard" className={"flex items-center gap-2.5 px-5 py-4 border-b " + (dc?"border-gray-700":"border-gray-100")}><img src="/logo.png" alt="ConnectHub" className="h-12 w-auto" /></Link>
          {user && (
            <div className={"mx-3 mt-3 mb-1 p-3 rounded-xl border " + (dc?"bg-gray-700/50 border-gray-600":"bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100")}>
              <div className="flex items-center gap-2.5">
                {user.profilePhoto ? <img src={user.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">{user.name[0]}</div>}
                <div className="flex-1 min-w-0"><p className={"text-sm font-bold truncate " + (dc?"text-white":"text-gray-900")}>{user.name.split(" ")[0]}</p><TierBadge tier={user.tier} /></div>
              </div>
              <div className={"flex items-center gap-2 mt-2 pt-2 border-t " + (dc?"border-gray-600":"border-rose-100")}>
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span className={"text-xs font-bold " + (dc?"text-amber-400":"text-amber-600")}>{formatCoins(user.coins)}</span>
                <Link href="/dashboard/coins" className="text-[10px] font-bold text-rose-500 hover:underline">+Buy</Link>
                <Link href="/dashboard/wallet" className="text-[10px] font-bold text-amber-500 hover:underline">Wallet</Link>
              </div>
            </div>
          )}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto scrollbar-hide">
            {nav.map(item => { const active = pathname === item.href; return <Link key={item.href} href={item.href} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " + (active?(dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600"):(dc?"text-gray-400 hover:bg-gray-700":"text-gray-600 hover:bg-gray-50"))}><item.icon className={"w-[18px] h-[18px] " + (active?"text-rose-500":(dc?"text-gray-500":"text-gray-400"))} />{item.label}{item.badge && item.badge > 0 ? <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span> : null}</Link>; })}
          </nav>


          <div className={"px-3 pt-2 pb-1 border-t " + (dc?"border-gray-700":"border-gray-100")}>
            <p className={"text-[9px] font-bold uppercase tracking-wider px-3 mb-1.5 " + (dc?"text-gray-500":"text-gray-400")}>Get the App</p>
            <a href="https://play.google.com/store/apps/details?id=love.connecthub.app" target="_blank" rel="noopener" className={"flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all " + (dc?"text-gray-300 hover:bg-gray-700":"text-gray-600 hover:bg-gray-50")}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24"><path fill="#34A853" d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734c0-.382.218-.72.609-.92z"/><path fill="#FBBC04" d="M16.247 9.544L5.12.808A1.004 1.004 0 013.609 1.814l10.183 10.183 2.455-2.453z"/><path fill="#4285F4" d="M21.393 10.916l-3.146-1.764-2.455 2.453 2.455 2.453 3.146-1.764c.783-.44.783-1.537 0-1.978z"/><path fill="#EA4335" d="M3.609 22.186L16.247 14.06l-2.455-2.453L3.609 22.186z"/></svg>
              Google Play
            </a>
            <div className={"flex items-center gap-2 px-3 py-2 rounded-xl text-xs " + (dc?"text-gray-500":"text-gray-400")}>
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              App Store — Soon
            </div>
          </div>
          <div className={"px-3 py-2 border-t " + (dc?"border-gray-700":"border-gray-100")}><button onClick={logout} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full " + (dc?"text-gray-400 hover:bg-gray-700":"text-gray-500 hover:bg-gray-50")}><LogOut className="w-[18px] h-[18px]" /> Log Out</button></div>
        </aside>

        {/* Mobile header */}
        <div className={"lg:hidden fixed top-0 left-0 right-0 z-40 backdrop-blur-lg border-b px-4 h-14 flex items-center justify-between safe-area-top " + (dc?"bg-gray-800/95 border-gray-700":"bg-white/95 border-gray-100")}>
          <button onClick={() => setSideOpen(!sideOpen)} className="p-2"><Menu className={"w-5 h-5 " + (dc?"text-gray-400":"text-gray-600")} /></button>
          <Link href="/dashboard"><img src="/logo.png" alt="ConnectHub" className="h-9 w-auto" /></Link>
          <div className="flex items-center gap-1">
            <Link href="/dashboard/coins" className={"flex items-center gap-1 px-2 py-1 rounded-lg " + (dc?"bg-gray-700":"bg-amber-50")}><Coins className="w-3 h-3 text-amber-500" /><span className={"text-[10px] font-bold " + (dc?"text-amber-400":"text-amber-600")}>{formatCoins(user?.coins||0)}</span></Link>
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2"><Bell className={"w-5 h-5 " + (dc?"text-gray-400":"text-gray-600")} />{notifCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{notifCount}</span>}</button>
          </div>
        </div>

        {/* Mobile sidebar */}
        {sideOpen && <div className="lg:hidden fixed inset-0 z-50"><div className="absolute inset-0 bg-black/30" onClick={() => setSideOpen(false)} /><div className={"absolute left-0 top-0 bottom-0 w-[280px] shadow-xl p-4 overflow-y-auto " + (dc?"bg-gray-800":"bg-white")}><div className="flex justify-between items-center mb-4"><span className={"font-bold " + (dc?"text-white":"text-gray-900")}>Menu</span><button onClick={() => setSideOpen(false)}><X className={"w-5 h-5 " + (dc?"text-gray-400":"text-gray-500")} /></button></div><nav className="space-y-0.5">
              {nav.map(item => <Link key={item.href} href={item.href} onClick={() => setSideOpen(false)} className={"flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold " + (pathname===item.href?(dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600"):(dc?"text-gray-300 hover:bg-gray-700":"text-gray-700 hover:bg-gray-50"))}><item.icon className="w-5 h-5" /> {item.label}{item.badge && item.badge > 0 ? <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span> : null}</Link>)}
              <div className={"my-3 border-t " + (dc?"border-gray-700":"border-gray-100")} />
              {menuItems.map((item: any, i: number) => 
                item.section ? <div key={i} className={"px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider " + (dc?"text-gray-500":"text-gray-400")}>{item.section}</div> : <Link key={item.href} href={item.href} onClick={() => setSideOpen(false)} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium " + (pathname===item.href?(dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600"):(dc?"text-gray-400 hover:bg-gray-700":"text-gray-600 hover:bg-gray-50"))}><item.icon className="w-4 h-4" /> {item.label}</Link>
              )}
              <div className={"my-3 border-t " + (dc?"border-gray-700":"border-gray-100")} />
              <button onClick={() => {setDark(!dc);setSideOpen(false);}} className={"flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium w-full " + (dc?"text-gray-400 hover:bg-gray-700":"text-gray-500 hover:bg-gray-50")}>{dc?<Sun className="w-5 h-5 text-amber-400"/>:<Moon className="w-5 h-5"/>} {dc?"Light Mode":"Dark Mode"}</button>
              <button onClick={logout} className={"flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium w-full " + (dc?"text-gray-400 hover:bg-gray-700":"text-gray-500 hover:bg-gray-50")}><LogOut className="w-5 h-5" /> Log Out</button>
              <div className={"mt-3 pt-3 border-t " + (dc?"border-gray-700":"border-gray-100")}>
                <p className={"text-[9px] font-bold uppercase tracking-wider px-3 mb-2 " + (dc?"text-gray-500":"text-gray-400")}>Get the App</p>
                <a href="https://play.google.com/store/apps/details?id=love.connecthub.app" target="_blank" rel="noopener" className={"flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium " + (dc?"text-gray-300 hover:bg-gray-700":"text-gray-600 hover:bg-gray-50")}>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24"><path fill="#34A853" d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734c0-.382.218-.72.609-.92z"/><path fill="#FBBC04" d="M16.247 9.544L5.12.808A1.004 1.004 0 013.609 1.814l10.183 10.183 2.455-2.453z"/><path fill="#4285F4" d="M21.393 10.916l-3.146-1.764-2.455 2.453 2.455 2.453 3.146-1.764c.783-.44.783-1.537 0-1.978z"/><path fill="#EA4335" d="M3.609 22.186L16.247 14.06l-2.455-2.453L3.609 22.186z"/></svg>
                  Google Play
                </a>
                <div className={"flex items-center gap-2.5 px-3 py-2.5 text-sm " + (dc?"text-gray-500":"text-gray-400")}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  App Store — Coming Soon
                </div>
              </div>
            </nav></div></div>}

        {/* === DESKTOP TOP-RIGHT with Logout (#4) === */}
        <div className="hidden lg:flex fixed top-4 right-6 z-30 items-center gap-2">
          <Link href="/dashboard/coins" className={"flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all " + (dc?"bg-gray-800 border-gray-700 hover:bg-gray-700":"bg-white border-gray-200 hover:bg-gray-50 shadow-sm")}>
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className={"text-xs font-bold " + (dc?"text-amber-400":"text-amber-600")}>{formatCoins(user?.coins||0)}</span>
          </Link>
          <button onClick={() => setShowNotif(!showNotif)} className={"relative p-2.5 rounded-xl border transition-all " + (dc?"bg-gray-800 border-gray-700 hover:bg-gray-700":"bg-white border-gray-200 hover:bg-gray-50 shadow-sm")}>
            <Bell className={"w-4 h-4 " + (dc?"text-gray-400":"text-gray-600")} />
            {notifCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{notifCount}</span>}
          </button>

          {/* User menu with logout (#4) */}
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className={"flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all " + (dc?"bg-gray-800 border-gray-700 hover:bg-gray-700":"bg-white border-gray-200 hover:bg-gray-50 shadow-sm")}>
              {user?.profilePhoto ? <img src={user.profilePhoto} className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">{user?.name?.[0]||"?"}</div>}
              <span className={"text-xs font-semibold hidden xl:block " + (dc?"text-gray-300":"text-gray-700")}>{user?.name?.split(" ")[0]}</span>
            </button>
            {showUserMenu && (
              <div className="fixed inset-0 z-50" onClick={() => setShowUserMenu(false)}>
                <div className={"absolute right-6 top-14 w-64 rounded-2xl shadow-2xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200")} onClick={e => e.stopPropagation()}>
                  <div className={"p-4 border-b " + (dc?"border-gray-700":"border-gray-100")}>
                    <p className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>{user?.name}</p>
                    <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>{user?.email}</p>
                  </div>
                  <div className="p-2 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    {menuItems.map((item: any, i: number) => 
                      item.section ? (
                        <div key={i} className={"px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider " + (dc?"text-gray-500":"text-gray-400")}>{item.section}</div>
                      ) : (
                        <Link key={item.href} href={item.href} onClick={() => setShowUserMenu(false)} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " + (pathname===item.href?(dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600"):(dc?"text-gray-300 hover:bg-gray-700":"text-gray-700 hover:bg-gray-50"))}>
                          <item.icon className={"w-4 h-4 " + (pathname===item.href?"text-rose-500":(dc?"text-gray-500":"text-gray-400"))} />
                          {item.label}
                          <ChevronRight className={"w-3 h-3 ml-auto " + (dc?"text-gray-600":"text-gray-300")} />
                        </Link>
                      )
                    )}
                  </div>
                  <div className={"p-2 border-t " + (dc?"border-gray-700":"border-gray-100")}>
                    <div className={"px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider " + (dc?"text-gray-500":"text-gray-400")}>Preferences</div>
                    <button onClick={() => setDark(!dc)} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full " + (dc?"text-gray-300 hover:bg-gray-700":"text-gray-700 hover:bg-gray-50")}>
                      {dc?<Sun className="w-4 h-4 text-amber-400"/>:<Moon className="w-4 h-4 text-gray-400"/>}
                      {dc?"Light Mode":"Dark Mode"}
                    </button>
                    <button onClick={() => { setShowUserMenu(false); logout(); }} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-red-500 " + (dc?"hover:bg-gray-700":"hover:bg-red-50")}><LogOut className="w-4 h-4" /> Log Out</button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
                  <div key={n.id} onClick={async() => { setShowNotif(false); const link = n.type==="message"?"/dashboard/messages"+(n.fromUserId?"?user="+n.fromUserId:""):n.type==="friend_request"||n.type==="friend_accepted"?"/dashboard/friends":n.type==="like"||n.type==="superlike"?"/dashboard/liked":n.type==="gift"?"/dashboard/wallet":n.type==="verification"?"/dashboard/verify":n.type==="story_reply"||n.type==="story_react"?"/dashboard/messages":n.type==="purchase"||n.type==="boost"?"/dashboard/wallet":n.type==="purchase_failed"?"/dashboard/coins":n.type==="match"?"/dashboard/messages":"/dashboard"; if(!n.read){lastReadTime.current=Date.now();setNotifCount(p=>Math.max(0,p-1));setNotifications(p=>p.map(x=>x.id===n.id?{...x,read:true}:x)); await fetch("/api/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"read",notificationId:n.id})}); } router.push(link); }} className={"flex items-start gap-3 p-3 border-b last:border-0 cursor-pointer transition-colors " + (!n.read?(dc?"bg-rose-500/10 border-gray-700 hover:bg-gray-700":"bg-rose-50/50 border-gray-50 hover:bg-gray-50"):(dc?"border-gray-700 hover:bg-gray-700":"border-gray-50 hover:bg-gray-50"))}>
                    {n.fromUser?.profilePhoto ? <img src={n.fromUser.profilePhoto} className="w-9 h-9 rounded-full object-cover flex-shrink-0" /> : n.fromUser?.name ? <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{n.fromUser.name[0]}</div> : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0"><span className="text-sm">💕</span></div>}
                    <div className="flex-1 min-w-0"><p className={"text-xs " + (dc?"text-gray-300":"text-gray-800")}>{n.fromUser?.name ? <><span className="font-bold">{n.fromUser.name}</span> {n.message}</> : <><span className="font-bold">{n.title || "ConnectHub"}</span> {n.message}</>}</p><p className={"text-[10px] mt-0.5 " + (dc?"text-gray-500":"text-gray-400")}>{formatTime(n.createdAt)}</p></div>
                    {!n.read && <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className={"flex-1 lg:ml-[230px] pt-14 lg:pt-0 notranslate " + (dc?"bg-gray-900":"bg-gray-50")} translate="no"><div className="p-2 sm:p-4 md:p-6 lg:p-8 max-w-6xl mx-auto pb-24 lg:pb-8">{/* Email verify banner */}
              {user && !user.emailVerified && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📧</span>
                    <div>
                      <p className="text-xs font-bold text-amber-900">Verify your email</p>
                      <p className="text-[10px] text-amber-700">Secure your account and unlock all features</p>
                    </div>
                  </div>
                  <a href="/verify-email" className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full hover:bg-amber-600 transition-all flex-shrink-0">Verify Now</a>
                </div>
              )}
              {user && (!user.bio || !user.profilePhoto || !user.interests?.length) && (
                <div className={"rounded-2xl border p-3 mb-4 flex items-center justify-between " + (dc?"bg-rose-500/5 border-rose-500/20":"bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100")}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    <div>
                      <p className={"text-xs font-bold " + (dc?"text-rose-400":"text-rose-700")}>Complete your profile</p>
                      <p className={"text-[10px] " + (dc?"text-rose-500/70":"text-rose-500")}>
                        {[!user.profilePhoto && "Add photo", !user.bio && "Write bio", !user.interests?.length && "Add interests"].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <a href="/dashboard/profile" className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full hover:shadow-lg transition-all flex-shrink-0">Complete</a>
                </div>
              )}
              {children}</div><PushPrompt />
        <LocationDetector /><PushNotifications />
        <IncomingCall /></main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-800 safe-area-bottom">
          <div className="flex items-center justify-around py-2">
            {[
              { href:"/dashboard", icon:Compass, label:"Discover" },
              { href:"/dashboard/messages", icon:MessageCircle, label:"Messages" },
              { href:"/dashboard/liked", icon:Heart, label:"Likes" },
              { href:"/dashboard/notifications", icon:Bell, label:"Alerts" },
              { href:"/dashboard/profile", icon:User, label:"Me" },
            ].map(item => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={"relative flex flex-col items-center gap-0.5 px-3 py-1 " + (active ? "text-rose-500" : (dc ? "text-gray-500" : "text-gray-400"))}>
                  <div className="relative">
                    <item.icon className={"w-5 h-5 " + (active ? "text-rose-500" : "")} />
                    {item.href==="/dashboard/messages" && unread>0 && <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">{unread > 9 ? "9+" : unread}</span>}
                  </div>
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
                {rewardClaimed && rewardStreak > 0 && (
                  <div className="mt-3 bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 border border-white/20">
                    <p className="text-white font-extrabold text-lg">🔥 {rewardStreak}-day streak!</p>
                    <p className="text-amber-200 text-[10px]">{rewardStreak >= 7 ? "Streak bonus active! Keep it going!" : "Log in " + (7 - rewardStreak) + " more days for bonus coins!"}</p>
                  </div>
                )}
              </div>
              <div className="p-6 text-center">
                {!rewardClaimed ? (
                  <>
                    <div className={"flex items-center justify-center gap-2 mb-4 " + (dc?"text-white":"text-gray-900")}><Coins className="w-6 h-6 text-amber-500" /><span className="text-3xl font-bold">+5</span><span className="text-lg">coins</span></div>
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
