"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, Crown, Ban, Eye, Search, ChevronDown, LogOut, Gem, Sparkles, Check, X, Trash2, UserCheck, Image, Globe, Phone, Mail, Calendar, Coins, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPhoto, setShowPhoto] = useState<string|null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [tab, setTab] = useState("users");

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || {});

      const vRes = await fetch("/api/admin/verifications");
      if (vRes.ok) { const vData = await vRes.json(); setVerifications(vData.verifications || []); }

      const rRes = await fetch("/api/admin/reports");
      if (rRes.ok) { const rData = await rRes.json(); setReports(rData.reports || []); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = async (action: string, userId: string, tier?: string) => {
    if (action === "delete" && !confirm("Delete this user permanently?")) return;
    if (action === "ban" && !confirm("Ban this user?")) return;
    await fetch("/api/admin/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action, userId, tier }) });
    loadData();
    if (selectedUser?.id === userId) setSelectedUser(null);
  };

  const logout = () => { fetch("/api/admin/logout", { method:"POST" }); router.push("/admin"); };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search);
    const matchFilter = filter === "all" || (filter === "verified" && u.verified) || (filter === "premium" && (u.tier === "premium" || u.tier === "gold")) || (filter === "banned" && u.tier === "banned") || (filter === "basic" && u.tier === "basic");
    return matchSearch && matchFilter;
  });

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "N/A";
  const isOnline = (d: string) => d && Date.now() - new Date(d).getTime() < 5 * 60 * 1000;

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-red-500" />
          <h1 className="text-lg font-bold">ConnectHub Admin</h1>
        </div>
        <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium"><LogOut className="w-4 h-4" /> Logout</button>
      </header>

      {/* Stats */}
      <div className="px-6 py-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label:"Total Users", value:stats.totalUsers, icon:Users, color:"text-blue-400", bg:"bg-blue-500/10" },
          { label:"Verified", value:stats.verifiedUsers, icon:UserCheck, color:"text-emerald-400", bg:"bg-emerald-500/10" },
          { label:"Premium/Gold", value:stats.premiumUsers, icon:Crown, color:"text-amber-400", bg:"bg-amber-500/10" },
          { label:"Banned", value:stats.bannedUsers, icon:Ban, color:"text-red-400", bg:"bg-red-500/10" },
          { label:"Online Now", value:stats.onlineNow, icon:Eye, color:"text-green-400", bg:"bg-green-500/10" },
        ].map((s,i) => (
          <div key={i} className={"rounded-xl p-4 border border-gray-700 " + s.bg}>
            <s.icon className={"w-5 h-5 mb-2 " + s.color} />
            <p className="text-2xl font-bold">{s.value || 0}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-1 mb-4">
        {[{k:"users",l:"All Users",icon:Users},{k:"verify",l:"Verifications",icon:Shield},{k:"reports",l:"Reports",icon:AlertTriangle}].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} className={"flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium " + (tab===t.k?"bg-red-500/20 text-red-400":"text-gray-400 hover:bg-gray-800")}><t.icon className="w-4 h-4" />{t.l}</button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <div className="px-6">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1"><input className="w-full px-4 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" placeholder="Search by name, email, username, phone..." value={search} onChange={e => setSearch(e.target.value)} /><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /></div>
            <select className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All Users</option><option value="verified">Verified</option><option value="premium">Premium/Gold</option><option value="banned">Banned</option><option value="basic">Basic</option>
            </select>
          </div>

          <p className="text-xs text-gray-500 mb-3">{filtered.length} users found</p>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filtered.map(u => (
              <div key={u.id} className={"flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all " + (selectedUser?.id === u.id ? "bg-gray-700 border-red-500/50" : "bg-gray-800 border-gray-700 hover:border-gray-600")} onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}>
                <div className="relative">
                  {u.profilePhoto ? (
                    <img src={u.profilePhoto} className="w-12 h-12 rounded-full object-cover cursor-pointer" onClick={e => { e.stopPropagation(); setShowPhoto(u.profilePhoto); }} />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{u.name?.[0]||"?"}</div>
                  )}
                  {isOnline(u.lastSeen) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{u.name}</p>
                    {u.username && <span className="text-xs text-gray-500">@{u.username}</span>}
                    {u.tier==="gold"&&<Crown className="w-3.5 h-3.5 text-amber-400"/>}
                    {u.tier==="premium"&&<Gem className="w-3.5 h-3.5 text-rose-400"/>}
                    {u.verified&&<Shield className="w-3.5 h-3.5 text-blue-400"/>}
                    {u.tier==="banned"&&<Ban className="w-3.5 h-3.5 text-red-400"/>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-xs text-gray-500">{formatDate(u.createdAt)}</p>
                  <div className="flex items-center gap-1 justify-end"><Coins className="w-3 h-3 text-amber-400" /><span className="text-xs text-amber-400">{u.coins||0}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected User Details */}
          {selectedUser && (
            <div className="mt-4 bg-gray-800 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                {selectedUser.profilePhoto ? (
                  <img src={selectedUser.profilePhoto} className="w-20 h-20 rounded-2xl object-cover cursor-pointer" onClick={() => setShowPhoto(selectedUser.profilePhoto)} />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">{selectedUser.name?.[0]}</div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  {selectedUser.username && <p className="text-sm text-gray-400">@{selectedUser.username}</p>}
                  {selectedUser.bio && <p className="text-sm text-gray-300 mt-1">{selectedUser.bio}</p>}
                  {selectedUser.interests?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">{selectedUser.interests.map((t: string) => <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">{t}</span>)}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { icon:Mail, label:"Email", value:selectedUser.email },
                  { icon:Phone, label:"Phone", value:selectedUser.phone || "N/A" },
                  { icon:Globe, label:"Country", value:selectedUser.country || "N/A" },
                  { icon:Calendar, label:"Age", value:selectedUser.age ? selectedUser.age+" years" : "N/A" },
                  { icon:Users, label:"Gender", value:selectedUser.gender || "N/A" },
                  { icon:Eye, label:"Looking For", value:selectedUser.lookingFor || "N/A" },
                  { icon:Coins, label:"Coins", value:String(selectedUser.coins || 0) },
                  { icon:Calendar, label:"Joined", value:formatDate(selectedUser.createdAt) },
                ].map((info,i) => (
                  <div key={i} className="bg-gray-700/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1"><info.icon className="w-3.5 h-3.5 text-gray-500" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">{info.label}</span></div>
                    <p className="text-sm font-medium truncate">{info.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedUser.tier !== "banned" ? (
                  <button onClick={() => handleAction("ban", selectedUser.id)} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/30"><Ban className="w-4 h-4" /> Ban User</button>
                ) : (
                  <button onClick={() => handleAction("unban", selectedUser.id)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30"><Check className="w-4 h-4" /> Unban</button>
                )}
                <button onClick={() => handleAction("changeTier", selectedUser.id, "premium")} className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-500/30"><Gem className="w-4 h-4" /> Set Premium</button>
                <button onClick={() => handleAction("changeTier", selectedUser.id, "gold")} className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-500/30"><Crown className="w-4 h-4" /> Set Gold</button>
                <button onClick={() => handleAction("changeTier", selectedUser.id, "basic")} className="flex items-center gap-2 px-4 py-2 bg-gray-600/50 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-600"><Sparkles className="w-4 h-4" /> Set Basic</button>
                <button onClick={() => handleAction("delete", selectedUser.id)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"><Trash2 className="w-4 h-4" /> Delete</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification Tab */}
      {tab === "verify" && (
        <div className="px-6">
          {verifications.length === 0 ? <p className="text-center py-16 text-gray-500">No pending verifications</p> : (
            <div className="space-y-3">{verifications.map((v:any) => (
              <div key={v.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  {v.profilePhoto ? <img src={v.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-rose-500/30 flex items-center justify-center text-white font-bold">{v.name?.[0]}</div>}
                  <div><p className="font-bold">{v.name}</p><p className="text-xs text-gray-400">{v.email}</p></div>
                </div>
                {v.verificationPhoto && <div className="flex gap-2 mb-3">{(Array.isArray(v.verificationPhoto) ? v.verificationPhoto : [v.verificationPhoto]).map((p:string,i:number) => <img key={i} src={p} className="h-24 rounded-lg object-cover cursor-pointer" onClick={() => setShowPhoto(p)} />)}</div>}
                {v.idDocument && <img src={v.idDocument} className="h-24 rounded-lg mb-3 cursor-pointer" onClick={() => setShowPhoto(v.idDocument)} />}
              </div>
            ))}</div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {tab === "reports" && (
        <div className="px-6">
          {reports.length === 0 ? <p className="text-center py-16 text-gray-500">No reports</p> : (
            <div className="space-y-3">{reports.map((r:any) => (
              <div key={r.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (r.status==="pending"?"bg-amber-500/20 text-amber-400":"bg-emerald-500/20 text-emerald-400")}>{r.status}</span>
                  <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
                </div>
                <p className="text-sm"><span className="text-red-400 font-bold">Reason:</span> {r.reason}</p>
                {r.details && <p className="text-xs text-gray-400 mt-1">{r.details}</p>}
              </div>
            ))}</div>
          )}
        </div>
      )}

      {/* Photo viewer */}
      {showPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowPhoto(null)}>
          <img src={showPhoto} className="max-w-full max-h-full rounded-2xl object-contain" />
          <button className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20"><X className="w-6 h-6" /></button>
        </div>
      )}
    </div>
  );
}
