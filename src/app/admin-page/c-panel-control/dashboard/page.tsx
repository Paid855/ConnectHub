"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Shield, AlertTriangle, LogOut, Search,
  Eye, Ban, Check, X, Trash2, Crown, Gem, Camera, Mail,
  Calendar, Coins, BarChart3, RefreshCw, Settings, Lock,
  UserCheck, Image, Globe, Phone, Activity, Award,
  EyeOff, Save, ArrowLeft, Clock, CheckCircle, XCircle,
  Edit3, Plus, Minus, MapPin, Heart, MessageCircle,
  Star, FileText, Info
} from "lucide-react";

type UserData = {
  id: string; name: string; email: string; username: string | null;
  phone: string | null; age: number | null; gender: string | null;
  country: string | null; city: string | null; bio: string | null;
  profilePhoto: string | null; tier: string; verified: boolean;
  verificationStatus: string | null; verificationPhoto: string | null;
  idDocument: string | null; idDocumentBack: string | null;
  idType: string | null; interests: string[]; coins: number;
  createdAt: string; lastActive: string | null; banned: boolean;
  lookingFor: string | null; photos: string[];
};

type Tab = "overview" | "users" | "verifications" | "reports" | "settings";

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<UserData[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedVerif, setSelectedVerif] = useState<any>(null);
  const [photoViewer, setPhotoViewer] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userTab, setUserTab] = useState<"info" | "photos" | "docs" | "edit">("info");

  // Edit form
  const [editForm, setEditForm] = useState<any>({});
  const [editMsg, setEditMsg] = useState("");

  // Coin management
  const [coinAmount, setCoinAmount] = useState("");
  const [coinMsg, setCoinMsg] = useState("");

  // Settings
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passError, setPassError] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/me");
      if (!res.ok) { router.push("/admin-page/c-panel-control"); return; }
      setAdmin(await res.json());
      await loadAll();
      setLoading(false);
    })();
  }, []);

  const loadAll = async () => {
    const [u, v, rp] = await Promise.allSettled([
      fetch("/api/admin/users").then(r => r.ok ? r.json() : null),
      fetch("/api/admin/verifications").then(r => r.ok ? r.json() : null),
      fetch("/api/admin/reports").then(r => r.ok ? r.json() : null),
    ]);
    if (u.status === "fulfilled" && u.value) setUsers(u.value.users || []);
    if (v.status === "fulfilled" && v.value) setVerifications(v.value.verifications || v.value.pending || []);
    if (rp.status === "fulfilled" && rp.value) setReports(rp.value.reports || []);
  };

  const handleLogout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin-page/c-panel-control"); };

  const doAction = async (userId: string, action: string, extra?: any) => {
    setActionLoading(userId + action);
    if (action === "ban" && !confirm("Ban this user?")) { setActionLoading(""); return; }
    if (action === "delete" && !confirm("DELETE this user permanently?")) { setActionLoading(""); return; }
    await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action, ...extra }) });
    await loadAll();
    setActionLoading("");
    if (selectedUser?.id === userId) {
      const updated = (await fetch("/api/admin/users").then(r => r.json())).users?.find((u: any) => u.id === userId);
      if (updated) setSelectedUser(updated);
      else setSelectedUser(null);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setEditMsg("");
    await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: selectedUser.id, action: "editProfile", ...editForm }) });
    setEditMsg("Saved!");
    await loadAll();
    const updated = (await fetch("/api/admin/users").then(r => r.json())).users?.find((u: any) => u.id === selectedUser.id);
    if (updated) setSelectedUser(updated);
    setTimeout(() => setEditMsg(""), 2000);
  };

  const handleCoins = async (mode: "add" | "set") => {
    if (!selectedUser || !coinAmount) return;
    setCoinMsg("");
    await doAction(selectedUser.id, mode === "add" ? "addCoins" : "setCoins", { amount: coinAmount });
    setCoinMsg(mode === "add" ? `Added ${coinAmount} coins` : `Set coins to ${coinAmount}`);
    setCoinAmount("");
    setTimeout(() => setCoinMsg(""), 2000);
  };

  const handleVerification = async (userId: string, action: "approve" | "reject") => {
    setActionLoading(userId + action);
    await fetch("/api/admin/verifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action }) });
    await loadAll();
    setActionLoading("");
    setSelectedVerif(null);
  };

  const handlePasswordChange = async () => {
    setPassMsg(""); setPassError("");
    if (!currentPass || !newPass) { setPassError("Fill in all fields"); return; }
    if (newPass !== confirmPass) { setPassError("Passwords don't match"); return; }
    if (newPass.length < 6) { setPassError("Min 6 characters"); return; }
    const res = await fetch("/api/admin/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }) });
    const data = await res.json();
    if (res.ok) { setPassMsg("Password changed!"); setCurrentPass(""); setNewPass(""); setConfirmPass(""); }
    else setPassError(data.error || "Failed");
  };

  const openUserEdit = (u: UserData) => {
    setEditForm({ name: u.name, email: u.email, username: u.username || "", phone: u.phone || "", age: u.age?.toString() || "", gender: u.gender || "", country: u.country || "", city: u.city || "", bio: u.bio || "", lookingFor: u.lookingFor || "", tier: u.tier });
    setUserTab("edit");
  };

  const realUsers = users.filter(u => u.email !== "admin@connecthub.com");
  const filteredUsers = realUsers.filter(u => {
    const ms = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || (u.username || "").toLowerCase().includes(search.toLowerCase());
    const mt = filterTier === "all" || u.tier === filterTier;
    return ms && mt;
  });

  const stats = {
    total: realUsers.length,
    verified: realUsers.filter(u => u.verified).length,
    premium: realUsers.filter(u => u.tier === "premium").length,
    gold: realUsers.filter(u => u.tier === "gold").length,
    banned: realUsers.filter(u => u.banned).length,
    online: realUsers.filter(u => u.lastActive && Date.now() - new Date(u.lastActive).getTime() < 5 * 60 * 1000).length,
    pendingVerif: verifications.length,
    reports: reports.length,
  };

  const ago = (d: string | null) => {
    if (!d) return "Never";
    const ms = Date.now() - new Date(d).getTime();
    if (ms < 60000) return "Just now";
    if (ms < 3600000) return Math.floor(ms / 60000) + "m ago";
    if (ms < 86400000) return Math.floor(ms / 3600000) + "h ago";
    return Math.floor(ms / 86400000) + "d ago";
  };

  if (loading) return (<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>);

  const TABS: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users, badge: stats.total },
    { id: "verifications", label: "Verify", icon: Shield, badge: stats.pendingVerif },
    { id: "reports", label: "Reports", icon: AlertTriangle, badge: stats.reports },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className={"fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform " + (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5" /></div>
            <div><h1 className="font-bold text-sm">ConnectHub</h1><p className="text-gray-500 text-xs">Control Panel</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedUser(null); setSelectedVerif(null); setSidebarOpen(false); }} className={"w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all " + (tab === t.id ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white")}>
              <t.icon className="w-5 h-5" />{t.label}
              {t.badge !== undefined && t.badge > 0 && <span className={"ml-auto text-xs px-2 py-0.5 rounded-full " + (tab === t.id ? "bg-blue-500" : t.id === "verifications" ? "bg-amber-500 text-black" : "bg-gray-700")}>{t.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">A</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{admin?.name || "Admin"}</p><p className="text-xs text-gray-500 truncate">{admin?.email}</p></div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10"><LogOut className="w-4 h-4" />Sign Out</button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-400"><BarChart3 className="w-5 h-5" /></button>
        <h1 className="font-bold text-sm">Control Panel</h1>
        <button onClick={handleLogout} className="p-2 text-red-400"><LogOut className="w-5 h-5" /></button>
      </div>
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 mt-14 lg:mt-0 overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{selectedUser ? selectedUser.name : TABS.find(t => t.id === tab)?.label}</h2>
              <p className="text-gray-500 text-sm mt-1">{selectedUser ? selectedUser.email : tab === "overview" ? "Platform statistics" : tab === "users" ? stats.total + " users" : tab === "verifications" ? stats.pendingVerif + " pending" : tab === "reports" ? stats.reports + " reports" : "Account settings"}</p>
            </div>
            <button onClick={() => { setLoading(true); loadAll().then(() => setLoading(false)); }} className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl"><RefreshCw className="w-4 h-4" /></button>
          </div>

          {/* ===== OVERVIEW ===== */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { l: "Total Users", v: stats.total, icon: Users, c: "text-blue-400 bg-blue-500/10", b: "border-blue-500/20" },
                  { l: "Online Now", v: stats.online, icon: Activity, c: "text-emerald-400 bg-emerald-500/10", b: "border-emerald-500/20" },
                  { l: "Verified", v: stats.verified, icon: UserCheck, c: "text-purple-400 bg-purple-500/10", b: "border-purple-500/20" },
                  { l: "Pending Verify", v: stats.pendingVerif, icon: Shield, c: "text-amber-400 bg-amber-500/10", b: "border-amber-500/20" },
                  { l: "Premium", v: stats.premium, icon: Crown, c: "text-pink-400 bg-pink-500/10", b: "border-pink-500/20" },
                  { l: "Gold", v: stats.gold, icon: Gem, c: "text-yellow-400 bg-yellow-500/10", b: "border-yellow-500/20" },
                  { l: "Banned", v: stats.banned, icon: Ban, c: "text-red-400 bg-red-500/10", b: "border-red-500/20" },
                  { l: "Reports", v: stats.reports, icon: AlertTriangle, c: "text-orange-400 bg-orange-500/10", b: "border-orange-500/20" },
                ].map((s, i) => (
                  <div key={i} className={"bg-gray-900 rounded-2xl p-5 border " + s.b}>
                    <div className={"w-10 h-10 rounded-xl flex items-center justify-center mb-3 " + s.c}><s.icon className="w-5 h-5" /></div>
                    <p className="text-2xl font-bold">{s.v}</p><p className="text-gray-500 text-xs mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="font-bold mb-4">Recent Users</h3>
                <div className="space-y-2">
                  {realUsers.slice(0, 8).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-750" onClick={() => { setTab("users"); setSelectedUser(u); setUserTab("info"); }}>
                      <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">{u.profilePhoto ? <img src={u.profilePhoto} className="w-full h-full object-cover" alt="" /> : <Users className="w-4 h-4 text-gray-500 m-auto mt-2.5" />}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{u.name} {u.verified && <CheckCircle className="w-3 h-3 text-blue-400 inline ml-1" />}</p><p className="text-xs text-gray-500 truncate">{u.email}</p></div>
                      <span className={"text-xs px-2 py-1 rounded-full " + (u.tier === "gold" ? "bg-yellow-500/10 text-yellow-400" : u.tier === "premium" ? "bg-pink-500/10 text-pink-400" : "bg-gray-700 text-gray-400")}>{u.tier}</span>
                      <span className="text-xs text-gray-500">{ago(u.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== USERS LIST ===== */}
          {tab === "users" && !selectedUser && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none" /></div>
                <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-4 text-sm focus:outline-none"><option value="all">All</option><option value="free">Free</option><option value="premium">Premium</option><option value="gold">Gold</option></select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(u => (
                  <div key={u.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 hover:border-gray-700 transition-colors cursor-pointer" onClick={() => { setSelectedUser(u); setUserTab("info"); setCoinMsg(""); setEditMsg(""); }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">{u.profilePhoto ? <img src={u.profilePhoto} className="w-full h-full object-cover" alt="" /> : <Users className="w-5 h-5 text-gray-500 m-auto mt-3.5" />}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{u.name} {u.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400 inline ml-1" />} {u.banned && <Ban className="w-3.5 h-3.5 text-red-400 inline ml-1" />}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={"text-xs px-2 py-1 rounded-full " + (u.tier === "gold" ? "bg-yellow-500/10 text-yellow-400" : u.tier === "premium" ? "bg-pink-500/10 text-pink-400" : "bg-gray-800 text-gray-400")}>{u.tier}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Coins className="w-3 h-3" />{u.coins}</span>
                      {u.age && <span className="text-xs text-gray-500">{u.age}y</span>}
                      {u.country && <span className="text-xs text-gray-500">{u.country}</span>}
                      <span className="text-xs text-gray-600 ml-auto">{ago(u.lastActive)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {filteredUsers.length === 0 && <div className="bg-gray-900 rounded-2xl p-12 text-center text-gray-500 border border-gray-800">No users found</div>}
            </div>
          )}

          {/* ===== USER DETAIL ===== */}
          {tab === "users" && selectedUser && (
            <div className="space-y-4">
              <button onClick={() => { setSelectedUser(null); setEditMsg(""); setCoinMsg(""); }} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>

              {/* User header */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => selectedUser.profilePhoto && setPhotoViewer(selectedUser.profilePhoto)}>
                    {selectedUser.profilePhoto ? <img src={selectedUser.profilePhoto} className="w-full h-full object-cover" alt="" /> : <Users className="w-7 h-7 text-gray-500 m-auto mt-4" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{selectedUser.name} {selectedUser.verified && <CheckCircle className="w-4 h-4 text-blue-400 inline ml-1" />} {selectedUser.banned && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-2">BANNED</span>}</h3>
                    <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className={"text-xs px-2.5 py-1 rounded-full font-medium " + (selectedUser.tier === "gold" ? "bg-yellow-500/10 text-yellow-400" : selectedUser.tier === "premium" ? "bg-pink-500/10 text-pink-400" : "bg-gray-800 text-gray-400")}>{selectedUser.tier}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-medium flex items-center gap-1"><Coins className="w-3 h-3" />{selectedUser.coins} coins</span>
                    </div>
                  </div>
                  <button onClick={() => openUserEdit(selectedUser)} className="p-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl"><Edit3 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { id: "info" as const, label: "Profile Info", icon: Info },
                  { id: "photos" as const, label: "Photos", icon: Image },
                  { id: "docs" as const, label: "Documents", icon: FileText },
                  { id: "edit" as const, label: "Edit Profile", icon: Edit3 },
                ].map(t => (
                  <button key={t.id} onClick={() => { setUserTab(t.id); if (t.id === "edit") openUserEdit(selectedUser); }} className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all " + (userTab === t.id ? "bg-blue-600 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800")}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              {/* INFO TAB */}
              {userTab === "info" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                    <h4 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wider">Personal Info</h4>
                    <div className="space-y-3 text-sm">
                      {[
                        { icon: Mail, label: "Email", value: selectedUser.email },
                        { icon: Users, label: "Username", value: selectedUser.username ? "@" + selectedUser.username : "Not set" },
                        { icon: Phone, label: "Phone", value: selectedUser.phone || "Not set" },
                        { icon: Calendar, label: "Age", value: selectedUser.age ? selectedUser.age + " years" : "Not set" },
                        { icon: Heart, label: "Gender", value: selectedUser.gender || "Not set" },
                        { icon: Globe, label: "Country", value: selectedUser.country || "Not set" },
                        { icon: MapPin, label: "City", value: selectedUser.city || "Not set" },
                        { icon: Star, label: "Looking For", value: selectedUser.lookingFor || "Not set" },
                        { icon: Clock, label: "Joined", value: new Date(selectedUser.createdAt).toLocaleDateString() },
                        { icon: Activity, label: "Last Active", value: ago(selectedUser.lastActive) },
                      ].map((r, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <r.icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-500 w-24 flex-shrink-0">{r.label}</span>
                          <span className="text-gray-200">{r.value}</span>
                        </div>
                      ))}
                    </div>
                    {selectedUser.bio && <div className="mt-4 p-3 bg-gray-800 rounded-xl"><p className="text-xs text-gray-500 mb-1">Bio</p><p className="text-sm">{selectedUser.bio}</p></div>}
                    {selectedUser.interests && selectedUser.interests.length > 0 && (
                      <div className="mt-4"><p className="text-xs text-gray-500 mb-2">Interests</p><div className="flex flex-wrap gap-2">{selectedUser.interests.map((int, i) => <span key={i} className="text-xs px-2.5 py-1 bg-gray-800 rounded-full text-gray-300">{int}</span>)}</div></div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Coin management */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                      <h4 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wider">Coin Management</h4>
                      <p className="text-3xl font-bold text-amber-400 mb-4">{selectedUser.coins} <span className="text-sm text-gray-500 font-normal">coins</span></p>
                      {coinMsg && <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">{coinMsg}</div>}
                      <div className="flex gap-2 mb-3">
                        <input value={coinAmount} onChange={e => setCoinAmount(e.target.value.replace(/\D/g, ""))} placeholder="Amount" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleCoins("add")} disabled={!coinAmount} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-medium disabled:opacity-30 flex items-center justify-center gap-1"><Plus className="w-4 h-4" />Add</button>
                        <button onClick={() => handleCoins("set")} disabled={!coinAmount} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium disabled:opacity-30 flex items-center justify-center gap-1"><Coins className="w-4 h-4" />Set</button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                      <h4 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wider">Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => doAction(selectedUser.id, "upgrade", { tier: "premium" })} className="p-3 bg-pink-600 hover:bg-pink-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><Crown className="w-3.5 h-3.5" />Premium</button>
                        <button onClick={() => doAction(selectedUser.id, "upgrade", { tier: "gold" })} className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><Gem className="w-3.5 h-3.5" />Gold</button>
                        <button onClick={() => doAction(selectedUser.id, "upgrade", { tier: "free" })} className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><Users className="w-3.5 h-3.5" />Free</button>
                        <button onClick={() => doAction(selectedUser.id, selectedUser.banned ? "unban" : "ban")} className={"p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 " + (selectedUser.banned ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}><Ban className="w-3.5 h-3.5" />{selectedUser.banned ? "Unban" : "Ban"}</button>
                        <button onClick={() => doAction(selectedUser.id, "resetVerification")} className="p-3 bg-amber-600 hover:bg-amber-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><Shield className="w-3.5 h-3.5" />Reset Verify</button>
                        <button onClick={() => doAction(selectedUser.id, "delete")} className="p-3 bg-red-900 hover:bg-red-800 rounded-xl text-xs font-bold text-red-300 flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PHOTOS TAB */}
              {userTab === "photos" && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                  <h4 className="font-bold mb-4">All Photos</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {selectedUser.profilePhoto && (
                      <div className="relative"><img src={selectedUser.profilePhoto} className="w-full aspect-square rounded-xl object-cover cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedUser.profilePhoto)} alt="Profile" /><span className="absolute bottom-1 left-1 text-[10px] bg-black/60 px-1.5 py-0.5 rounded">Profile</span></div>
                    )}
                    {(selectedUser.photos || []).map((p, i) => (
                      <div key={i} className="relative"><img src={p} className="w-full aspect-square rounded-xl object-cover cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(p)} alt={`Photo ${i + 1}`} /><span className="absolute bottom-1 left-1 text-[10px] bg-black/60 px-1.5 py-0.5 rounded">#{i + 1}</span></div>
                    ))}
                  </div>
                  {!selectedUser.profilePhoto && (!selectedUser.photos || selectedUser.photos.length === 0) && <p className="text-gray-500 text-sm text-center py-8">No photos uploaded</p>}
                </div>
              )}

              {/* DOCS TAB */}
              {userTab === "docs" && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                  <h4 className="font-bold mb-2">Verification Documents</h4>
                  <p className="text-xs text-gray-500 mb-4">Status: <span className={"font-medium " + (selectedUser.verified ? "text-emerald-400" : selectedUser.verificationStatus === "pending" ? "text-amber-400" : selectedUser.verificationStatus === "rejected" ? "text-red-400" : "text-gray-400")}>{selectedUser.verified ? "Approved" : selectedUser.verificationStatus || "Not submitted"}</span> {selectedUser.idType && <span className="ml-2 capitalize">({selectedUser.idType.replace("_", " ")})</span>}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedUser.verificationPhoto ? <div><p className="text-xs text-gray-500 mb-2">Selfie</p><img src={selectedUser.verificationPhoto} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedUser.verificationPhoto)} alt="Selfie" /></div> : <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-600"><Camera className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">No selfie</p></div>}
                    {selectedUser.idDocument ? <div><p className="text-xs text-gray-500 mb-2">ID Front</p><img src={selectedUser.idDocument} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedUser.idDocument)} alt="ID" /></div> : <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-600"><FileText className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">No ID front</p></div>}
                    {selectedUser.idDocumentBack ? <div><p className="text-xs text-gray-500 mb-2">ID Back</p><img src={selectedUser.idDocumentBack} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedUser.idDocumentBack)} alt="ID Back" /></div> : <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-600"><FileText className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">No ID back</p></div>}
                  </div>
                </div>
              )}

              {/* EDIT TAB */}
              {userTab === "edit" && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                  <h4 className="font-bold mb-4">Edit User Profile</h4>
                  {editMsg && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">{editMsg}</div>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {[
                      { key: "name", label: "Name", type: "text" },
                      { key: "email", label: "Email", type: "email" },
                      { key: "username", label: "Username", type: "text" },
                      { key: "phone", label: "Phone", type: "text" },
                      { key: "age", label: "Age", type: "number" },
                      { key: "country", label: "Country", type: "text" },
                      { key: "city", label: "City", type: "text" },
                      { key: "lookingFor", label: "Looking For", type: "text" },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-gray-400 text-xs font-medium mb-1 block">{f.label}</label>
                        <input type={f.type} value={editForm[f.key] || ""} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none" />
                      </div>
                    ))}
                    <div>
                      <label className="text-gray-400 text-xs font-medium mb-1 block">Gender</label>
                      <select value={editForm.gender || ""} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none">
                        <option value="">Not set</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs font-medium mb-1 block">Tier</label>
                      <select value={editForm.tier || "free"} onChange={e => setEditForm({ ...editForm, tier: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-sm focus:outline-none">
                        <option value="free">Free</option><option value="premium">Premium</option><option value="gold">Gold</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="text-gray-400 text-xs font-medium mb-1 block">Bio</label>
                    <textarea value={editForm.bio || ""} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none resize-none" />
                  </div>
                  <button onClick={handleEdit} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm flex items-center gap-2"><Save className="w-4 h-4" />Save Changes</button>
                </div>
              )}
            </div>
          )}

          {/* ===== VERIFICATIONS ===== */}
          {tab === "verifications" && !selectedVerif && (
            <div className="space-y-4">
              {verifications.length === 0 ? (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"><CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" /><h3 className="font-bold text-lg">All Clear!</h3><p className="text-gray-500 text-sm mt-1">No pending verifications</p></div>
              ) : verifications.map(v => (
                <div key={v.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">{v.profilePhoto ? <img src={v.profilePhoto} className="w-full h-full object-cover" alt="" /> : <Users className="w-5 h-5 text-gray-500 m-auto mt-3.5" />}</div>
                  <div className="flex-1"><p className="font-medium">{v.name}</p><p className="text-xs text-gray-500">{v.email} {v.idType && <span className="capitalize ml-2">({v.idType.replace("_", " ")})</span>}</p></div>
                  <button onClick={() => setSelectedVerif(v)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium">Review</button>
                </div>
              ))}
            </div>
          )}

          {tab === "verifications" && selectedVerif && (
            <div className="space-y-4">
              <button onClick={() => setSelectedVerif(null)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden">{selectedVerif.profilePhoto ? <img src={selectedVerif.profilePhoto} className="w-full h-full object-cover" alt="" /> : <Users className="w-6 h-6 text-gray-500 m-auto mt-4" />}</div>
                  <div><h3 className="text-lg font-bold">{selectedVerif.name}</h3><p className="text-sm text-gray-500">{selectedVerif.email}</p><div className="flex gap-2 text-xs text-gray-500 mt-1">{selectedVerif.age && <span>Age: {selectedVerif.age}</span>}{selectedVerif.gender && <span className="capitalize">{selectedVerif.gender}</span>}{selectedVerif.country && <span>{selectedVerif.country}</span>}{selectedVerif.idType && <span className="capitalize">{selectedVerif.idType.replace("_", " ")}</span>}</div></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {selectedVerif.verificationPhoto && <div><p className="text-xs text-gray-500 mb-2 font-medium">Selfie</p><img src={selectedVerif.verificationPhoto} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedVerif.verificationPhoto)} alt="Selfie" /></div>}
                  {selectedVerif.idDocument && <div><p className="text-xs text-gray-500 mb-2 font-medium">ID Front</p><img src={selectedVerif.idDocument} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedVerif.idDocument)} alt="ID" /></div>}
                  {selectedVerif.idDocumentBack && <div><p className="text-xs text-gray-500 mb-2 font-medium">ID Back</p><img src={selectedVerif.idDocumentBack} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedVerif.idDocumentBack)} alt="ID Back" /></div>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleVerification(selectedVerif.id, "approve")} disabled={actionLoading !== ""} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"><Check className="w-5 h-5" />Approve</button>
                  <button onClick={() => handleVerification(selectedVerif.id, "reject")} disabled={actionLoading !== ""} className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"><X className="w-5 h-5" />Reject</button>
                </div>
              </div>
            </div>
          )}

          {/* ===== REPORTS ===== */}
          {tab === "reports" && (
            <div>{reports.length === 0 ? <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"><CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" /><h3 className="font-bold">No Reports</h3></div> : reports.map((r, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-3"><p className="font-medium text-sm">{r.reason || "Report"}</p><p className="text-xs text-gray-500 mt-1">From: {r.reporterName || r.reporterId} &rarr; {r.reportedName || r.reportedId}</p>{r.description && <p className="text-sm text-gray-400 mt-3 p-3 bg-gray-800 rounded-xl">{r.description}</p>}</div>
            ))}</div>
          )}

          {/* ===== SETTINGS ===== */}
          {tab === "settings" && (
            <div className="max-w-lg space-y-6">
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <h3 className="font-bold mb-1">Change Password</h3><p className="text-gray-500 text-sm mb-6">Only you will know the new password.</p>
                {passMsg && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">{passMsg}</div>}
                {passError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{passError}</div>}
                <div className="space-y-4">
                  <div><label className="text-gray-400 text-xs mb-1 block">Current Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input type={showCurrentPass ? "text" : "password"} value={currentPass} onChange={e => setCurrentPass(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none" /><button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                  <div><label className="text-gray-400 text-xs mb-1 block">New Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input type={showNewPass ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none" /><button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                  <div><label className="text-gray-400 text-xs mb-1 block">Confirm New</label><input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-sm focus:border-blue-500 focus:outline-none" /></div>
                  <button onClick={handlePasswordChange} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" />Update Password</button>
                </div>
              </div>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <h3 className="font-bold mb-4">Admin Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span>{admin?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{admin?.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Panel URL</span><span className="text-blue-400 text-xs">/admin-page/c-panel-control</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Photo viewer */}
      {photoViewer && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4" onClick={() => setPhotoViewer(null)}>
          <button className="absolute top-6 right-6 text-white p-2"><X className="w-8 h-8" /></button>
          <img src={photoViewer} className="max-w-full max-h-[85vh] rounded-2xl" alt="" />
        </div>
      )}
    </div>
  );
}
