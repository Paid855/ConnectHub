"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Shield, AlertTriangle, LogOut, Search,
  Ban, Check, X, Trash2, Crown, Gem, Camera,
  Calendar, Coins, BarChart3,
  RefreshCw, Settings, Lock,
  UserCheck, FileText,
  Activity, Eye, EyeOff, Save,
  ArrowLeft, CheckCircle, XCircle, Download, RotateCcw, Wallet, DollarSign, Send, Clock
} from "lucide-react";

type UserData = {
  id: string; name: string; email: string; username: string | null;
  phone: string | null; age: number | null; gender: string | null;
  country: string | null; city: string | null; bio: string | null;
  lookingFor: string | null; profilePhoto: string | null;
  tier: string; verified: boolean; verificationStatus: string | null;
  verificationPhoto: string | null; idDocument: string | null;
  idDocumentBack: string | null; idType: string | null;
  verificationFrames: string | null;
  interests: string[]; coins: number; createdAt: string;
  lastSeen: string | null; banned: boolean;
  photos: string[] | null;
};

type Tab = "overview" | "users" | "verifications" | "reports" | "withdrawals" | "settings";

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<UserData[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalStats, setWithdrawalStats] = useState<any>({});
  const [withdrawalNote, setWithdrawalNote] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedVerif, setSelectedVerif] = useState<any | null>(null);
  const [photoViewer, setPhotoViewer] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState("");

  const handleWithdrawal = async (withdrawalId: string, action: "approve" | "reject", note: string) => {
    if (action === "reject" && !confirm("Reject this withdrawal? Coins will be refunded to user.")) return;
    setActionLoading(withdrawalId);
    try {
      await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action, adminNote: note || (action === "approve" ? "Approved and sent" : "Rejected") })
      });
      const r = await fetch("/api/admin/withdrawals").then(r => r.ok ? r.json() : null);
      if (r) { setWithdrawals(r.withdrawals || []); setWithdrawalStats(r.stats || {}); }
      setWithdrawalNote("");
    } catch {}
    setActionLoading("");
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userTab, setUserTab] = useState<"info" | "photos" | "docs" | "edit">("info");

  // Edit state
  const [editData, setEditData] = useState<any>({});
  const [editMsg, setEditMsg] = useState("");

  // Coin state
  const [coinAmount, setCoinAmount] = useState("");
  const [coinAction, setCoinAction] = useState<"add" | "set">("add");

  // Settings state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passError, setPassError] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/admin/me");
      if (!res.ok) { router.push("/admin-page/c-panel-control"); return; }
      setAdmin(await res.json());
      await loadAll();
      setLoading(false);
    };
    check();
  }, []);

  const loadAll = async () => {
    const [u, v, rp, wd] = await Promise.allSettled([
      fetch("/api/admin/users").then(r => r.ok ? r.json() : null),
      fetch("/api/admin/verifications").then(r => r.ok ? r.json() : null),
      fetch("/api/admin/reports").then(r => r.ok ? r.json() : null),
      fetch("/api/admin/withdrawals").then(r => r.ok ? r.json() : null),
    ]);
    if (u.status === "fulfilled" && u.value) setUsers(u.value.users || []);
    if (v.status === "fulfilled" && v.value) setVerifications(v.value.verifications || v.value.pending || []);
    if (rp.status === "fulfilled" && rp.value) setReports(rp.value.reports || []);
    if (wd.status === "fulfilled" && wd.value) { setWithdrawals(wd.value.withdrawals || []); setWithdrawalStats(wd.value.stats || {}); }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin-page/c-panel-control");
  };

  const handleUserAction = async (userId: string, action: string) => {
    setActionLoading(userId + action);
    if (action === "resetVerify" && !confirm("Reset this user's verification? They will need to verify again.")) { setActionLoading(""); return; }
    if (action === "ban" && !confirm("Ban this user?")) { setActionLoading(""); return; }
    if (action === "delete" && !confirm("DELETE this user permanently? Cannot be undone!")) { setActionLoading(""); return; }
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        action: action === "makeGold" ? "upgrade" : action === "makePremium" ? "upgrade" : action,
        tier: action === "makeGold" ? "gold" : action === "makePremium" ? "premium" : undefined
      }),
    });
    await loadAll();
    // Refresh selectedUser with latest data
    const refreshed = await fetch("/api/admin/users").then(r => r.ok ? r.json() : null);
    if (refreshed?.users) {
      setUsers(refreshed.users);
      const updated = refreshed.users.find((u: any) => u.id === userId);
      if (updated) setSelectedUser(updated);
      else setSelectedUser(null);
    } else {
      setSelectedUser(null);
    }
    setActionLoading("");
  };

  const handleCoins = async () => {
    if (!selectedUser || !coinAmount) return;
    setActionLoading("coins");
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUser.id,
        action: "coins",
        coins: Number(coinAmount),
        coinsAction: coinAction,
      }),
    });
    const refreshed = await fetch("/api/admin/users").then(r => r.ok ? r.json() : null);
    if (refreshed?.users) {
      setUsers(refreshed.users);
      const updated = refreshed.users.find((u: any) => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    }
    setCoinAmount("");
    setActionLoading("");
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setEditMsg("");
    setActionLoading("edit");
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id, action: "editProfile", editProfile: editData }),
    });
    const refreshed = await fetch("/api/admin/users").then(r => r.ok ? r.json() : null);
    if (refreshed?.users) {
      setUsers(refreshed.users);
      const updated = refreshed.users.find((u: any) => u.id === selectedUser.id);
      if (updated) { setSelectedUser(updated); setEditData(updated); }
    }
    setEditMsg("Saved!");
    setActionLoading("");
    setTimeout(() => setEditMsg(""), 2000);
  };

  const handleVerification = async (userId: string, action: "approve" | "reject") => {
    setActionLoading(userId + action);
    await fetch("/api/admin/verifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    await loadAll();
    setActionLoading("");
    setSelectedVerif(null);
  };

  const handlePasswordChange = async () => {
    setPassMsg(""); setPassError("");
    if (!currentPass || !newPass) { setPassError("Fill in all fields"); return; }
    if (newPass !== confirmPass) { setPassError("New passwords don't match"); return; }
    if (newPass.length < 6) { setPassError("Minimum 6 characters"); return; }
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (res.ok) { setPassMsg("Password changed!"); setCurrentPass(""); setNewPass(""); setConfirmPass(""); }
      else { setPassError(data.error || "Failed"); }
    } catch { setPassError("Connection error"); }
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllVerification = (user: any) => {
    const safeName = (user.name || "user").replace(/[^a-zA-Z0-9]/g, "_");
    let frames: any[] = [];
    try {
      if (user.verificationFrames) {
        const parsed = JSON.parse(user.verificationFrames);
        frames = parsed.frames || [];
      }
    } catch {}
    let delay = 0;
    if (frames.length > 0) {
      frames.forEach((f: any, i: number) => {
        setTimeout(() => downloadImage(f.image, safeName + "_selfie_" + (f.label || f.pose || i) + ".jpg"), delay);
        delay += 400;
      });
    } else if (user.verificationPhoto) {
      downloadImage(user.verificationPhoto, safeName + "_selfie.jpg");
      delay += 400;
    }
    if (user.idDocument) {
      setTimeout(() => downloadImage(user.idDocument, safeName + "_id_front.jpg"), delay);
      delay += 400;
    }
    if (user.idDocumentBack) {
      setTimeout(() => downloadImage(user.idDocumentBack, safeName + "_id_back.jpg"), delay);
    }
  };

  const parseFrames = (user: any): any[] => {
    try {
      if (user?.verificationFrames) {
        const parsed = JSON.parse(user.verificationFrames);
        return parsed.frames || [];
      }
    } catch {}
    return [];
  };

  const parseLiveness = (user: any): any => {
    try {
      if (user?.verificationFrames) {
        const parsed = JSON.parse(user.verificationFrames);
        return parsed.liveness || null;
      }
    } catch {}
    return null;
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
    online: realUsers.filter(u => u.lastSeen && Date.now() - new Date(u.lastSeen).getTime() < 5 * 60 * 1000).length,
    pendingVerif: verifications.length,
    reports: reports.length,
  };

  const ago = (d: string) => {
    const ms = Date.now() - new Date(d).getTime();
    if (ms < 60000) return "Just now";
    if (ms < 3600000) return Math.floor(ms / 60000) + "m ago";
    if (ms < 86400000) return Math.floor(ms / 3600000) + "h ago";
    return Math.floor(ms / 86400000) + "d ago";
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading control panel...</p>
      </div>
    </div>
  );

  const TABS: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users, badge: stats.total },
    { id: "verifications", label: "Verify", icon: Shield, badge: stats.pendingVerif },
    { id: "reports", label: "Reports", icon: AlertTriangle, badge: stats.reports },
    { id: "withdrawals", label: "Withdrawals", icon: Wallet, badge: withdrawalStats.pending || 0 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className={"fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform " + (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm">ConnectHub</h1>
              <p className="text-gray-500 text-xs">Control Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSidebarOpen(false); setSelectedUser(null); setSelectedVerif(null); }}
              className={"w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all " +
                (tab === t.id ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white")}>
              <t.icon className="w-5 h-5" />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className={"ml-auto text-xs px-2 py-0.5 rounded-full " +
                  (tab === t.id ? "bg-blue-500" : t.id === "verifications" ? "bg-amber-500 text-black" : "bg-gray-700")}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{admin?.name || "Admin"}</p>
              <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
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
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">{TABS.find(t => t.id === tab)?.label}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {tab === "overview" && "Platform overview"}
                {tab === "users" && `${stats.total} registered users`}
                {tab === "verifications" && `${stats.pendingVerif} pending`}
                {tab === "reports" && `${stats.reports} reports`}
                {tab === "withdrawals" && `${withdrawalStats.pending || 0} pending`}
                {tab === "settings" && "Account settings"}
              </p>
            </div>
            <button onClick={() => { setLoading(true); loadAll().then(() => setLoading(false)); }} className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl"><RefreshCw className="w-4 h-4" /></button>
          </div>

          {/* ========== OVERVIEW ========== */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Users", value: stats.total, icon: Users, color: "bg-blue-500/10 text-blue-400", border: "border-blue-500/20" },
                  { label: "Online Now", value: stats.online, icon: Activity, color: "bg-emerald-500/10 text-emerald-400", border: "border-emerald-500/20" },
                  { label: "Verified", value: stats.verified, icon: UserCheck, color: "bg-purple-500/10 text-purple-400", border: "border-purple-500/20" },
                  { label: "Pending Verify", value: stats.pendingVerif, icon: Shield, color: "bg-amber-500/10 text-amber-400", border: "border-amber-500/20" },
                  { label: "Premium", value: stats.premium, icon: Crown, color: "bg-pink-500/10 text-pink-400", border: "border-pink-500/20" },
                  { label: "Gold", value: stats.gold, icon: Gem, color: "bg-yellow-500/10 text-yellow-400", border: "border-yellow-500/20" },
                  { label: "Banned", value: stats.banned, icon: Ban, color: "bg-red-500/10 text-red-400", border: "border-red-500/20" },
                  { label: "Reports", value: stats.reports, icon: AlertTriangle, color: "bg-orange-500/10 text-orange-400", border: "border-orange-500/20" },
                  { label: "Withdrawals", value: withdrawalStats.pending || 0, icon: Wallet, color: "bg-green-500/10 text-green-400", border: "border-green-500/20" },
                ].map((s, i) => (
                  <div key={i} className={"bg-gray-900 rounded-2xl p-5 border " + s.border}>
                    <div className={"w-10 h-10 rounded-xl flex items-center justify-center mb-3 " + s.color}><s.icon className="w-5 h-5" /></div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-gray-500 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="font-bold mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {realUsers.slice(0, 5).map(u => (
                    <div key={u.id} onClick={() => { setTab("users"); setSelectedUser(u); setUserTab("info"); setEditData(u); }} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-750">
                      <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                        {u.profilePhoto ? <img src={u.profilePhoto} className="w-full h-full object-cover" alt="" /> : <Users className="w-5 h-5 text-gray-500 m-auto mt-2.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name} {u.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400 inline ml-1" />}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      <span className={"text-xs px-2 py-1 rounded-full " + (u.tier === "gold" ? "bg-yellow-500/10 text-yellow-400" : u.tier === "premium" ? "bg-pink-500/10 text-pink-400" : "bg-gray-700 text-gray-400")}>{u.tier}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========== USERS LIST ========== */}
          {tab === "users" && !selectedUser && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email..." className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="all">All Tiers</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="gold">Gold</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(u => (
                  <div key={u.id} onClick={() => { setSelectedUser(u); setUserTab("info"); setEditData(u); setCoinAmount(""); }} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 cursor-pointer hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                        {u.profilePhoto ? <img src={u.profilePhoto} className="w-full h-full object-cover" alt="" /> : <Users className="w-5 h-5 text-gray-500 m-auto mt-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{u.name} {u.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400 inline ml-1" />}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={"px-2 py-1 rounded-full " + (u.tier === "gold" ? "bg-yellow-500/10 text-yellow-400" : u.tier === "premium" ? "bg-pink-500/10 text-pink-400" : "bg-gray-800 text-gray-400")}>{u.tier}</span>
                      <span className="text-gray-500">{u.coins} coins</span>
                      <span className="text-gray-500">{ago(u.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {filteredUsers.length === 0 && <div className="p-8 text-center text-gray-500">No users found</div>}
            </div>
          )}

          {/* ========== USER DETAIL ========== */}
          {tab === "users" && selectedUser && (
            <div className="space-y-6">
              <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"><ArrowLeft className="w-4 h-4" /> Back to users</button>

              {/* User header */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                    {selectedUser.profilePhoto ? <img src={selectedUser.profilePhoto} className="w-full h-full object-cover cursor-pointer" onClick={() => setPhotoViewer(selectedUser.profilePhoto)} alt="" /> : <Users className="w-8 h-8 text-gray-500 m-auto mt-4" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{selectedUser.name} {selectedUser.verified && <CheckCircle className="w-4 h-4 text-blue-400 inline ml-1" />} {selectedUser.banned && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-2">Banned</span>}</h3>
                    <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={"text-xs px-2 py-1 rounded-full " + (selectedUser.tier === "gold" ? "bg-yellow-500/10 text-yellow-400" : selectedUser.tier === "premium" ? "bg-pink-500/10 text-pink-400" : "bg-gray-800 text-gray-400")}>{selectedUser.tier}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400">{selectedUser.coins} coins</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-2 overflow-x-auto">
                {(["info", "photos", "docs", "edit"] as const).map(t => (
                  <button key={t} onClick={() => { setUserTab(t); if (t === "edit") setEditData(selectedUser); }}
                    className={"px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap " + (userTab === t ? "bg-blue-600" : "bg-gray-800 text-gray-400 hover:bg-gray-700")}>
                    {t === "info" ? "Profile Info" : t === "photos" ? "Photos" : t === "docs" ? "Documents" : "Edit Profile"}
                  </button>
                ))}
              </div>

              {/* INFO TAB */}
              {userTab === "info" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                    <h4 className="font-bold mb-4">User Details</h4>
                    <div className="space-y-3 text-sm">
                      {[
                        ["Username", selectedUser.username ? "@" + selectedUser.username : "—"],
                        ["Age", selectedUser.age || "—"],
                        ["Gender", selectedUser.gender || "—"],
                        ["Country", selectedUser.country || "—"],
                        ["City", (selectedUser as any).city || "—"],
                        ["Phone", selectedUser.phone || "—"],
                        ["Verified", selectedUser.verified ? "Yes" : "No"],
                        ["Verify Status", selectedUser.verificationStatus || "—"],
                        ["Joined", new Date(selectedUser.createdAt).toLocaleDateString()],
                        ["Last Seen", selectedUser.lastSeen ? ago(selectedUser.lastSeen) : "—"],
                      ].map(([k, v]) => (
                        <div key={k as string} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="capitalize">{String(v)}</span></div>
                      ))}
                    </div>
                    {selectedUser.bio && <div className="mt-4 p-3 bg-gray-800 rounded-xl"><p className="text-xs text-gray-500 mb-1">Bio</p><p className="text-sm">{selectedUser.bio}</p></div>}
                  </div>

                  <div className="space-y-4">
                    {/* Coins */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                      <h4 className="font-bold mb-3">Manage Coins <span className="text-amber-400 ml-2">({selectedUser.coins})</span></h4>
                      <div className="flex gap-2">
                        <select value={coinAction} onChange={e => setCoinAction(e.target.value as any)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                          <option value="add">Add</option>
                          <option value="set">Set to</option>
                        </select>
                        <input type="number" value={coinAmount} onChange={e => setCoinAmount(e.target.value)} placeholder="Amount" className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                        <button onClick={handleCoins} disabled={actionLoading === "coins" || !coinAmount} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium disabled:opacity-50">
                          {actionLoading === "coins" ? "..." : "Apply"}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                      <h4 className="font-bold mb-3">Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleUserAction(selectedUser.id, "makePremium")} disabled={actionLoading !== ""} className="p-2.5 bg-pink-600 hover:bg-pink-700 rounded-xl text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"><Crown className="w-3.5 h-3.5" /> Premium</button>
                        <button onClick={() => handleUserAction(selectedUser.id, "makeGold")} disabled={actionLoading !== ""} className="p-2.5 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"><Gem className="w-3.5 h-3.5" /> Gold</button>
                        <button onClick={() => handleUserAction(selectedUser.id, "downgrade")} disabled={actionLoading !== ""} className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5">Free</button>
                        <button onClick={() => handleUserAction(selectedUser.id, selectedUser.banned ? "unban" : "ban")} disabled={actionLoading !== ""} className={"p-2.5 rounded-xl text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5 " + (selectedUser.banned ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}><Ban className="w-3.5 h-3.5" /> {selectedUser.banned ? "Unban" : "Ban"}</button>
                        <div className="col-span-2 space-y-2">
                          <input value={resetReason} onChange={e => setResetReason(e.target.value)} placeholder="Reason for reset (shown to user)..." className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white placeholder:text-gray-500 outline-none focus:border-orange-500" />
                          <button onClick={async () => { if (!confirm("Reset verification? User will be notified and must re-verify.")) return; setActionLoading("reset"); await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: selectedUser.id, action: "resetVerify", reason: resetReason || "Your verification has been reset by our team. Please re-verify your profile." }) }); const r = await fetch("/api/admin/users").then(r => r.ok ? r.json() : null); if (r?.users) { setUsers(r.users); const u = r.users.find((u:any) => u.id === selectedUser.id); if (u) setSelectedUser(u); } setActionLoading(""); setResetReason(""); }} disabled={actionLoading !== ""} className="w-full p-2.5 bg-orange-600 hover:bg-orange-700 rounded-xl text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Reset Verify & Notify User</button>
                        </div>
                        <button onClick={() => handleUserAction(selectedUser.id, "delete")} disabled={actionLoading !== ""} className="p-2.5 bg-red-900 hover:bg-red-800 rounded-xl text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5 text-red-300"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PHOTOS TAB */}
              {userTab === "photos" && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                  <h4 className="font-bold mb-4">User Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {selectedUser.profilePhoto && (
                      <div><p className="text-xs text-gray-500 mb-2">Profile</p><img src={selectedUser.profilePhoto} className="w-full aspect-square rounded-xl border border-gray-700 object-cover cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedUser.profilePhoto)} alt="Profile" /></div>
                    )}
                    {(selectedUser.photos || []).map((p, i) => (
                      <div key={i}><p className="text-xs text-gray-500 mb-2">Photo {i + 1}</p><img src={p} className="w-full aspect-square rounded-xl border border-gray-700 object-cover cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(p)} alt="" /></div>
                    ))}
                  </div>
                  {!selectedUser.profilePhoto && (!selectedUser.photos || selectedUser.photos.length === 0) && (
                    <div className="p-8 text-center text-gray-600"><Camera className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">No photos</p></div>
                  )}
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {userTab === "docs" && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold">Verification Documents</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Status: <span className={"font-medium " + (selectedUser.verified ? "text-emerald-400" : selectedUser.verificationStatus === "pending" ? "text-amber-400" : selectedUser.verificationStatus === "rejected" ? "text-red-400" : "text-gray-400")}>
                          {selectedUser.verified ? "Approved" : selectedUser.verificationStatus || "Not submitted"}
                        </span>
                        {selectedUser.idType && <span className="ml-2 capitalize">({selectedUser.idType.replace("_", " ")})</span>}
                      </p>
                    </div>
                    {(selectedUser.verificationPhoto || selectedUser.idDocument || parseFrames(selectedUser).length > 0) && (
                      <button onClick={() => downloadAllVerification(selectedUser)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors">
                        <Download className="w-3.5 h-3.5" /> Download All
                      </button>
                    )}
                  </div>

                  {/* Selfie Frames */}
                  {parseFrames(selectedUser).length > 0 ? (
                    <div className="mb-5">
                      <p className="text-xs text-gray-400 font-bold mb-3 flex items-center gap-2"><Camera className="w-4 h-4" /> Liveness Selfie Frames ({parseFrames(selectedUser).length})</p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {parseFrames(selectedUser).map((frame: any, idx: number) => (
                          <div key={idx} className="text-center">
                            <img src={frame.image} className="w-full aspect-square rounded-xl border border-gray-700 object-cover cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-blue-500" onClick={() => setPhotoViewer(frame.image)} alt={frame.label} />
                            <p className="text-[10px] text-gray-500 mt-1 font-semibold">{frame.label || frame.pose}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : selectedUser.verificationPhoto ? (
                    <div className="mb-5">
                      <p className="text-xs text-gray-400 font-bold mb-3">Selfie</p>
                      <img src={selectedUser.verificationPhoto} className="w-40 rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedUser.verificationPhoto)} alt="Selfie" />
                    </div>
                  ) : null}

                  {/* ID Documents */}
                  <p className="text-xs text-gray-400 font-bold mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> ID Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {selectedUser.idDocument ? (
                      <div><p className="text-xs text-gray-500 mb-2">Front</p><img src={selectedUser.idDocument} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedUser.idDocument)} alt="ID Front" /></div>
                    ) : (
                      <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-600"><FileText className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">No ID front</p></div>
                    )}
                    {selectedUser.idDocumentBack ? (
                      <div><p className="text-xs text-gray-500 mb-2">Back</p><img src={selectedUser.idDocumentBack} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedUser.idDocumentBack)} alt="ID Back" /></div>
                    ) : (
                      <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-600"><FileText className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">No ID back</p></div>
                    )}
                  </div>

                  {/* Liveness Metadata */}
                  {parseLiveness(selectedUser) && (
                    <div className="p-3 bg-gray-800 rounded-xl">
                      <p className="text-xs text-gray-400 font-bold mb-2">Liveness Metadata</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>Challenges: {parseLiveness(selectedUser)?.challengeCount || parseLiveness(selectedUser)?.requiredChallenges?.length || "?"}</div>
                        <div>Completed: {parseLiveness(selectedUser)?.completedChallenges?.length || "?"}</div>
                        <div className="col-span-2">Submitted: {parseLiveness(selectedUser)?.submittedAt ? new Date(parseLiveness(selectedUser).submittedAt).toLocaleString() : "Unknown"}</div>
                      </div>
                    </div>
                  )}

                  {!selectedUser.verificationPhoto && !selectedUser.idDocument && parseFrames(selectedUser).length === 0 && (
                    <div className="p-8 text-center text-gray-600"><Shield className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">No verification submitted</p></div>
                  )}
                </div>
              )}

              {/* EDIT TAB */}
              {userTab === "edit" && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                  <h4 className="font-bold mb-4">Edit User Profile</h4>
                  {editMsg && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">{editMsg}</div>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "name", label: "Name" },
                      { key: "email", label: "Email" },
                      { key: "username", label: "Username" },
                      { key: "phone", label: "Phone" },
                      { key: "age", label: "Age", type: "number" },
                      { key: "gender", label: "Gender" },
                      { key: "country", label: "Country" },
                      { key: "city", label: "City" },
                      { key: "lookingFor", label: "Looking For" },
                      { key: "tier", label: "Tier" },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-gray-400 text-xs font-medium mb-1 block">{f.label}</label>
                        <input type={f.type || "text"} value={editData[f.key] || ""} onChange={e => setEditData({ ...editData, [f.key]: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="text-gray-400 text-xs font-medium mb-1 block">Bio</label>
                    <textarea value={editData.bio || ""} onChange={e => setEditData({ ...editData, bio: e.target.value })} rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none resize-none" />
                  </div>
                  <button onClick={handleEdit} disabled={actionLoading === "edit"} className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {actionLoading === "edit" ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========== VERIFICATIONS ========== */}
          {tab === "verifications" && !selectedVerif && (
            <div className="space-y-4">
              {verifications.length === 0 ? (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="font-bold text-lg">All Clear!</h3>
                  <p className="text-gray-500 text-sm mt-1">No pending verifications</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {verifications.map(v => (
                    <div key={v.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                          {v.profilePhoto ? <img src={v.profilePhoto} className="w-full h-full object-cover" alt="" /> : <Users className="w-5 h-5 text-gray-500 m-auto mt-3.5" />}
                        </div>
                        <div>
                          <p className="font-medium">{v.name}</p>
                          <p className="text-xs text-gray-500">{v.email}</p>
                        </div>
                        <span className="ml-auto text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full">Pending</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                        {v.age && <span>Age: {v.age}</span>}
                        {v.gender && <span className="capitalize">{v.gender}</span>}
                        {v.country && <span>{v.country}</span>}
                        {v.idType && <span className="capitalize">{v.idType.replace("_", " ")}</span>}
                      </div>
                      <button onClick={() => setSelectedVerif(v)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium">Review</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verification Review */}
          {tab === "verifications" && selectedVerif && (
            <div className="space-y-6">
              <button onClick={() => setSelectedVerif(null)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>

              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                    {selectedVerif.profilePhoto ? <img src={selectedVerif.profilePhoto} className="w-full h-full object-cover" alt="" /> : <Users className="w-6 h-6 text-gray-500 m-auto mt-4" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{selectedVerif.name}</h3>
                    <p className="text-sm text-gray-500">{selectedVerif.email}</p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      {selectedVerif.age && <span>Age: {selectedVerif.age}</span>}
                      {selectedVerif.gender && <span className="capitalize">{selectedVerif.gender}</span>}
                      {selectedVerif.country && <span>{selectedVerif.country}</span>}
                      {selectedVerif.idType && <span className="capitalize">{selectedVerif.idType.replace("_", " ")}</span>}
                    </div>
                  </div>
                </div>

                <h4 className="font-bold mb-4">Submitted Documents</h4>

                {/* Selfie Frames */}
                {parseFrames(selectedVerif).length > 0 ? (
                  <div className="mb-5">
                    <p className="text-xs text-gray-400 font-bold mb-3 flex items-center gap-2"><Camera className="w-4 h-4" /> Liveness Selfie Frames ({parseFrames(selectedVerif).length})</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {parseFrames(selectedVerif).map((f: any, i: number) => (
                        <div key={i} className="text-center">
                          <img src={f.image} className="w-full aspect-square rounded-xl border border-gray-700 object-cover cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-blue-500" onClick={() => setPhotoViewer(f.image)} alt={f.label} />
                          <p className="text-[10px] text-gray-500 mt-1 font-semibold">{f.label || f.pose}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedVerif.verificationPhoto ? (
                  <div className="mb-5">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Selfie</p>
                    <img src={selectedVerif.verificationPhoto} className="w-40 rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedVerif.verificationPhoto)} alt="Selfie" />
                  </div>
                ) : null}

                {/* ID Documents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {selectedVerif.idDocument && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium">ID Front {selectedVerif.idType && <span className="capitalize">({selectedVerif.idType.replace("_", " ")})</span>}</p>
                      <img src={selectedVerif.idDocument} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedVerif.idDocument)} alt="ID Front" />
                    </div>
                  )}
                  {selectedVerif.idDocumentBack && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium">ID Back</p>
                      <img src={selectedVerif.idDocumentBack} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedVerif.idDocumentBack)} alt="ID Back" />
                    </div>
                  )}
                </div>

                {!selectedVerif.verificationPhoto && !selectedVerif.idDocument && parseFrames(selectedVerif).length === 0 && (
                  <div className="p-6 bg-gray-800 rounded-xl text-center text-gray-500 mb-6"><Camera className="w-8 h-8 mx-auto mb-2 text-gray-600" /><p className="text-sm">No documents submitted</p></div>
                )}

                {/* Liveness metadata */}
                {parseLiveness(selectedVerif) && (
                  <div className="p-3 bg-gray-800 rounded-xl mb-6">
                    <p className="text-xs text-gray-400 font-bold mb-2">Liveness Metadata</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>Challenges: {parseLiveness(selectedVerif)?.challengeCount || "?"}</div>
                      <div>Completed: {parseLiveness(selectedVerif)?.completedChallenges?.length || "?"}</div>
                      <div className="col-span-2">Submitted: {parseLiveness(selectedVerif)?.submittedAt ? new Date(parseLiveness(selectedVerif).submittedAt).toLocaleString() : "Unknown"}</div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button onClick={() => downloadAllVerification(selectedVerif)} disabled={actionLoading !== ""} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" /> Download All
                  </button>
                  <button onClick={() => handleVerification(selectedVerif.id, "approve")} disabled={actionLoading !== ""} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Approve
                  </button>
                  <button onClick={() => handleVerification(selectedVerif.id, "reject")} disabled={actionLoading !== ""} className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                    <X className="w-5 h-5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========== REPORTS ========== */}
          {tab === "reports" && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="font-bold text-lg">No Reports</h3>
                  <p className="text-gray-500 text-sm mt-1">Everything looks clean</p>
                </div>
              ) : (
                reports.map((r, i) => (
                  <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{r.reason || "User report"}</p>
                        <p className="text-xs text-gray-500 mt-1">From: {r.reporterName || r.reporterId} → {r.reportedName || r.reportedId}</p>
                      </div>
                      <span className="text-xs text-gray-500">{r.createdAt ? ago(r.createdAt) : ""}</span>
                    </div>
                    {r.description && <p className="text-sm text-gray-400 mt-3 p-3 bg-gray-800 rounded-xl">{r.description}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========== SETTINGS ========== */}
          {tab === "withdrawals" && (
            <div className="space-y-4">
              {/* Withdrawal Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <Clock className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="text-2xl font-extrabold text-white">{withdrawalStats.pending || 0}</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <DollarSign className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="text-2xl font-extrabold text-white">{((withdrawalStats.totalPendingCoins || 0) * 0.01).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Pending USD</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                  <p className="text-2xl font-extrabold text-white">{withdrawalStats.approved || 0}</p>
                  <p className="text-xs text-gray-400">Approved</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <XCircle className="w-5 h-5 text-red-400 mb-2" />
                  <p className="text-2xl font-extrabold text-white">{withdrawalStats.rejected || 0}</p>
                  <p className="text-xs text-gray-400">Rejected</p>
                </div>
              </div>

              {/* How to pay info */}
              <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/30 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-300 mb-2">💡 How to process withdrawals</h4>
                <div className="text-xs text-blue-200/70 space-y-1">
                  <p>1. Review the user's bank details below</p>
                  <p>2. Go to <span className="font-bold text-blue-300">Flutterwave Dashboard → Transfers → Send Money</span></p>
                  <p>3. Enter the user's bank details and send the amount</p>
                  <p>4. Come back here and click <span className="font-bold text-green-300">Approve</span> to notify the user</p>
                </div>
              </div>

              {/* Withdrawal list */}
              {withdrawals.length === 0 ? (
                <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
                  <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-gray-300">No Withdrawal Requests</h3>
                  <p className="text-gray-500 text-sm mt-1">When users request withdrawals, they will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w: any) => (
                    <div key={w.id} className={"bg-gray-800 rounded-xl border overflow-hidden " + (w.status === "pending" ? "border-amber-500/30" : w.status === "approved" || w.status === "completed" ? "border-green-500/30" : "border-red-500/30")}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                              {w.user?.profilePhoto ? <img src={w.user.profilePhoto} alt="" className="w-full h-full object-cover" /> : (w.user?.name?.[0] || "?")}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{w.user?.name || "User"}</p>
                              <p className="text-xs text-gray-400">{w.user?.email}</p>
                            </div>
                          </div>
                          <span className={"text-xs font-bold px-3 py-1 rounded-full " + (w.status === "pending" ? "bg-amber-500/20 text-amber-400" : w.status === "approved" || w.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                            {w.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-gray-900 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Coins</p>
                            <p className="text-lg font-extrabold text-amber-400">{w.amount.toLocaleString()}</p>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">USD Amount</p>
                            <p className="text-lg font-extrabold text-green-400">${w.usdAmount || (w.amount * 0.01).toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Bank details */}
                        <div className="bg-gray-900 rounded-lg p-3 mb-3">
                          <p className="text-xs text-gray-500 mb-2 font-medium">🏦 Bank Details</p>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans">{w.details || "No details provided"}</pre>
                        </div>

                        <p className="text-xs text-gray-500">Requested: {new Date(w.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        {w.processedAt && <p className="text-xs text-gray-500">Processed: {new Date(w.processedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
                        {w.adminNote && <p className="text-xs text-gray-400 mt-1 italic">Note: {w.adminNote}</p>}
                      </div>

                      {/* Action buttons for pending */}
                      {w.status === "pending" && (
                        <div className="border-t border-gray-700 p-3 bg-gray-850">
                          <input value={withdrawalNote} onChange={e => setWithdrawalNote(e.target.value)} placeholder="Admin note (optional)..." className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white placeholder:text-gray-500 outline-none mb-2 focus:border-blue-500" />
                          <div className="flex gap-2">
                            <button onClick={() => handleWithdrawal(w.id, "approve", withdrawalNote)} disabled={actionLoading === w.id} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all">
                              {actionLoading === w.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve & Mark Paid
                            </button>
                            <button onClick={() => handleWithdrawal(w.id, "reject", withdrawalNote)} disabled={actionLoading === w.id} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all">
                              <XCircle className="w-3.5 h-3.5" /> Reject & Refund
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "settings" && (
            <div className="max-w-lg space-y-6">
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <h3 className="font-bold mb-1">Change Password</h3>
                <p className="text-gray-500 text-sm mb-6">Update your admin password.</p>
                {passMsg && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">{passMsg}</div>}
                {passError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{passError}</div>}
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs font-medium mb-1 block">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input type={showCurrentPass ? "text" : "password"} value={currentPass} onChange={e => setCurrentPass(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none" placeholder="Enter current password" />
                      <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium mb-1 block">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input type={showNewPass ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none" placeholder="Enter new password" />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium mb-1 block">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none" placeholder="Confirm new password" />
                    </div>
                  </div>
                  <button onClick={handlePasswordChange} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Update Password
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <h3 className="font-bold mb-1">Admin Info</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span>{admin?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{admin?.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Admin URL</span><span className="text-blue-400 text-xs">/admin-page/c-panel-control</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Photo viewer modal */}
      {photoViewer && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setPhotoViewer(null)}>
          <button className="absolute top-6 right-6 text-white p-2" onClick={() => setPhotoViewer(null)}><X className="w-8 h-8" /></button>
          <img src={photoViewer} className="max-w-full max-h-[85vh] rounded-2xl" alt="Full view" />
        </div>
      )}
    </div>
  );
}
