"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, Crown, Ban, Eye, Search, LogOut, Gem, Sparkles, Check, X, Trash2, UserCheck, Globe, Phone, Mail, Calendar, Coins, AlertTriangle, ScanFace, Image, ChevronDown, RefreshCw } from "lucide-react";

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
  const [verifications, setVerifications] = useState<any>({ pending:[], approved:[], rejected:[], stats:{} });
  const [tab, setTab] = useState("users");
  const [revenue, setRevenue] = useState<any>({});
  const [verifyTab, setVerifyTab] = useState("pending");
  const [actionLoading, setActionLoading] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      setUsers(data.users || []); setStats(data.stats || {});

      const vRes = await fetch("/api/admin/verifications");
      if (vRes.ok) setVerifications(await vRes.json());

      const rRes = await fetch("/api/admin/reports");

      const revRes = await fetch("/api/admin/revenue");
      if (revRes.ok) setRevenue(await revRes.json());
      if (rRes.ok) { const rData = await rRes.json(); setReports(rData.reports || []); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleUserAction = async (action: string, userId: string, tier?: string) => {
    if (action === "delete" && !confirm("Delete this user permanently? This cannot be undone.")) return;
    if (action === "ban" && !confirm("Ban this user? They will not be able to log in.")) return;
    setActionLoading(userId + action);
    await fetch("/api/admin/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action, userId, tier }) });
    await loadData();
    if (selectedUser?.id === userId) setSelectedUser(null);
    setActionLoading("");
  };

  const handleVerifyAction = async (action: string, userId: string) => {
    setActionLoading(userId + action);
    await fetch("/api/admin/verifications", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action, userId }) });
    await loadData();
    setActionLoading("");
  };

  const logout = () => { fetch("/api/admin/logout", { method:"POST" }); router.push("/admin"); };

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    const matchSearch = !s || u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.username?.toLowerCase().includes(s) || u.phone?.includes(search);
    const matchFilter = filter==="all" || (filter==="verified"&&u.verified) || (filter==="premium"&&(u.tier==="premium"||u.tier==="gold")) || (filter==="banned"&&u.tier==="banned") || (filter==="basic"&&u.tier==="basic");
    return matchSearch && matchFilter;
  });

  const formatDate = (d:string) => d ? new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "N/A";
  const isOnline = (d:string) => d && Date.now()-new Date(d).getTime() < 5*60*1000;

  const parsePhotos = (data: any): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try { const parsed = JSON.parse(data); return Array.isArray(parsed) ? parsed : [data]; } catch { return typeof data === "string" ? [data] : []; }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3"><Shield className="w-6 h-6 text-red-500" /><h1 className="text-lg font-bold">ConnectHub Admin</h1></div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>
          <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 py-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label:"Total Users", value:stats.totalUsers, icon:Users, color:"text-blue-400", bg:"bg-blue-500/10" },
          { label:"Verified", value:stats.verifiedUsers, icon:UserCheck, color:"text-emerald-400", bg:"bg-emerald-500/10" },
          { label:"Premium/Gold", value:stats.premiumUsers, icon:Crown, color:"text-amber-400", bg:"bg-amber-500/10" },
          { label:"Pending Verify", value:verifications.stats?.pending||0, icon:ScanFace, color:"text-violet-400", bg:"bg-violet-500/10" },
          { label:"Reports", value:reports.length, icon:AlertTriangle, color:"text-red-400", bg:"bg-red-500/10" },
        ].map((s,i) => (
          <div key={i} className={"rounded-xl p-4 border border-gray-700 " + s.bg}><s.icon className={"w-5 h-5 mb-2 " + s.color} /><p className="text-2xl font-bold">{s.value||0}</p><p className="text-xs text-gray-400">{s.label}</p></div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-1 mb-4">
        {[{k:"users",l:"All Users ("+users.length+")",icon:Users},{k:"verify",l:"Verifications ("+(verifications.stats?.pending||0)+")",icon:ScanFace},{k:"reports",l:"Reports ("+reports.length+")",icon:AlertTriangle},{k:"revenue",l:"Revenue",icon:Coins}].map(t => (
          <button key={t.k} onClick={()=>setTab(t.k)} className={"flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium " + (tab===t.k?"bg-red-500/20 text-red-400":"text-gray-400 hover:bg-gray-800")}><t.icon className="w-4 h-4" />{t.l}</button>
        ))}
      </div>

      {/* ===== USERS TAB ===== */}
      {tab === "users" && (
        <div className="px-6">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1"><input className="w-full px-4 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" placeholder="Search name, email, username, phone..." value={search} onChange={e=>setSearch(e.target.value)} /><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /></div>
            <select className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All Users</option><option value="verified">Verified</option><option value="premium">Premium/Gold</option><option value="banned">Banned</option><option value="basic">Basic</option></select>
          </div>
          <p className="text-xs text-gray-500 mb-3">{filtered.length} users found</p>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {filtered.map(u => (
              <div key={u.id} className={"flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all " + (selectedUser?.id===u.id?"bg-gray-700 border-red-500/50":"bg-gray-800 border-gray-700 hover:border-gray-600")} onClick={()=>setSelectedUser(selectedUser?.id===u.id?null:u)}>
                <div className="relative">
                  {u.profilePhoto ? <img src={u.profilePhoto} className="w-12 h-12 rounded-full object-cover cursor-pointer" onClick={e=>{e.stopPropagation();setShowPhoto(u.profilePhoto);}} /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{u.name?.[0]||"?"}</div>}
                  {isOnline(u.lastSeen)&&<div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-bold text-sm truncate">{u.name}</p>{u.username&&<span className="text-xs text-gray-500">@{u.username}</span>}{u.tier==="gold"&&<Crown className="w-3.5 h-3.5 text-amber-400"/>}{u.tier==="premium"&&<Gem className="w-3.5 h-3.5 text-rose-400"/>}{u.verified&&<Shield className="w-3.5 h-3.5 text-blue-400"/>}{u.tier==="banned"&&<Ban className="w-3.5 h-3.5 text-red-400"/>}</div>
                  <p className="text-xs text-gray-500 truncate">{u.email} {u.phone ? "| "+u.phone : ""}</p>
                </div>
                <div className="text-right hidden md:block"><p className="text-xs text-gray-500">{formatDate(u.createdAt)}</p><div className="flex items-center gap-1 justify-end"><Coins className="w-3 h-3 text-amber-400"/><span className="text-xs text-amber-400">{u.coins||0}</span></div></div>
              </div>
            ))}
          </div>

          {selectedUser && (
            <div className="mt-4 bg-gray-800 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                {selectedUser.profilePhoto ? <img src={selectedUser.profilePhoto} className="w-20 h-20 rounded-2xl object-cover cursor-pointer" onClick={()=>setShowPhoto(selectedUser.profilePhoto)} /> : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">{selectedUser.name?.[0]}</div>}
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  {selectedUser.username && <p className="text-sm text-gray-400">@{selectedUser.username}</p>}
                  {selectedUser.bio && <p className="text-sm text-gray-300 mt-1">{selectedUser.bio}</p>}
                  {selectedUser.interests?.length>0&&<div className="flex flex-wrap gap-1 mt-2">{selectedUser.interests.map((t:string)=><span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">{t}</span>)}</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[{icon:Mail,label:"Email",value:selectedUser.email},{icon:Phone,label:"Phone",value:selectedUser.phone||"N/A"},{icon:Globe,label:"Country",value:selectedUser.country||"N/A"},{icon:Calendar,label:"Age",value:selectedUser.age?selectedUser.age+" yrs":"N/A"},{icon:Users,label:"Gender",value:selectedUser.gender||"N/A"},{icon:Eye,label:"Looking For",value:selectedUser.lookingFor||"N/A"},{icon:Coins,label:"Coins",value:String(selectedUser.coins||0)},{icon:Calendar,label:"Joined",value:formatDate(selectedUser.createdAt)}].map((info,i) => (
                  <div key={i} className="bg-gray-700/50 rounded-xl p-3"><div className="flex items-center gap-1.5 mb-1"><info.icon className="w-3.5 h-3.5 text-gray-500"/><span className="text-[10px] text-gray-500 uppercase tracking-wider">{info.label}</span></div><p className="text-sm font-medium truncate">{info.value}</p></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedUser.tier!=="banned"?<button onClick={()=>handleUserAction("ban",selectedUser.id)} disabled={actionLoading===selectedUser.id+"ban"} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/30 disabled:opacity-50"><Ban className="w-4 h-4"/>{actionLoading===selectedUser.id+"ban"?"...":"Ban"}</button>:<button onClick={()=>handleUserAction("unban",selectedUser.id)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30"><Check className="w-4 h-4"/>Unban</button>}
                <button onClick={()=>handleUserAction("changeTier",selectedUser.id,"premium")} className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-500/30"><Gem className="w-4 h-4"/>Set Premium</button>
                <button onClick={()=>handleUserAction("changeTier",selectedUser.id,"gold")} className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-500/30"><Crown className="w-4 h-4"/>Set Gold</button>
                <button onClick={()=>handleUserAction("changeTier",selectedUser.id,"basic")} className="flex items-center gap-2 px-4 py-2 bg-gray-600/50 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-600"><Sparkles className="w-4 h-4"/>Set Basic</button>
                <button onClick={()=>handleUserAction("delete",selectedUser.id)} disabled={actionLoading===selectedUser.id+"delete"} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"><Trash2 className="w-4 h-4"/>{actionLoading===selectedUser.id+"delete"?"Deleting...":"Delete"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== VERIFICATION TAB ===== */}
      {tab === "verify" && (
        <div className="px-6">
          <div className="flex gap-2 mb-4">
            {[{k:"pending",l:"Pending ("+((verifications.pending||[]).length)+")",color:"text-amber-400 bg-amber-500/20"},{k:"approved",l:"Approved ("+((verifications.approved||[]).length)+")",color:"text-emerald-400 bg-emerald-500/20"},{k:"rejected",l:"Rejected ("+((verifications.rejected||[]).length)+")",color:"text-red-400 bg-red-500/20"}].map(t=>(
              <button key={t.k} onClick={()=>setVerifyTab(t.k)} className={"px-4 py-2 rounded-lg text-sm font-medium " + (verifyTab===t.k?t.color:"text-gray-500 hover:bg-gray-800")}>{t.l}</button>
            ))}
          </div>

          {(verifications[verifyTab]||[]).length === 0 ? (
            <div className="text-center py-16"><ScanFace className="w-12 h-12 mx-auto text-gray-600 mb-3" /><p className="text-gray-500">No {verifyTab} verifications</p></div>
          ) : (
            <div className="space-y-4">
              {(verifications[verifyTab]||[]).map((v:any) => {
                const facePhotos = parsePhotos(v.verificationPhoto);
                return (
                  <div key={v.id} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                    {/* User info header */}
                    <div className="p-5 flex items-center gap-4 border-b border-gray-700">
                      {v.profilePhoto ? <img src={v.profilePhoto} className="w-14 h-14 rounded-xl object-cover cursor-pointer" onClick={()=>setShowPhoto(v.profilePhoto)} /> : <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold">{v.name?.[0]}</div>}
                      <div className="flex-1">
                        <p className="font-bold text-lg">{v.name}</p>
                        <p className="text-sm text-gray-400">{v.email} {v.phone ? " | "+v.phone : ""}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {v.age && <span>Age: {v.age}</span>}
                          {v.gender && <span>{v.gender}</span>}
                          {v.country && <span><Globe className="w-3 h-3 inline mr-1"/>{v.country}</span>}
                          <span>Joined {formatDate(v.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Profile Photo vs Face Photos comparison */}
                    <div className="p-5">
                      <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><Image className="w-4 h-4" /> Profile Photo vs Verification Photos</h4>
                      <div className="flex gap-3 flex-wrap">
                        {/* Profile photo */}
                        <div className="text-center">
                          {v.profilePhoto ? <img src={v.profilePhoto} className="w-28 h-28 rounded-xl object-cover cursor-pointer border-2 border-blue-500" onClick={()=>setShowPhoto(v.profilePhoto)} /> : <div className="w-28 h-28 rounded-xl bg-gray-700 flex items-center justify-center text-gray-500 text-sm">No photo</div>}
                          <p className="text-[10px] text-blue-400 font-bold mt-1">Profile Photo</p>
                        </div>

                        {/* Face verification photos */}
                        {facePhotos.map((p:string,i:number) => (
                          <div key={i} className="text-center">
                            <img src={p} className="w-28 h-28 rounded-xl object-cover cursor-pointer border-2 border-emerald-500/50 hover:border-emerald-400" onClick={()=>setShowPhoto(p)} />
                            <p className="text-[10px] text-emerald-400 font-bold mt-1">{["Front","Left","Right","Smile"][i]||"Photo "+(i+1)}</p>
                          </div>
                        ))}
                      </div>

                      {/* ID Document */}
                      {v.idDocument && (
                        <div className="mt-4">
                          <h4 className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> ID Document</h4>
                          <img src={v.idDocument} className="max-h-48 rounded-xl object-contain cursor-pointer border-2 border-amber-500/50 hover:border-amber-400" onClick={()=>setShowPhoto(v.idDocument)} />
                          <p className="text-[10px] text-amber-400 font-bold mt-1">Government ID</p>
                        </div>
                      )}

                      {/* Verification Checklist */}
                      {verifyTab === "pending" && (
                        <div className="mt-4 bg-gray-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-bold text-gray-300 mb-3">Review Checklist</h4>
                          <div className="space-y-2 text-sm text-gray-400">
                            <label className="flex items-center gap-2"><input type="checkbox" className="accent-emerald-500" /> Face in verification photos matches profile photo</label>
                            <label className="flex items-center gap-2"><input type="checkbox" className="accent-emerald-500" /> All 4 poses are clear (front, left, right, smile)</label>
                            <label className="flex items-center gap-2"><input type="checkbox" className="accent-emerald-500" /> ID document is readable and not expired</label>
                            <label className="flex items-center gap-2"><input type="checkbox" className="accent-emerald-500" /> Name on ID matches profile name</label>
                            <label className="flex items-center gap-2"><input type="checkbox" className="accent-emerald-500" /> Photo on ID matches face in verification</label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {verifyTab === "pending" && (
                      <div className="px-5 pb-5 flex gap-3">
                        <button onClick={()=>handleVerifyAction("approve",v.id)} disabled={actionLoading===v.id+"approve"} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50 transition-all">
                          <Check className="w-5 h-5" /> {actionLoading===v.id+"approve"?"Approving...":"Approve"}
                        </button>
                        <button onClick={()=>handleVerifyAction("reject",v.id)} disabled={actionLoading===v.id+"reject"} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50 transition-all">
                          <X className="w-5 h-5" /> {actionLoading===v.id+"reject"?"Rejecting...":"Reject"}
                        </button>
                      </div>
                    )}

                    {verifyTab !== "pending" && (
                      <div className="px-5 pb-5">
                        <span className={"inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full " + (verifyTab==="approved"?"bg-emerald-500/20 text-emerald-400":"bg-red-500/20 text-red-400")}>
                          {verifyTab==="approved"?<Check className="w-3 h-3"/>:<X className="w-3 h-3"/>} {verifyTab==="approved"?"Approved":"Rejected"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== REPORTS TAB ===== */}
      {tab === "reports" && (
        <div className="px-6">
          {reports.length === 0 ? (
            <div className="text-center py-16"><AlertTriangle className="w-12 h-12 mx-auto text-gray-600 mb-3" /><p className="text-gray-500">No reports submitted</p></div>
          ) : (
            <div className="space-y-3">
              {reports.map((r:any) => {
                const reporter = users.find(u => u.id === r.reporterId);
                const reported = users.find(u => u.id === r.reportedId);
                return (
                  <div key={r.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (r.status==="pending"?"bg-amber-500/20 text-amber-400":"bg-emerald-500/20 text-emerald-400")}>{r.status.toUpperCase()}</span>
                      <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-6 mb-3">
                      <div className="flex items-center gap-2">
                        {reporter?.profilePhoto ? <img src={reporter.profilePhoto} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center text-white text-xs font-bold">{reporter?.name?.[0]||"?"}</div>}
                        <div><p className="text-xs text-gray-500">Reported by</p><p className="text-sm font-bold">{reporter?.name||"Unknown"}</p></div>
                      </div>
                      <span className="text-gray-600">→</span>
                      <div className="flex items-center gap-2">
                        {reported?.profilePhoto ? <img src={reported.profilePhoto} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center text-white text-xs font-bold">{reported?.name?.[0]||"?"}</div>}
                        <div><p className="text-xs text-gray-500">Reported user</p><p className="text-sm font-bold">{reported?.name||"Unknown"}</p></div>
                      </div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm"><span className="text-red-400 font-bold">Reason:</span> {r.reason}</p>
                      {r.details && <p className="text-xs text-gray-400 mt-1">{r.details}</p>}
                    </div>
                    {r.status === "pending" && reported && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={()=>handleUserAction("ban",reported.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30"><Ban className="w-3 h-3"/>Ban User</button>
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-600/50 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-600">Dismiss</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* REVENUE TAB */}
      {tab === "revenue" && (
        <div className="px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"><p className="text-xs text-emerald-400 mb-1">Coin Sales Revenue</p><p className="text-2xl font-bold text-emerald-400">${revenue.totalRevenueUSD || "0.00"}</p><p className="text-xs text-gray-500">{revenue.totalCoinsSold?.toLocaleString() || 0} coins sold</p></div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"><p className="text-xs text-amber-400 mb-1">Gift Platform Fee (20%)</p><p className="text-2xl font-bold text-amber-400">${revenue.giftFeeUSD || "0.00"}</p><p className="text-xs text-gray-500">{revenue.totalGifts || 0} gifts sent</p></div>
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4"><p className="text-xs text-violet-400 mb-1">Upgrades</p><p className="text-2xl font-bold text-violet-400">{revenue.upgradeRevenue?.toLocaleString() || 0}</p><p className="text-xs text-gray-500">{revenue.totalUpgrades || 0} upgrades</p></div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"><p className="text-xs text-blue-400 mb-1">Profile Boosts</p><p className="text-2xl font-bold text-blue-400">{revenue.boostRevenue?.toLocaleString() || 0}</p><p className="text-xs text-gray-500">{revenue.totalBoosts || 0} boosts</p></div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 mb-6">
            <h3 className="text-white text-sm font-medium mb-2">How You Make Money</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4"><p className="text-white font-bold">1. Coin Sales</p><p className="text-emerald-100 text-xs mt-1">Users buy coins with real money. 100 coins = $0.99, 500 = $3.99, 1000 = $6.99, 5000 = $29.99</p></div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4"><p className="text-white font-bold">2. Gift Platform Fee</p><p className="text-emerald-100 text-xs mt-1">You keep 20% of every gift sent between users. If someone sends a 500-coin gift, you earn 100 coins.</p></div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4"><p className="text-white font-bold">3. Premium/Gold Upgrades</p><p className="text-emerald-100 text-xs mt-1">Users spend 2,000 or 5,000 coins to upgrade. More upgrades = more coin purchases.</p></div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4"><p className="text-white font-bold">4. Profile Boosts</p><p className="text-emerald-100 text-xs mt-1">Users spend 100 coins per boost (30 min). Recurring revenue from active users.</p></div>
            </div>
          </div>

          {revenue.topSpenders?.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-6">
              <h3 className="font-bold text-white mb-3">Top Spenders</h3>
              <div className="space-y-2">{revenue.topSpenders.map((s:any, i:number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl">
                  <span className="text-lg w-6 text-center">{i<3?["🥇","🥈","🥉"][i]:"#"+(i+1)}</span>
                  {s.user?.profilePhoto?<img src={s.user.profilePhoto} className="w-9 h-9 rounded-full object-cover"/>:<div className="w-9 h-9 rounded-full bg-rose-500/30 flex items-center justify-center text-white text-sm font-bold">{s.user?.name?.[0]}</div>}
                  <div className="flex-1"><p className="font-bold text-sm">{s.user?.name}</p></div>
                  <span className="text-amber-400 font-bold text-sm">{s.spent?.toLocaleString()} coins</span>
                </div>
              ))}</div>
            </div>
          )}
        </div>
      )}

      {/* Full screen photo viewer */}
      {showPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={()=>setShowPhoto(null)}>
          <img src={showPhoto} className="max-w-full max-h-full rounded-2xl object-contain" />
          <button className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-3 hover:bg-white/20"><X className="w-6 h-6" /></button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-400">Click anywhere to close</p>
        </div>
      )}
    </div>
  );
}
