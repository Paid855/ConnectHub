"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [changePwd, setChangePwd] = useState({ current:"", newPwd:"", confirm:"" });
  const [pwdMsg, setPwdMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/me").then(r => { if (!r.ok) { router.push("/admin/login"); return null; } return r.json(); })
      .then(d => { if (d) { setAdmin(d.user); loadData(); } setLoading(false); })
      .catch(() => { router.push("/admin/login"); setLoading(false); });
  }, []);

  const loadData = () => {
    fetch("/api/admin/users").then(r=>r.json()).then(d => { setUsers(d.users||[]); setStats(d.stats||{}); }).catch(()=>{});
    fetch("/api/admin/verifications").then(r=>r.json()).then(d => setVerifications(d.pending||[])).catch(()=>{});
    fetch("/api/admin/reports").then(r=>r.json()).then(d => setReports(d.reports||[])).catch(()=>{});
  };

  const banUser = async (userId: string) => {
    if (!confirm("Ban this user? They will be logged out immediately.")) return;
    await fetch("/api/admin/users", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action:"ban" }) });
    loadData(); setSelectedUser(null);
  };

  const unbanUser = async (userId: string) => {
    await fetch("/api/admin/users", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action:"unban" }) });
    loadData(); setSelectedUser(null);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("PERMANENTLY DELETE this user? This cannot be undone!")) return;
    if (!confirm("Are you absolutely sure? All their data will be lost.")) return;
    await fetch("/api/admin/users", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId }) });
    loadData(); setSelectedUser(null);
  };

  const approveVerification = async (userId: string) => {
    await fetch("/api/admin/verifications", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action:"approve" }) });
    loadData();
  };

  const rejectVerification = async (userId: string) => {
    await fetch("/api/admin/verifications", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action:"reject" }) });
    loadData();
  };

  const handleChangePwd = async () => {
    if (changePwd.newPwd !== changePwd.confirm) { setPwdMsg("Passwords don't match"); return; }
    if (changePwd.newPwd.length < 8) { setPwdMsg("Minimum 8 characters"); return; }
    const res = await fetch("/api/admin/me", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ currentPassword: changePwd.current, newPassword: changePwd.newPwd }) });
    const d = await res.json();
    setPwdMsg(res.ok ? "Password changed!" : d.error || "Failed");
    if (res.ok) setChangePwd({ current:"", newPwd:"", confirm:"" });
  };

  const handleLogout = async () => { await fetch("/api/admin/logout", { method:"POST" }); router.push("/admin/login"); };

  const filteredUsers = search ? users.filter((u:any) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase())) : users;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;
  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-xl">💕</span>
            <span className="text-lg font-bold text-gray-900">ConnectHub Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{admin.email}</span>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200 overflow-x-auto">
          {[{k:"overview",l:"Overview"},{k:"users",l:"Users ("+users.length+")"},{k:"verify",l:"Verifications ("+verifications.length+")"},{k:"reports",l:"Reports ("+reports.length+")"},{k:"settings",l:"Settings"}].map(t => (
            <button key={t.k} onClick={()=>setTab(t.k)} className={"px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all " + (tab===t.k?"bg-rose-500 text-white shadow":"text-gray-600 hover:bg-gray-50")}>{t.l}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {l:"Total Users",v:stats.total||users.length,c:"text-blue-600 bg-blue-50"},
                {l:"Verified",v:stats.verified||users.filter((u:any)=>u.verified).length,c:"text-emerald-600 bg-emerald-50"},
                {l:"Premium/Plus",v:stats.premium||users.filter((u:any)=>u.tier==="premium"||u.tier==="plus"||u.tier==="gold").length,c:"text-purple-600 bg-purple-50"},
                {l:"Banned",v:stats.banned||users.filter((u:any)=>u.tier==="banned").length,c:"text-red-600 bg-red-50"},
              ].map((s,i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
                  <p className="text-gray-500 text-xs font-medium mb-1">{s.l}</p>
                  <p className={"text-3xl font-bold " + s.c.split(" ")[0]}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Recent Signups</h3>
                <div className="space-y-3">
                  {users.slice(0,5).map((u:any) => (
                    <div key={u.id} className="flex items-center gap-3">
                      {u.profilePhoto ? <img src={u.profilePhoto} className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 text-xs font-bold">{u.name?.[0]}</div>}
                      <div className="flex-1"><p className="text-sm font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                      <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Pending Actions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl"><span className="text-sm text-amber-700">{verifications.length} pending verifications</span><button onClick={()=>setTab("verify")} className="text-xs text-amber-600 font-bold hover:underline">Review</button></div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl"><span className="text-sm text-red-700">{reports.length} pending reports</span><button onClick={()=>setTab("reports")} className="text-xs text-red-600 font-bold hover:underline">Review</button></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div>
            <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm mb-4" placeholder="Search users by name, email, or username..." />
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 hidden sm:table-cell">Email</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Tier</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 hidden md:table-cell">Joined</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u:any) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.profilePhoto ? <img src={u.profilePhoto} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 text-xs font-bold">{u.name?.[0]}</div>}
                            <div><p className="text-sm font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-400">@{u.username||"--"}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{u.email}</td>
                        <td className="px-4 py-3"><span className={"text-xs px-2 py-1 rounded-full font-medium " + (u.tier==="banned"?"bg-red-100 text-red-600":u.tier==="premium"||u.tier==="gold"?"bg-purple-100 text-purple-600":u.tier==="plus"?"bg-blue-100 text-blue-600":"bg-gray-100 text-gray-600")}>{u.tier||"free"}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={()=>setSelectedUser(u)} className="text-xs text-rose-600 font-medium hover:underline">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User detail modal */}
            {selectedUser && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setSelectedUser(null)}>
                <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e=>e.stopPropagation()}>
                  <div className="flex items-center gap-3 mb-4">
                    {selectedUser.profilePhoto ? <img src={selectedUser.profilePhoto} className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 text-2xl font-bold">{selectedUser.name?.[0]}</div>}
                    <div><h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3><p className="text-sm text-gray-500">{selectedUser.email}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      {l:"Username",v:selectedUser.username||"--"},{l:"Age",v:selectedUser.age||"--"},
                      {l:"Gender",v:selectedUser.gender||"--"},{l:"Country",v:selectedUser.country||"--"},
                      {l:"Phone",v:selectedUser.phone||"--"},{l:"Tier",v:selectedUser.tier||"free"},
                      {l:"Verified",v:selectedUser.verified?"Yes":"No"},{l:"Coins",v:selectedUser.coins||0},
                      {l:"Joined",v:new Date(selectedUser.createdAt).toLocaleDateString()},{l:"Last Seen",v:selectedUser.lastSeen?new Date(selectedUser.lastSeen).toLocaleString():"Never"},
                    ].map((item,i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">{item.l}</p><p className="text-sm font-medium text-gray-900">{item.v}</p></div>
                    ))}
                  </div>
                  {selectedUser.bio && <div className="bg-gray-50 rounded-lg p-3 mb-4"><p className="text-xs text-gray-500 mb-1">Bio</p><p className="text-sm text-gray-700">{selectedUser.bio}</p></div>}
                  <div className="flex gap-2">
                    {selectedUser.tier === "banned" ? (
                      <button onClick={()=>unbanUser(selectedUser.id)} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600">Unban User</button>
                    ) : (
                      <button onClick={()=>banUser(selectedUser.id)} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600">Ban User</button>
                    )}
                    <button onClick={()=>deleteUser(selectedUser.id)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600">Delete Permanently</button>
                    <button onClick={()=>setSelectedUser(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50">Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VERIFICATIONS */}
        {tab === "verify" && (
          <div className="space-y-4">
            {verifications.length === 0 ? (
              <div className="bg-white rounded-xl p-12 border border-gray-200 text-center"><p className="text-gray-500">No pending verifications</p></div>
            ) : verifications.map((v:any) => (
              <div key={v.id} className="bg-white rounded-xl p-5 border border-gray-200 flex items-center gap-4">
                {v.profilePhoto ? <img src={v.profilePhoto} className="w-14 h-14 rounded-full object-cover" /> : <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold">{v.name?.[0]}</div>}
                <div className="flex-1"><p className="font-bold text-gray-900">{v.name}</p><p className="text-sm text-gray-500">{v.email}</p></div>
                {v.verificationPhoto && <img src={v.verificationPhoto} className="w-20 h-20 rounded-lg object-cover border" />}
                <div className="flex gap-2">
                  <button onClick={()=>approveVerification(v.id)} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600">Approve</button>
                  <button onClick={()=>rejectVerification(v.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REPORTS */}
        {tab === "reports" && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="bg-white rounded-xl p-12 border border-gray-200 text-center"><p className="text-gray-500">No pending reports</p></div>
            ) : reports.map((r:any) => (
              <div key={r.id} className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-900">Report #{r.id.slice(-6)}</span>
                  <span className={"text-xs px-2 py-1 rounded-full " + (r.status==="pending"?"bg-amber-100 text-amber-600":"bg-gray-100 text-gray-600")}>{r.status}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2"><strong>Reason:</strong> {r.reason}</p>
                {r.details && <p className="text-sm text-gray-500 mb-3">{r.details}</p>}
                <div className="flex gap-2">
                  <button onClick={()=>banUser(r.reportedId)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold">Ban Reported User</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div className="max-w-md">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Change Admin Password</h3>
              {pwdMsg && <div className={"mb-4 px-4 py-3 rounded-xl text-sm " + (pwdMsg.includes("changed")?"bg-emerald-50 text-emerald-600":"bg-red-50 text-red-600")}>{pwdMsg}</div>}
              <div className="space-y-3">
                <input type="password" placeholder="Current password" value={changePwd.current} onChange={e=>setChangePwd({...changePwd,current:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" />
                <input type="password" placeholder="New password (min 8 chars)" value={changePwd.newPwd} onChange={e=>setChangePwd({...changePwd,newPwd:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" />
                <input type="password" placeholder="Confirm new password" value={changePwd.confirm} onChange={e=>setChangePwd({...changePwd,confirm:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" />
                <button onClick={handleChangePwd} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:shadow-lg">Update Password</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
