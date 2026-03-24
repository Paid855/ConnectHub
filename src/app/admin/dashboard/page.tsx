"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Shield, AlertTriangle, DollarSign, LogOut, Search, ChevronDown, Eye, Ban, Check, X, Trash2, Crown, Gem, Camera, Mail, Phone, Globe, Calendar, Heart, MessageCircle, Coins, TrendingUp, BarChart3, Filter, RefreshCw, FileText, Settings, Home } from "lucide-react";

type UserData = { id:string; name:string; email:string; username:string|null; phone:string|null; age:number|null; gender:string|null; country:string|null; bio:string|null; profilePhoto:string|null; tier:string; verified:boolean; verificationStatus:string|null; verificationPhoto:string|null; idDocument:string|null; interests:string[]; coins:number; createdAt:string; lastSeen:string|null; };

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState<UserData[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserData|null>(null);
  const [selectedVerif, setSelectedVerif] = useState<any>(null);
  const [photoViewer, setPhotoViewer] = useState<string|null>(null);
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/admin/me");
      if (!res.ok) { router.push("/admin"); return; }
      setAdmin(await res.json());
      await loadAll();
      setLoading(false);
    };
    check();
  }, []);

  const loadAll = async () => {
    const [uRes, vRes, rRes, revRes] = await Promise.all([
      fetch("/api/admin/users"), fetch("/api/admin/verifications"), fetch("/api/admin/reports"), fetch("/api/admin/revenue")
    ]);
    if (uRes.ok) setUsers(await uRes.json().then(d => d.users || []));
    if (vRes.ok) setVerifications(await vRes.json().then(d => d.verifications || []));
    if (rRes.ok) setReports(await rRes.json().then(d => d.reports || []));
    if (revRes.ok) setRevenue(await revRes.json());
  };

  const handleLogout = async () => { await fetch("/api/admin/logout", { method:"POST" }); router.push("/admin"); };

  const handleUserAction = async (userId: string, action: string) => {
    setActionLoading(userId + action);
    if (action === "ban") { if (!confirm("Ban this user permanently?")) { setActionLoading(""); return; } await fetch("/api/admin/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action:"ban" }) }); }
    if (action === "unban") { await fetch("/api/admin/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action:"unban" }) }); }
    if (action === "delete") { if (!confirm("DELETE this user and ALL their data? This cannot be undone!")) { setActionLoading(""); return; } await fetch("/api/admin/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action:"delete" }) }); }
    if (action === "makeGold") { await fetch("/api/admin/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action:"upgrade", tier:"gold" }) }); }
    if (action === "makePremium") { await fetch("/api/admin/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action:"upgrade", tier:"premium" }) }); }
    await loadAll();
    setActionLoading("");
    if (selectedUser?.id === userId) setSelectedUser(users.find(u => u.id === userId) || null);
  };

  const handleVerification = async (userId: string, action: "approve"|"reject") => {
    setActionLoading(userId + action);
    await fetch("/api/admin/verifications", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action }) });
    await loadAll();
    setActionLoading("");
    setSelectedVerif(null);
  };

  const filteredUsers = users.filter(u => {
    if (u.email === "admin@connecthub.com") return false;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.username||"").toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === "all" || u.tier === filterTier;
    return matchSearch && matchTier;
  });

  const stats = {
    total: users.filter(u => u.email !== "admin@connecthub.com").length,
    verified: users.filter(u => u.verified).length,
    premium: users.filter(u => u.tier === "premium").length,
    gold: users.filter(u => u.tier === "gold").length,
    banned: users.filter(u => u.tier === "banned").length,
    online: users.filter(u => u.lastSeen && Date.now() - new Date(u.lastSeen).getTime() < 5*60*1000).length,
    pendingVerif: verifications.length,
    pendingReports: reports.filter((r:any) => r.status === "pending").length,
  };

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;
  const timeAgo = (d: string) => { const diff = Date.now()-new Date(d).getTime(); if(diff<60000) return "Just now"; if(diff<3600000) return Math.floor(diff/60000)+"m ago"; if(diff<86400000) return Math.floor(diff/3600000)+"h ago"; return new Date(d).toLocaleDateString(); };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3"><img src="/logo.png" alt="ConnectHub" className="w-9 h-9 rounded-lg" /><div><p className="font-bold text-sm">ConnectHub</p><p className="text-[10px] text-gray-500">Admin Panel</p></div></div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            {k:"overview",l:"Overview",icon:Home,badge:null},
            {k:"users",l:"All Users",icon:Users,badge:stats.total},
            {k:"verifications",l:"Verifications",icon:Shield,badge:stats.pendingVerif},
            {k:"reports",l:"Reports",icon:AlertTriangle,badge:stats.pendingReports},
            {k:"revenue",l:"Revenue",icon:DollarSign,badge:null},
          ].map(t => (
            <button key={t.k} onClick={()=>{setTab(t.k);setSelectedUser(null);setSelectedVerif(null);}} className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " + (tab===t.k?"bg-rose-500/10 text-rose-400":"text-gray-400 hover:text-white hover:bg-gray-800")}>
              <t.icon className="w-4 h-4" /><span className="flex-1 text-left">{t.l}</span>
              {t.badge !== null && t.badge > 0 && <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{t.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2"><div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs font-bold">A</div><div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{admin?.email}</p><p className="text-[10px] text-gray-500">Administrator</p></div></div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10"><LogOut className="w-4 h-4" /> Sign Out</button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 ml-64">
        <div className="p-6">

          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  {label:"Total Users",value:stats.total,icon:Users,color:"bg-blue-500/10 text-blue-400 border-blue-500/20"},
                  {label:"Online Now",value:stats.online,icon:Heart,color:"bg-emerald-500/10 text-emerald-400 border-emerald-500/20"},
                  {label:"Verified",value:stats.verified,icon:Shield,color:"bg-violet-500/10 text-violet-400 border-violet-500/20"},
                  {label:"Premium",value:stats.premium,icon:Gem,color:"bg-rose-500/10 text-rose-400 border-rose-500/20"},
                  {label:"Gold",value:stats.gold,icon:Crown,color:"bg-amber-500/10 text-amber-400 border-amber-500/20"},
                  {label:"Banned",value:stats.banned,icon:Ban,color:"bg-red-500/10 text-red-400 border-red-500/20"},
                  {label:"Pending Verif",value:stats.pendingVerif,icon:Camera,color:"bg-orange-500/10 text-orange-400 border-orange-500/20"},
                  {label:"Reports",value:stats.pendingReports,icon:AlertTriangle,color:"bg-yellow-500/10 text-yellow-400 border-yellow-500/20"},
                ].map((s,i) => (
                  <div key={i} className={"rounded-xl border p-4 " + s.color}>
                    <div className="flex items-center justify-between mb-2"><s.icon className="w-5 h-5" /><span className="text-2xl font-bold">{s.value}</span></div>
                    <p className="text-xs opacity-70">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Revenue summary */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-emerald-400 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Revenue Summary</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div><p className="text-xs text-gray-500">Coin Sales</p><p className="text-xl font-bold text-emerald-400">${revenue.totalRevenueUSD || "0.00"}</p></div>
                  <div><p className="text-xs text-gray-500">Gift Fee (20%)</p><p className="text-xl font-bold text-amber-400">${revenue.giftFeeUSD || "0.00"}</p></div>
                  <div><p className="text-xs text-gray-500">Upgrades</p><p className="text-xl font-bold text-violet-400">{(revenue.totalUpgrades||0).toLocaleString()}</p></div>
                  <div><p className="text-xs text-gray-500">Total Coins Sold</p><p className="text-xl font-bold text-blue-400">{(revenue.totalCoinsSold||0).toLocaleString()}</p></div>
                </div>
              </div>

              {/* Recent users */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4"><h3 className="font-bold">Recent Users</h3><button onClick={()=>setTab("users")} className="text-xs text-rose-400 hover:underline">View all →</button></div>
                <div className="space-y-2">
                  {users.filter(u=>u.email!=="admin@connecthub.com").slice(0,5).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-800" onClick={()=>{setSelectedUser(u);setTab("users");}}>
                      {u.profilePhoto?<img src={u.profilePhoto} className="w-10 h-10 rounded-full object-cover"/>:<div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm">{u.name[0]}</div>}
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                      <div className="flex items-center gap-2">
                        {isOnline(u.lastSeen)&&<div className="w-2 h-2 bg-emerald-500 rounded-full"/>}
                        <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (u.tier==="gold"?"bg-amber-500/20 text-amber-400":u.tier==="premium"?"bg-rose-500/20 text-rose-400":u.tier==="banned"?"bg-red-500/20 text-red-400":"bg-gray-700 text-gray-400")}>{u.tier}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {tab === "users" && !selectedUser && (
            <div>
              <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">All Users ({stats.total})</h1><button onClick={loadAll} className="p-2 rounded-lg hover:bg-gray-800"><RefreshCw className="w-4 h-4 text-gray-400" /></button></div>
              <div className="flex gap-3 mb-5">
                <div className="relative flex-1"><input className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-rose-500" placeholder="Search by name, email, username..." value={search} onChange={e=>setSearch(e.target.value)} /><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /></div>
                <select className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none" value={filterTier} onChange={e=>setFilterTier(e.target.value)}>
                  <option value="all">All Tiers</option><option value="free">Free</option><option value="premium">Premium</option><option value="gold">Gold</option><option value="banned">Banned</option>
                </select>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-gray-800/50 text-xs text-gray-500 font-medium">
                  <span>Photo</span><span>User</span><span>Tier</span><span>Status</span><span>Joined</span><span>Actions</span>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3 border-t border-gray-800/50 hover:bg-gray-800/30 cursor-pointer" onClick={()=>setSelectedUser(u)}>
                      <div>{u.profilePhoto?<img src={u.profilePhoto} className="w-9 h-9 rounded-full object-cover"/>:<div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">{u.name[0]}</div>}</div>
                      <div className="min-w-0"><p className="text-sm font-medium truncate">{u.name}</p><p className="text-xs text-gray-500 truncate">{u.email}{u.username?" · @"+u.username:""}</p></div>
                      <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (u.tier==="gold"?"bg-amber-500/20 text-amber-400":u.tier==="premium"?"bg-rose-500/20 text-rose-400":u.tier==="banned"?"bg-red-500/20 text-red-400":"bg-gray-700 text-gray-400")}>{u.tier}</span>
                      <div className="flex items-center gap-1.5">{isOnline(u.lastSeen)?<><div className="w-2 h-2 bg-emerald-500 rounded-full"/><span className="text-xs text-emerald-400">Online</span></>:<span className="text-xs text-gray-500">{u.lastSeen?timeAgo(u.lastSeen):"Never"}</span>}</div>
                      <span className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</span>
                      <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                        {u.tier!=="banned"?<button onClick={()=>handleUserAction(u.id,"ban")} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400" title="Ban"><Ban className="w-3.5 h-3.5"/></button>:<button onClick={()=>handleUserAction(u.id,"unban")} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400" title="Unban"><Check className="w-3.5 h-3.5"/></button>}
                        <button onClick={()=>handleUserAction(u.id,"delete")} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400" title="Delete"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USER DETAIL VIEW */}
          {tab === "users" && selectedUser && (
            <div>
              <button onClick={()=>setSelectedUser(null)} className="text-sm text-gray-500 hover:text-white mb-4 flex items-center gap-1">← Back to all users</button>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile card */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className={"h-24 bg-gradient-to-r " + (selectedUser.tier==="gold"?"from-amber-500 to-orange-500":selectedUser.tier==="premium"?"from-rose-500 to-pink-500":"from-gray-600 to-gray-700")} />
                  <div className="px-5 pb-5 -mt-10">
                    <div className="relative inline-block mb-3">
                      {selectedUser.profilePhoto?<img src={selectedUser.profilePhoto} onClick={()=>setPhotoViewer(selectedUser.profilePhoto)} className="w-20 h-20 rounded-2xl object-cover border-4 border-gray-900 cursor-pointer hover:opacity-80"/>:<div className="w-20 h-20 rounded-2xl bg-gray-700 border-4 border-gray-900 flex items-center justify-center text-2xl font-bold">{selectedUser.name[0]}</div>}
                      {isOnline(selectedUser.lastSeen)&&<div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-900"/>}
                    </div>
                    <h2 className="text-lg font-bold">{selectedUser.name}</h2>
                    {selectedUser.username&&<p className="text-sm text-gray-500">@{selectedUser.username}</p>}
                    {selectedUser.bio&&<p className="text-sm text-gray-400 mt-2">{selectedUser.bio}</p>}
                    {selectedUser.interests?.length>0&&<div className="flex flex-wrap gap-1 mt-3">{selectedUser.interests.map(t=><span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">{t}</span>)}</div>}
                  </div>
                </div>

                {/* Details */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wider">User Details</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      {icon:Mail,label:"Email",value:selectedUser.email},
                      {icon:Phone,label:"Phone",value:selectedUser.phone||"Not set"},
                      {icon:Globe,label:"Country",value:selectedUser.country||"Not set"},
                      {icon:Users,label:"Gender",value:selectedUser.gender||"Not set"},
                      {icon:Calendar,label:"Age",value:selectedUser.age?.toString()||"Not set"},
                      {icon:Heart,label:"Looking For",value:selectedUser.lookingFor||"Not set"},
                      {icon:Shield,label:"Verified",value:selectedUser.verified?"Yes ✓":"No"},
                      {icon:Crown,label:"Tier",value:selectedUser.tier},
                      {icon:Coins,label:"Coins",value:selectedUser.coins?.toLocaleString()||"0"},
                      {icon:Calendar,label:"Joined",value:new Date(selectedUser.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})},
                      {icon:Eye,label:"Last Seen",value:selectedUser.lastSeen?timeAgo(selectedUser.lastSeen):"Never"},
                    ].map((d,i)=>(
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                        <span className="flex items-center gap-2 text-gray-500"><d.icon className="w-3.5 h-3.5"/>{d.label}</span>
                        <span className="font-medium text-right">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions + Photos */}
                <div className="space-y-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <h3 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wider">Admin Actions</h3>
                    <div className="space-y-2">
                      {selectedUser.tier!=="premium"&&selectedUser.tier!=="gold"&&<button onClick={()=>handleUserAction(selectedUser.id,"makePremium")} disabled={actionLoading===selectedUser.id+"makePremium"} className="w-full py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/20 flex items-center justify-center gap-2"><Gem className="w-4 h-4"/>Give Premium</button>}
                      {selectedUser.tier!=="gold"&&<button onClick={()=>handleUserAction(selectedUser.id,"makeGold")} disabled={actionLoading===selectedUser.id+"makeGold"} className="w-full py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/20 flex items-center justify-center gap-2"><Crown className="w-4 h-4"/>Give Gold</button>}
                      {selectedUser.tier!=="banned"?<button onClick={()=>handleUserAction(selectedUser.id,"ban")} className="w-full py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/20 flex items-center justify-center gap-2"><Ban className="w-4 h-4"/>Ban User</button>:<button onClick={()=>handleUserAction(selectedUser.id,"unban")} className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center gap-2"><Check className="w-4 h-4"/>Unban User</button>}
                      <button onClick={()=>handleUserAction(selectedUser.id,"delete")} className="w-full py-2.5 bg-red-500/5 border border-red-500/20 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4"/>Delete Forever</button>
                    </div>
                  </div>

                  {/* Verification photos */}
                  {selectedUser.verificationPhoto && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <h3 className="font-bold mb-3 text-sm text-gray-400 uppercase tracking-wider">Verification Photos</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {(()=>{try{return JSON.parse(selectedUser.verificationPhoto);}catch{return [selectedUser.verificationPhoto];}})().map((p:string,i:number)=>(
                          <img key={i} src={p} className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80" onClick={()=>setPhotoViewer(p)} />
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedUser.idDocument && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <h3 className="font-bold mb-3 text-sm text-gray-400 uppercase tracking-wider">ID Document</h3>
                      <img src={selectedUser.idDocument} className="w-full rounded-lg cursor-pointer hover:opacity-80" onClick={()=>setPhotoViewer(selectedUser.idDocument!)} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VERIFICATIONS TAB */}
          {tab === "verifications" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Verifications ({verifications.length} pending)</h1>
              {verifications.length === 0 ? <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center"><Shield className="w-12 h-12 text-gray-700 mx-auto mb-3"/><p className="text-gray-500">No pending verifications</p></div> :
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {verifications.map((v:any) => (
                  <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        {v.profilePhoto?<img src={v.profilePhoto} className="w-12 h-12 rounded-full object-cover"/>:<div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold">{v.name[0]}</div>}
                        <div><p className="font-bold">{v.name}</p><p className="text-xs text-gray-500">{v.email}</p></div>
                      </div>
                      {/* Verification photos */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {(()=>{try{return JSON.parse(v.verificationPhoto);}catch{return [v.verificationPhoto];}})().map((p:string,i:number)=>(
                          <img key={i} src={p} className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80" onClick={()=>setPhotoViewer(p)} />
                        ))}
                      </div>
                      {v.idDocument && <div className="mb-4"><p className="text-xs text-gray-500 mb-1">ID Document:</p><img src={v.idDocument} className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80" onClick={()=>setPhotoViewer(v.idDocument)} /></div>}
                      <div className="flex gap-2">
                        <button onClick={()=>handleVerification(v.id,"approve")} disabled={actionLoading===v.id+"approve"} className="flex-1 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center gap-2"><Check className="w-4 h-4"/>Approve</button>
                        <button onClick={()=>handleVerification(v.id,"reject")} disabled={actionLoading===v.id+"reject"} className="flex-1 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/20 flex items-center justify-center gap-2"><X className="w-4 h-4"/>Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>}
            </div>
          )}

          {/* REPORTS TAB */}
          {tab === "reports" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">User Reports ({reports.length})</h1>
              {reports.length === 0 ? <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center"><AlertTriangle className="w-12 h-12 text-gray-700 mx-auto mb-3"/><p className="text-gray-500">No reports</p></div> :
              <div className="space-y-3">
                {reports.map((r:any) => (
                  <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <div className="flex-1"><p className="font-medium text-sm">Report against <span className="text-rose-400">{r.reported?.name||"Unknown"}</span></p><p className="text-xs text-gray-500">By {r.reporter?.name||"Unknown"} · {timeAgo(r.createdAt)}</p></div>
                      <span className={"text-xs px-2 py-0.5 rounded-full font-bold " + (r.status==="pending"?"bg-amber-500/20 text-amber-400":"bg-gray-700 text-gray-400")}>{r.status}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2"><span className="text-gray-500">Reason:</span> {r.reason}</p>
                    {r.details&&<p className="text-sm text-gray-500">{r.details}</p>}
                    {r.status==="pending"&&<div className="flex gap-2 mt-3">
                      <button onClick={()=>handleUserAction(r.reported?.id||r.reportedId,"ban")} className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-400">Ban Reported User</button>
                    </div>}
                  </div>
                ))}
              </div>}
            </div>
          )}

          {/* REVENUE TAB */}
          {tab === "revenue" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Revenue & Monetization</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5"><p className="text-xs text-emerald-400 mb-1">Total Revenue (USD)</p><p className="text-3xl font-bold text-emerald-400">${revenue.totalRevenueUSD||"0.00"}</p><p className="text-xs text-gray-500 mt-1">{(revenue.totalCoinsSold||0).toLocaleString()} coins sold</p></div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5"><p className="text-xs text-amber-400 mb-1">Gift Platform Fee</p><p className="text-3xl font-bold text-amber-400">${revenue.giftFeeUSD||"0.00"}</p><p className="text-xs text-gray-500 mt-1">{revenue.totalGifts||0} gifts · 20% fee</p></div>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-5"><p className="text-xs text-violet-400 mb-1">Upgrades</p><p className="text-3xl font-bold text-violet-400">{(revenue.upgradeRevenue||0).toLocaleString()}</p><p className="text-xs text-gray-500 mt-1">{revenue.totalUpgrades||0} users upgraded</p></div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5"><p className="text-xs text-blue-400 mb-1">Profile Boosts</p><p className="text-3xl font-bold text-blue-400">{(revenue.boostRevenue||0).toLocaleString()}</p><p className="text-xs text-gray-500 mt-1">{revenue.totalBoosts||0} boosts sold</p></div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-emerald-400 mb-4">How ConnectHub Makes Money</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {t:"Coin Sales",d:"Users buy coins: 100=$0.99, 500=$3.99, 1000=$6.99, 5000=$29.99. You keep ~97% (Stripe takes 2.9%)."},
                    {t:"Gift Platform Fee",d:"Every gift sent between users, you keep 20%. Rose (10 coins) → you earn 2 coins. Island (5000) → you earn 1000."},
                    {t:"Premium/Gold Upgrades",d:"Users spend 2,000-5,000 coins to upgrade. This drives more coin purchases."},
                    {t:"Profile Boosts",d:"100 coins per 30-min boost. Active users boost weekly — recurring revenue."},
                  ].map((r,i) => <div key={i} className="bg-gray-900/50 rounded-xl p-4"><p className="font-bold text-white text-sm mb-1">{r.t}</p><p className="text-xs text-gray-400">{r.d}</p></div>)}
                </div>
              </div>

              {revenue.topSpenders?.length>0&&(
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-bold mb-4">Top Spenders</h3>
                  <div className="space-y-2">{revenue.topSpenders.map((s:any,i:number)=>(
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                      <span className="text-lg w-6 text-center">{i<3?["🥇","🥈","🥉"][i]:"#"+(i+1)}</span>
                      {s.user?.profilePhoto?<img src={s.user.profilePhoto} className="w-9 h-9 rounded-full object-cover"/>:<div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">{s.user?.name?.[0]}</div>}
                      <div className="flex-1"><p className="text-sm font-medium">{s.user?.name}</p></div>
                      <span className="text-amber-400 font-bold text-sm">{s.spent?.toLocaleString()} coins</span>
                    </div>
                  ))}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Photo viewer overlay */}
      {photoViewer && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={()=>setPhotoViewer(null)}>
          <img src={photoViewer} className="max-w-full max-h-[90vh] object-contain rounded-2xl" />
          <button onClick={()=>setPhotoViewer(null)} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20"><X className="w-6 h-6 text-white" /></button>
        </div>
      )}
    </div>
  );
}
