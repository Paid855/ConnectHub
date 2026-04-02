"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [editField, setEditField] = useState("");
  const [editValue, setEditValue] = useState("");
  const [changePwd, setChangePwd] = useState({current:"",newPwd:"",confirm:""});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/me").then(r=>{if(!r.ok){router.push("/admin/login");return null;}return r.json();}).then(d=>{if(d){setAdmin(d.user);loadData();}setLoading(false);}).catch(()=>{router.push("/admin/login");setLoading(false);});
  }, []);

  const loadData = () => {
    fetch("/api/admin/users").then(r=>r.json()).then(d=>{setUsers(d.users||[]);setStats(d.stats||{});}).catch(()=>{});
    fetch("/api/admin/verifications").then(r=>r.json()).then(d=>setVerifications(d.pending||[])).catch(()=>{});
    fetch("/api/admin/reports").then(r=>r.json()).then(d=>setReports(d.reports||[])).catch(()=>{});
  };

  const action = async (userId:string, act:string, extra?:any) => {
    if (act==="ban"&&!confirm("Ban this user?")) return;
    if (act==="delete"&&!confirm("PERMANENTLY DELETE? Cannot undo!")) return;
    if (act==="delete") { await fetch("/api/admin/users",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId})}); }
    else { await fetch("/api/admin/users",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,action:act,...extra})}); }
    loadData(); setSelected(null);
  };

  const approveVerify = async (userId:string) => { await fetch("/api/admin/verifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,action:"approve"})}); loadData(); };
  const rejectVerify = async (userId:string) => { await fetch("/api/admin/verifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,action:"reject"})}); loadData(); };

  const saveEdit = async (userId:string) => {
    if (!editField||editValue==="") return;
    await fetch("/api/admin/users",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,action:"editField",field:editField,value:editValue})});
    setEditField(""); setEditValue(""); loadData();
    setSelected((p:any)=>({...p,[editField]:editValue}));
  };

  const handlePwd = async () => {
    if (changePwd.newPwd!==changePwd.confirm) {setMsg("Passwords don't match");return;}
    if (changePwd.newPwd.length<8) {setMsg("Min 8 characters");return;}
    const r = await fetch("/api/admin/me",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:changePwd.current,newPassword:changePwd.newPwd})});
    const d = await r.json();
    setMsg(r.ok?"Password changed!":d.error||"Failed");
    if(r.ok) setChangePwd({current:"",newPwd:"",confirm:""});
  };

  const filtered = search ? users.filter(u=>u.name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase())||u.username?.toLowerCase().includes(search.toLowerCase())) : users;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"/></div>;
  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40"><div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14"><div className="flex items-center gap-2"><span className="text-xl">💕</span><span className="text-lg font-bold">ConnectHub Admin</span></div><div className="flex items-center gap-3"><span className="text-sm text-gray-500">{admin.email}</span><button onClick={async()=>{await fetch("/api/admin/logout",{method:"POST"});router.push("/admin/login");}} className="text-sm text-red-600 font-medium">Logout</button></div></div></div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border overflow-x-auto">
          {["overview","users","verify","reports","settings"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={"px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap "+(tab===t?"bg-rose-500 text-white":"text-gray-600 hover:bg-gray-50")}>{t==="overview"?"Overview":t==="users"?"Users ("+users.length+")":t==="verify"?"Verify ("+verifications.length+")":t==="reports"?"Reports ("+reports.length+")":"Settings"}</button>
          ))}
        </div>

        {tab==="overview"&&(
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[{l:"Total Users",v:stats.total||0,c:"text-blue-600 bg-blue-50"},{l:"Verified",v:stats.verified||0,c:"text-emerald-600 bg-emerald-50"},{l:"Plus/Premium",v:stats.premium||0,c:"text-purple-600 bg-purple-50"},{l:"Banned",v:stats.banned||0,c:"text-red-600 bg-red-50"}].map((s,i)=>(
                <div key={i} className="bg-white rounded-xl p-5 border"><p className="text-gray-500 text-xs mb-1">{s.l}</p><p className={"text-3xl font-bold "+s.c.split(" ")[0]}>{s.v}</p></div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border"><h3 className="font-bold mb-4">Recent Users</h3>{users.slice(0,8).map(u=><div key={u.id} className="flex items-center gap-3 py-2 border-b last:border-0"><div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 text-xs font-bold">{u.name?.[0]}</div><div className="flex-1"><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div><span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span></div>)}</div>
              <div className="bg-white rounded-xl p-6 border"><h3 className="font-bold mb-4">Pending Actions</h3><div className="space-y-3"><div className="p-3 bg-amber-50 rounded-xl flex justify-between"><span className="text-sm text-amber-700">{verifications.length} verifications</span><button onClick={()=>setTab("verify")} className="text-xs text-amber-600 font-bold">Review</button></div><div className="p-3 bg-red-50 rounded-xl flex justify-between"><span className="text-sm text-red-700">{reports.length} reports</span><button onClick={()=>setTab("reports")} className="text-xs text-red-600 font-bold">Review</button></div></div></div>
            </div>
          </div>
        )}

        {tab==="users"&&(
          <div>
            <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-rose-300 text-sm mb-4" placeholder="Search users..."/>
            <div className="bg-white rounded-xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3 text-xs text-gray-500">User</th><th className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">Email</th><th className="px-4 py-3 text-xs text-gray-500">Tier</th><th className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">Coins</th><th className="px-4 py-3 text-xs text-gray-500">Actions</th></tr></thead>
                <tbody>{filtered.map(u=>(
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3"><div className="flex items-center gap-2">{u.profilePhoto?<img src={u.profilePhoto} className="w-8 h-8 rounded-full object-cover"/>:<div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-bold">{u.name?.[0]}</div>}<div><p className="font-medium">{u.name}</p><p className="text-xs text-gray-400">@{u.username||"--"}</p></div></div></td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3"><span className={"text-xs px-2 py-1 rounded-full font-medium "+(u.tier==="banned"?"bg-red-100 text-red-600":u.tier==="premium"||u.tier==="gold"?"bg-purple-100 text-purple-600":u.tier==="plus"?"bg-blue-100 text-blue-600":"bg-gray-100 text-gray-600")}>{u.tier||"free"}</span></td>
                    <td className="px-4 py-3 hidden md:table-cell">{u.coins||0}</td>
                    <td className="px-4 py-3"><button onClick={()=>setSelected(u)} className="text-xs text-rose-600 font-medium hover:underline">View/Edit</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            {selected&&(
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>{setSelected(null);setEditField("");}}>
                <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={e=>e.stopPropagation()}>
                  <div className="flex items-center gap-3 mb-4">
                    {selected.profilePhoto?<img src={selected.profilePhoto} className="w-16 h-16 rounded-full object-cover"/>:<div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-2xl font-bold">{selected.name?.[0]}</div>}
                    <div><h3 className="text-lg font-bold">{selected.name}</h3><p className="text-sm text-gray-500">{selected.email}</p></div>
                  </div>

                  {/* User details grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[{l:"Username",v:selected.username||"--"},{l:"Age",v:selected.age||"--"},{l:"Gender",v:selected.gender||"--"},{l:"Country",v:selected.country||"--"},{l:"Phone",v:selected.phone||"--"},{l:"Tier",v:selected.tier||"free"},{l:"Verified",v:selected.verified?"Yes":"No"},{l:"Coins",v:selected.coins||0},{l:"Joined",v:new Date(selected.createdAt).toLocaleDateString()},{l:"Last Seen",v:selected.lastSeen?new Date(selected.lastSeen).toLocaleString():"Never"}].map((item,i)=>(
                      <div key={i} className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-500">{item.l}</p><p className="text-sm font-medium">{item.v}</p></div>
                    ))}
                  </div>

                  {selected.verificationPhoto&&<div className="mb-4"><p className="text-xs text-gray-500 mb-1">Verification Selfie</p><img src={selected.verificationPhoto} className="w-full max-h-48 rounded-xl object-cover border"/></div>}
                  {selected.idDocument&&<div className="mb-4"><p className="text-xs text-gray-500 mb-1">ID Document ({selected.idType||"ID"})</p><img src={selected.idDocument} className="w-full max-h-48 rounded-xl object-cover border"/></div>}
                  {selected.bio&&<div className="bg-gray-50 rounded-lg p-3 mb-4"><p className="text-[10px] text-gray-500">Bio</p><p className="text-sm">{selected.bio}</p></div>}
                  {selected.verificationPhoto&&<div className="mb-4"><p className="text-xs text-gray-500 mb-1">Verification Selfie</p><img src={selected.verificationPhoto} className="w-full max-h-48 rounded-xl object-cover border"/></div>}

                  {/* Edit field */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs font-bold text-blue-700 mb-2">Edit User Field</p>
                    <div className="flex gap-2">
                      <select value={editField} onChange={e=>{setEditField(e.target.value);setEditValue(selected[e.target.value]||"");}} className="px-2 py-2 rounded-lg border text-xs bg-white flex-1">
                        <option value="">Select field</option>
                        {["name","email","username","age","gender","country","phone","bio","coins"].map(f=><option key={f} value={f}>{f}</option>)}
                      </select>
                      {editField&&<><input value={editValue} onChange={e=>setEditValue(e.target.value)} className="px-2 py-2 rounded-lg border text-xs flex-1"/><button onClick={()=>saveEdit(selected.id)} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold">Save</button></>}
                    </div>
                  </div>

                  {/* Change tier */}
                  <div className="mb-4 p-3 bg-purple-50 rounded-xl">
                    <p className="text-xs font-bold text-purple-700 mb-2">Change Tier</p>
                    <div className="flex gap-2">
                      {["free","plus","premium","gold"].map(t=>(
                        <button key={t} onClick={()=>action(selected.id,"changeTier",{tier:t})} className={"px-3 py-1.5 rounded-lg text-xs font-bold "+(selected.tier===t?"bg-purple-500 text-white":"bg-white border text-gray-600")}>{t}</button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {selected.tier==="banned"?<button onClick={()=>action(selected.id,"unban")} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold">Unban</button>:<button onClick={()=>action(selected.id,"ban")} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold">Ban</button>}
                    {!selected.verified&&<button onClick={()=>action(selected.id,"verify")} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold">Verify</button>}
                    <button onClick={()=>action(selected.id,"delete")} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold">Delete</button>
                    <button onClick={()=>{setSelected(null);setEditField("");}} className="flex-1 py-2.5 border text-gray-700 rounded-xl text-sm font-bold">Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="verify"&&(
          <div className="space-y-4">
            {verifications.length===0?<div className="bg-white rounded-xl p-12 border text-center text-gray-500">No pending verifications</div>:
            verifications.map(v=>(
              <div key={v.id} className="bg-white rounded-xl p-5 border flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  {v.profilePhoto?<img src={v.profilePhoto} className="w-14 h-14 rounded-full object-cover"/>:<div className="w-14 h-14 rounded-full bg-rose-100 text-rose-500 font-bold flex items-center justify-center">{v.name?.[0]}</div>}
                  <div><p className="font-bold">{v.name}</p><p className="text-sm text-gray-500">{v.email}</p><p className="text-xs text-gray-400">{v.age} years old · {v.country}</p></div>
                </div>
                {v.verificationPhoto&&<img src={v.verificationPhoto} className="w-24 h-24 rounded-xl object-cover border"/>}
                <div className="flex gap-2">
                  <button onClick={()=>approveVerify(v.id)} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold">Approve</button>
                  <button onClick={()=>rejectVerify(v.id)} className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="reports"&&(
          <div className="space-y-4">
            {reports.length===0?<div className="bg-white rounded-xl p-12 border text-center text-gray-500">No pending reports</div>:
            reports.map(r=>(
              <div key={r.id} className="bg-white rounded-xl p-5 border">
                <div className="flex justify-between mb-2"><span className="text-sm font-bold">Report #{r.id.slice(-6)}</span><span className={"text-xs px-2 py-1 rounded-full "+(r.status==="pending"?"bg-amber-100 text-amber-600":"bg-gray-100 text-gray-600")}>{r.status}</span></div>
                <p className="text-sm text-gray-700 mb-1"><strong>Reason:</strong> {r.reason}</p>
                {r.details&&<p className="text-sm text-gray-500 mb-3">{r.details}</p>}
                <button onClick={()=>action(r.reportedId,"ban")} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold">Ban Reported User</button>
              </div>
            ))}
          </div>
        )}

        {tab==="settings"&&(
          <div className="max-w-md">
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="font-bold mb-4">Change Admin Password</h3>
              {msg&&<div className={"mb-4 px-4 py-3 rounded-xl text-sm "+(msg.includes("changed")?"bg-emerald-50 text-emerald-600":"bg-red-50 text-red-600")}>{msg}</div>}
              <div className="space-y-3">
                <input type="password" placeholder="Current password" value={changePwd.current} onChange={e=>setChangePwd({...changePwd,current:e.target.value})} className="w-full px-4 py-3 rounded-xl border outline-none text-sm"/>
                <input type="password" placeholder="New password (min 8)" value={changePwd.newPwd} onChange={e=>setChangePwd({...changePwd,newPwd:e.target.value})} className="w-full px-4 py-3 rounded-xl border outline-none text-sm"/>
                <input type="password" placeholder="Confirm new password" value={changePwd.confirm} onChange={e=>setChangePwd({...changePwd,confirm:e.target.value})} className="w-full px-4 py-3 rounded-xl border outline-none text-sm"/>
                <button onClick={handlePwd} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm">Update Password</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
