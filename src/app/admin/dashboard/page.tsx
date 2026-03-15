"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Users, Shield, BarChart3, Settings, LogOut, Search, Check, X, Trash2, Ban, Eye, RefreshCw, UserCheck, Clock, ChevronLeft, ChevronRight, Image as ImageIcon, FileText, UserCircle } from "lucide-react";

type User = { id:string; name:string; email:string; age:number|null; gender:string|null; lookingFor:string|null; bio:string|null; profilePhoto:string|null; tier:string; verified:boolean; verificationStatus:string; verificationPhoto:string|null; idDocument:string|null; createdAt:string; };
type Stats = { total:number; verified:number; basic:number; pending:number; today:number; };

function parsePhotos(photo: string|null): string[] {
  if (!photo) return [];
  try { const arr = JSON.parse(photo); if (Array.isArray(arr)) return arr; return [photo]; }
  catch { return photo.startsWith("data:") ? [photo] : []; }
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total:0, verified:0, basic:0, pending:0, today:0 });
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [viewPhotos, setViewPhotos] = useState<{photos:string[]; labels:string[]}|null>(null);
  const [viewIdx, setViewIdx] = useState(0);

  useEffect(() => { fetch("/api/admin/me").then(res => { if (res.ok) setAuthed(true); else router.push("/admin"); }).catch(() => router.push("/admin")); }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch("/api/admin/users"); if (res.ok) { const d = await res.json(); setUsers(d.users); setStats(d.stats); } } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  const action = async (userId: string, act: string) => {
    await fetch("/api/admin/users", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId,action:act}) });
    setToast(act==="approve"?"User verified!":act==="reject"?"Rejected":act==="ban"?"Banned":"Unbanned");
    setTimeout(()=>setToast(""),3000); load();
  };

  const deleteUser = async (userId: string, name: string) => {
    if (!confirm("Delete " + name + "? This cannot be undone.")) return;
    await fetch("/api/admin/users", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId}) });
    setToast("Deleted"); setTimeout(()=>setToast(""),3000); load();
  };

  const logout = () => { document.cookie = "admin_session=; Max-Age=0; path=/"; router.push("/admin"); };
  const filtered = users.filter(u => { if (!search) return true; const s = search.toLowerCase(); return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s); });
  const tabs = [ { key:"overview", label:"Overview", icon:BarChart3 }, { key:"users", label:"All Users", icon:Users }, { key:"verification", label:"Verification", icon:Shield }, { key:"settings", label:"Settings", icon:Settings } ];

  const openAllPhotos = (u: User) => {
    const allPhotos: string[] = [];
    const allLabels: string[] = [];
    if (u.profilePhoto) { allPhotos.push(u.profilePhoto); allLabels.push("Profile Photo"); }
    const faceScans = parsePhotos(u.verificationPhoto);
    const poseNames = ["Center", "Left Turn", "Right Turn"];
    faceScans.forEach((p, i) => { allPhotos.push(p); allLabels.push(poseNames[i] || "Pose " + (i+1)); });
    if (u.idDocument) { allPhotos.push(u.idDocument); allLabels.push("ID Document"); }
    return { photos: allPhotos, labels: allLabels };
  };

  if (!authed) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="w-10 h-10 border-4 border-rose-800 border-t-rose-400 rounded-full animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-950">
      {toast && <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-lg">{toast}</div>}

      {viewPhotos && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4" onClick={() => setViewPhotos(null)}>
          <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">{viewPhotos.labels[viewIdx]}</h3>
              <div className="flex items-center gap-3">
                <span className="text-white/50 text-sm">{viewIdx + 1} / {viewPhotos.photos.length}</span>
                <button onClick={() => setViewPhotos(null)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"><X className="w-4 h-4 text-white" /></button>
              </div>
            </div>
            <div className="relative">
              <img src={viewPhotos.photos[viewIdx]} alt={viewPhotos.labels[viewIdx]} className="w-full max-h-[60vh] object-contain rounded-2xl" style={{ transform: viewPhotos.labels[viewIdx] !== "Profile Photo" && viewPhotos.labels[viewIdx] !== "ID Document" ? "scaleX(-1)" : "none" }} />
              {viewIdx > 0 && <button onClick={() => setViewIdx(i => i - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70"><ChevronLeft className="w-5 h-5 text-white" /></button>}
              {viewIdx < viewPhotos.photos.length - 1 && <button onClick={() => setViewIdx(i => i + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70"><ChevronRight className="w-5 h-5 text-white" /></button>}
            </div>
            <div className="flex justify-center gap-3 mt-4">
              {viewPhotos.photos.map((p, i) => (
                <button key={i} onClick={() => setViewIdx(i)} className={"relative rounded-xl overflow-hidden border-2 transition-all " + (viewIdx===i ? "border-rose-400 scale-110" : "border-white/20 opacity-60 hover:opacity-100")}>
                  <img src={p} className="w-20 h-16 object-cover" style={{ transform: viewPhotos.labels[i] !== "Profile Photo" && viewPhotos.labels[i] !== "ID Document" ? "scaleX(-1)" : "none" }} />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-white font-bold text-center py-0.5">{viewPhotos.labels[i]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <aside className="w-[240px] bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 left-0">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center"><Heart className="w-4 h-4 text-white fill-white" /></div>
          <span className="text-lg font-bold text-white">ConnectHub</span>
        </div>
        <div className="px-4 mt-3 mb-2"><span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">ADMIN PANEL</span></div>
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {tabs.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)} className={"flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all " + (tab===t.key?"bg-rose-500/10 text-rose-400":"text-slate-400 hover:bg-white/5")}>
              <t.icon className="w-[18px] h-[18px]" /> {t.label}
              {t.key==="verification" && stats.pending>0 && <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{stats.pending}</span>}
            </button>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-slate-800 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5"><Eye className="w-[18px] h-[18px]" /> View Site</Link>
          <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5"><LogOut className="w-[18px] h-[18px]" /> Log Out</button>
        </div>
      </aside>

      <main className="flex-1 ml-[240px] p-8 text-white">

        {tab==="overview" && (<>
          <div className="flex justify-between items-center mb-8"><div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-slate-400">ConnectHub overview</p></div><button onClick={load} className={"flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-sm text-slate-300 hover:bg-white/10 border border-white/10"}><RefreshCw className={"w-4 h-4 " + (loading?"animate-spin":"")}/> Refresh</button></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[{l:"Total Users",v:stats.total,icon:Users,c:"text-blue-400",bg:"bg-blue-500/10"},{l:"Verified",v:stats.verified,icon:Shield,c:"text-emerald-400",bg:"bg-emerald-500/10"},{l:"Basic",v:stats.basic,icon:UserCheck,c:"text-amber-400",bg:"bg-amber-500/10"},{l:"Pending",v:stats.pending,icon:Clock,c:"text-rose-400",bg:"bg-rose-500/10"}].map((s,i)=>(
              <div key={i} className="bg-slate-900 rounded-2xl p-5 border border-slate-800"><div className={s.bg + " w-10 h-10 rounded-xl flex items-center justify-center mb-3"}><s.icon className={"w-5 h-5 " + s.c}/></div><p className={"text-3xl font-bold " + s.c}>{s.v}</p><p className="text-xs text-slate-500 mt-1">{s.l}</p></div>
            ))}
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800"><h3 className="font-bold">Recent Users</h3></div>
            {users.length===0?<div className="p-12 text-center text-slate-500"><p>No users yet</p></div>:(
              <table className="w-full"><thead><tr className="border-b border-slate-800 text-xs text-slate-500 uppercase"><th className="text-left px-6 py-3">User</th><th className="text-left px-6 py-3">Email</th><th className="text-left px-6 py-3">Tier</th><th className="text-left px-6 py-3">Joined</th></tr></thead><tbody>
                {users.slice(0,10).map(u=>(
                  <tr key={u.id} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                    <td className="px-6 py-3"><div className="flex items-center gap-3">{u.profilePhoto?<img src={u.profilePhoto} className="w-8 h-8 rounded-full object-cover border border-slate-700"/>:<div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>}<span className="text-sm font-medium">{u.name}</span></div></td>
                    <td className="px-6 py-3 text-sm text-slate-400">{u.email}</td>
                    <td className="px-6 py-3"><span className={"text-[11px] font-bold px-2.5 py-1 rounded-full " + (u.tier==="verified"?"bg-blue-500/15 text-blue-400":u.tier==="banned"?"bg-red-500/15 text-red-400":"bg-slate-700 text-slate-300")}>{u.tier}</span></td>
                    <td className="px-6 py-3 text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>)}

        {tab==="users" && (<>
          <div className="flex justify-between items-center mb-6"><div><h1 className="text-2xl font-bold">All Users</h1><p className="text-sm text-slate-400">{users.length} registered</p></div>
            <div className="flex items-center gap-3"><div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2"><Search className="w-4 h-4 text-slate-500"/><input className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-48" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
          </div>
          <div className="space-y-3">{filtered.map(u=>{const ph=parsePhotos(u.verificationPhoto);return(
            <div key={u.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                {u.profilePhoto ? (
                  <button onClick={()=>{const d=openAllPhotos(u);setViewPhotos(d);setViewIdx(0);}} className="relative group">
                    <img src={u.profilePhoto} className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 group-hover:border-rose-400 transition-all"/>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Eye className="w-4 h-4 text-white"/></div>
                  </button>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">{u.name[0]}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><h4 className="font-bold">{u.name}</h4><span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (u.tier==="verified"?"bg-blue-500/15 text-blue-400":u.tier==="banned"?"bg-red-500/15 text-red-400":"bg-slate-700 text-slate-300")}>{u.tier}</span></div>
                  <p className="text-sm text-slate-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.tier==="banned"?<button onClick={()=>action(u.id,"unban")} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">Unban</button>:<button onClick={()=>action(u.id,"ban")} className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/20"><Ban className="w-3 h-3 inline mr-1"/>Ban</button>}
                  <button onClick={()=>deleteUser(u.id,u.name)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold border border-red-500/20"><Trash2 className="w-3 h-3 inline mr-1"/>Delete</button>
                </div>
              </div>
              <div className="px-5 pb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                <span>Age: <strong className="text-slate-300">{u.age||"N/A"}</strong></span>
                <span>Gender: <strong className="text-slate-300">{u.gender||"N/A"}</strong></span>
                <span>Looking for: <strong className="text-slate-300">{u.lookingFor||"N/A"}</strong></span>
                <span>Status: <strong className="text-slate-300">{u.verificationStatus}</strong></span>
                <span>Joined: <strong className="text-slate-300">{new Date(u.createdAt).toLocaleDateString()}</strong></span>
              </div>
            </div>
          )})}</div>
        </>)}

        {tab==="verification" && (<>
          <div className="mb-6"><h1 className="text-2xl font-bold">Verification Queue</h1><p className="text-sm text-slate-400">Compare profile photo, face scan, and ID document</p></div>
          {users.filter(u=>u.verificationStatus==="pending").length===0?(
            <div className="bg-slate-900 rounded-2xl p-12 text-center border border-slate-800"><Check className="w-12 h-12 text-emerald-500 mx-auto mb-3"/><h3 className="text-lg font-bold mb-1">All Clear!</h3><p className="text-slate-500">No pending verifications.</p></div>
          ):(
            <div className="space-y-6">
              {users.filter(u=>u.verificationStatus==="pending").map(u => {
                const faceScans = parsePhotos(u.verificationPhoto);
                const allData = openAllPhotos(u);
                return (
                <div key={u.id} className="bg-slate-900 rounded-2xl border border-amber-500/20 overflow-hidden">
                  <div className="flex items-center gap-4 p-5 border-b border-slate-800">
                    {u.profilePhoto ? <img src={u.profilePhoto} className="w-14 h-14 rounded-full object-cover border-2 border-amber-400/50" /> : <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold text-xl">{u.name[0]}</div>}
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-lg">{u.name}</h4>
                      <p className="text-sm text-slate-400">{u.email} - Age: {u.age||"N/A"} - {u.gender||"N/A"} - Looking for: {u.lookingFor||"N/A"}</p>
                    </div>
                    <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-500/30">Pending Review</span>
                  </div>

                  <div className="p-5">
                    <div className="mb-5">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><UserCircle className="w-4 h-4" /> Profile Photo</p>
                      {u.profilePhoto ? (
                        <button onClick={() => { setViewPhotos(allData); setViewIdx(0); }} className="relative group rounded-xl overflow-hidden border-2 border-slate-700 hover:border-rose-400 transition-all inline-block">
                          <img src={u.profilePhoto} alt="Profile" className="w-32 h-32 object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Eye className="w-5 h-5 text-white" /></div>
                          <div className="absolute bottom-1 left-1 right-1 bg-black/70 rounded text-[9px] text-white font-bold text-center py-0.5">Profile</div>
                        </button>
                      ) : <div className="bg-slate-800 rounded-xl p-4 inline-block"><p className="text-slate-500 text-sm">No profile photo</p></div>}
                    </div>

                    <div className="mb-5">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Face Scan ({faceScans.length} Poses)</p>
                      {faceScans.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {faceScans.map((p, i) => {
                            const idx = u.profilePhoto ? 1 + i : i;
                            return (
                            <button key={i} onClick={() => { setViewPhotos(allData); setViewIdx(idx); }} className="relative group rounded-xl overflow-hidden border-2 border-slate-700 hover:border-rose-400 transition-all">
                              <img src={p} alt={"Pose " + (i+1)} className="w-full h-44 object-cover" style={{transform:"scaleX(-1)"}} />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Eye className="w-6 h-6 text-white" /></div>
                              <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1.5 text-center"><span className="text-white text-xs font-bold">{["Center","Left Turn","Right Turn"][i]}</span></div>
                              <div className="absolute top-2 left-2 bg-slate-800/80 rounded-full w-7 h-7 flex items-center justify-center"><span className="text-white text-xs font-bold">{i+1}</span></div>
                            </button>
                          )})}
                        </div>
                      ) : <div className="bg-slate-800 rounded-xl p-6 text-center"><p className="text-slate-500">No face scan</p></div>}
                    </div>

                    <div className="mb-5">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> ID Document</p>
                      {u.idDocument ? (
                        <button onClick={() => { setViewPhotos(allData); setViewIdx(allData.photos.length - 1); }} className="relative group rounded-xl overflow-hidden border-2 border-slate-700 hover:border-purple-400 transition-all inline-block">
                          <img src={u.idDocument} alt="ID" className="w-64 h-40 object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Eye className="w-5 h-5 text-white" /></div>
                          <div className="absolute bottom-1 left-1 right-1 bg-purple-600/80 rounded text-[9px] text-white font-bold text-center py-0.5">ID Document - Click to enlarge</div>
                        </button>
                      ) : <div className="bg-slate-800 rounded-xl p-4 inline-block"><p className="text-slate-500 text-sm">No ID uploaded</p></div>}
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 mb-5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Admin Review Checklist</p>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-500" /> Profile photo matches face scan</label>
                        <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-500" /> Same person in all 3 poses</label>
                        <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-500" /> Head turns clearly visible</label>
                        <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-500" /> ID name matches account name</label>
                        <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-500" /> ID photo matches face scan</label>
                        <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 rounded accent-emerald-500" /> No sunglasses or coverings</label>
                      </div>
                    </div>

                    <button onClick={() => { setViewPhotos(allData); setViewIdx(0); }} className="w-full mb-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700"><Eye className="w-4 h-4" /> View All {allData.photos.length} Photos Full Screen</button>

                    <div className="flex gap-3">
                      <button onClick={()=>action(u.id,"approve")} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500/15 text-emerald-400 rounded-xl font-bold hover:bg-emerald-500/25 border border-emerald-500/20 transition-all text-sm"><Check className="w-5 h-5" /> Approve</button>
                      <button onClick={()=>action(u.id,"reject")} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500/20 border border-red-500/20 transition-all text-sm"><X className="w-5 h-5" /> Reject</button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </>)}

        {tab==="settings" && (<>
          <div className="mb-6"><h1 className="text-2xl font-bold">Settings</h1></div>
          <div className="space-y-4 max-w-lg">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800"><h3 className="font-bold mb-4">Admin Credentials</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-white font-mono">admin@connecthub.com</span></div><div className="flex justify-between"><span className="text-slate-500">Password</span><span className="text-slate-500 font-mono">ConnectHub@2026</span></div></div></div>
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800"><h3 className="font-bold mb-4">Database</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Provider</span><span className="text-white">Supabase PostgreSQL</span></div><div className="flex justify-between"><span className="text-slate-500">Users</span><span className="text-white">{stats.total}</span></div></div><button onClick={load} className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-sm font-bold border border-indigo-500/20"><RefreshCw className="w-4 h-4"/> Refresh</button></div>
          </div>
        </>)}
      </main>
    </div>
  );
}
