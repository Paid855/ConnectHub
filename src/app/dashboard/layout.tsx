"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Heart, Compass, Search, MessageCircle, Video, Shield, User, LogOut, Menu, X, Crown, HelpCircle, Gem, Sparkles, Rss } from "lucide-react";

type UserData = { id:string; name:string; email:string; age:number|null; gender:string|null; lookingFor:string|null; bio:string|null; country:string|null; profilePhoto:string|null; tier:string; verified:boolean; verificationStatus:string; };
const UserCtx = createContext<{ user:UserData|null; reload:()=>void; unread:number }>({ user:null, reload:()=>{}, unread:0 });
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

  const loadUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.status === 403) { router.push("/login?banned=true"); return; }
      const data = await res.json();
      if (!data.user) { router.push("/login"); return; }
      setUser(data.user);
    } catch { router.push("/login"); }
    finally { setLoading(false); }
  };

  const loadUnread = async () => {
    try { const res = await fetch("/api/messages"); if (res.ok) { const d = await res.json(); setUnread((d.conversations||[]).reduce((s:number,c:any)=>s+(c.unreadCount||0),0)); } } catch {}
  };

  useEffect(() => { loadUser(); }, []);
  useEffect(() => { if (user) { loadUnread(); const i = setInterval(loadUnread, 10000); return () => clearInterval(i); } }, [user]);

  const logout = async () => { await fetch("/api/auth/logout", { method:"POST" }); router.push("/"); };

  const nav = [
    { href:"/dashboard", label:"Discover", icon:Compass },
    { href:"/dashboard/browse", label:"Browse", icon:Search },
    { href:"/dashboard/feed", label:"Feed", icon:Rss },
    { href:"/dashboard/messages", label:"Messages", icon:MessageCircle, badge:unread },
    { href:"/dashboard/video", label:"Video", icon:Video },
    { href:"/dashboard/verify", label:"Verification", icon:Shield },
    { href:"/dashboard/profile", label:"Profile", icon:User },
    { href:"/dashboard/support", label:"Support", icon:HelpCircle },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" /></div>;

  return (
    <UserCtx.Provider value={{ user, reload: loadUser, unread }}>
      <div className="flex min-h-screen bg-gray-50">
        <aside className="hidden lg:flex w-[230px] flex-col bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-40">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center"><Heart className="w-4 h-4 text-white fill-white" /></div>
            <span className="text-lg font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span>
          </Link>
          {user && (
            <div className="mx-3 mt-3 mb-1 p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100">
              <div className="flex items-center gap-2.5">
                {user.profilePhoto ? <img src={user.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">{user.name[0]}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name.split(" ")[0]}</p>
                  <TierBadge tier={user.tier} />
                </div>
              </div>
            </div>
          )}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            {nav.map(item => {
              const active = pathname === item.href;
              return <Link key={item.href} href={item.href} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " + (active?"bg-rose-50 text-rose-600":"text-gray-600 hover:bg-gray-50")}>
                <item.icon className={"w-[18px] h-[18px] " + (active?"text-rose-500":"text-gray-400")} />{item.label}
                {item.badge && item.badge > 0 ? <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span> : null}
              </Link>;
            })}
          </nav>
          {user && user.tier === "basic" && (
            <div className="mx-3 mb-2"><Link href="/dashboard/upgrade" className="flex items-center gap-2 px-3 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-sm font-bold hover:shadow-lg transition-all"><Crown className="w-5 h-5" /> Upgrade Plan</Link></div>
          )}
          <div className="px-3 py-3 border-t border-gray-100"><button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 w-full"><LogOut className="w-[18px] h-[18px]" /> Log Out</button></div>
        </aside>

        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center"><Heart className="w-3.5 h-3.5 text-white fill-white" /></div><span className="text-base font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span></Link>
          <button onClick={() => setSideOpen(!sideOpen)} className="p-2"><Menu className="w-5 h-5 text-gray-600" /></button>
        </div>

        {sideOpen && <div className="lg:hidden fixed inset-0 z-50"><div className="absolute inset-0 bg-black/30" onClick={() => setSideOpen(false)} /><div className="absolute left-0 top-0 bottom-0 w-[260px] bg-white shadow-xl p-4 overflow-y-auto"><div className="flex justify-between items-center mb-4"><span className="font-bold">Menu</span><button onClick={() => setSideOpen(false)}><X className="w-5 h-5 text-gray-500" /></button></div><nav className="space-y-1">{nav.map(item => <Link key={item.href} href={item.href} onClick={() => setSideOpen(false)} className={"flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium " + (pathname===item.href?"bg-rose-50 text-rose-600":"text-gray-600 hover:bg-gray-50")}><item.icon className="w-5 h-5" /> {item.label}{item.badge && item.badge > 0 ? <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span> : null}</Link>)}<button onClick={logout} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 w-full mt-4 border-t border-gray-100 pt-4"><LogOut className="w-5 h-5" /> Log Out</button></nav></div></div>}

        <main className="flex-1 lg:ml-[230px] pt-14 lg:pt-0"><div className="p-6 lg:p-8 max-w-6xl mx-auto">{children}</div></main>
      </div>
    </UserCtx.Provider>
  );
}
