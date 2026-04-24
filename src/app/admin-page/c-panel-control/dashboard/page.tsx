"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Shield, AlertTriangle, DollarSign, LogOut, Search,
  Eye, Ban, Check, X, Trash2, Crown, Gem, Camera, Mail,
  Calendar, Heart, Coins, TrendingUp, BarChart3, Filter,
  RefreshCw, Settings, ChevronDown, ChevronRight, Lock,
  UserCheck, UserX, Image, FileText, Globe, Phone,
  MessageCircle, Activity, Zap, Award, EyeOff, Save,
  ArrowLeft, ArrowRight, Clock, Star, CheckCircle, XCircle
} from "lucide-react";

type UserData = {
  id: string; name: string; email: string; username: string | null;
  phone: string | null; age: number | null; gender: string | null;
  country: string | null; bio: string | null; profilePhoto: string | null;
  tier: string; verified: boolean; verificationStatus: string | null;
  verificationPhoto: string | null; idDocument: string | null;
  idDocumentBack: string | null; idType: string | null;
  interests: string[]; coins: number; createdAt: string;
  lastSeen: string | null; banned: boolean;
};

type Verification = {
  id: string; name: string; email: string; username: string | null;
  age: number | null; gender: string | null; country: string | null;
  profilePhoto: string | null; verificationPhoto: string | null;
  idDocument: string | null; idDocumentBack: string | null;
  idType: string | null; createdAt: string;
};

type Tab = "overview" | "users" | "verifications" | "reports" | "settings";

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<UserData[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedVerif, setSelectedVerif] = useState<Verification | null>(null);
  const [photoViewer, setPhotoViewer] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    const [u, v, rp, rv] = await Promise.allSettled([
      fetch("/api/admin/users").then(r => r.ok ? r.json() : null),
      fetch("/api/admin/verifications").then(r => r.ok ? r.json() : null),
      fetch("/api/admin/reports").then(r => r.ok ? r.json() : null),
      fetch("/api/admin/revenue").then(r => r.ok ? r.json() : null),
    ]);
    if (u.status === "fulfilled" && u.value) setUsers(u.value.users || []);
    if (v.status === "fulfilled" && v.value) setVerifications(v.value.verifications || v.value.pending || []);
    if (rp.status === "fulfilled" && rp.value) setReports(rp.value.reports || []);
    if (rv.status === "fulfilled" && rv.value) setRevenue(rv.value);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin-page/c-panel-control");
  };

  const handleUserAction = async (userId: string, action: string) => {
    setActionLoading(userId + action);
    if (action === "ban" && !confirm("Ban this user?")) { setActionLoading(""); return; }
    if (action === "delete" && !confirm("DELETE this user permanently? Cannot be undone!")) { setActionLoading(""); return; }
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: action === "makeGold" ? "upgrade" : action === "makePremium" ? "upgrade" : action, tier: action === "makeGold" ? "gold" : action === "makePremium" ? "premium" : undefined }),
    });
    await loadAll();
    setActionLoading("");
    setSelectedUser(null);
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
    setPassMsg("");
    setPassError("");
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
      if (res.ok) {
        setPassMsg("Password changed successfully!");
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
      } else {
        setPassError(data.error || "Failed to change password");
      }
    } catch {
      setPassError("Connection error");
    }
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
    banned: realUsers.filter(u => u.banned || u.tier === "banned").length,
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
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSidebarOpen(false); }}
              className={"w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all " +
                (tab === t.id ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white")}
            >
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
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-400">
          <BarChart3 className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-sm">Control Panel</h1>
        <button onClick={handleLogout} className="p-2 text-red-400">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">{TABS.find(t => t.id === tab)?.label}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {tab === "overview" && "Platform overview and statistics"}
                {tab === "users" && `${stats.total} registered users`}
                {tab === "verifications" && `${stats.pendingVerif} pending verifications`}
                {tab === "reports" && `${stats.reports} reports to review`}
                {tab === "settings" && "Account and security settings"}
              </p>
            </div>
            <button onClick={() => { setLoading(true); loadAll().then(() => setLoading(false)); }} className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
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
                ].map((s, i) => (
                  <div key={i} className={"bg-gray-900 rounded-2xl p-5 border " + s.border}>
                    <div className={"w-10 h-10 rounded-xl flex items-center justify-center mb-3 " + s.color}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-gray-500 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="font-bold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Review Verifications", action: () => setTab("verifications"), icon: Shield, color: "bg-amber-600", count: stats.pendingVerif },
                    { label: "Manage Users", action: () => setTab("users"), icon: Users, color: "bg-blue-600" },
                    { label: "View Reports", action: () => setTab("reports"), icon: AlertTriangle, color: "bg-red-600", count: stats.reports },
                    { label: "Change Password", action: () => setTab("settings"), icon: Lock, color: "bg-purple-600" },
                  ].map((a, i) => (
                    <button key={i} onClick={a.action} className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition-colors text-left">
                      <div className={"w-10 h-10 rounded-lg flex items-center justify-center " + a.color}>
                        <a.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.label}</p>
                        {a.count !== undefined && <p className="text-xs text-gray-500">{a.count} pending</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent users */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="font-bold mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {realUsers.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                        {u.profilePhoto ? <img src={u.profilePhoto} className="w-full h-full object-cover" alt="" /> : <Users className="w-5 h-5 text-gray-500 m-auto mt-2.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name} {u.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400 inline ml-1" />}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      <span className={"text-xs px-2 py-1 rounded-full " + (u.tier === "gold" ? "bg-yellow-500/10 text-yellow-400" : u.tier === "premium" ? "bg-pink-500/10 text-pink-400" : "bg-gray-700 text-gray-400")}>{u.tier}</span>
                      <span className="text-xs text-gray-500">{ago(u.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========== USERS ========== */}
          {tab === "users" && !selectedUser && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, username..." className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="all">All Tiers</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="gold">Gold</option>
                </select>
              </div>

              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-500 text-xs">
                        <th className="text-left p-4">User</th>
                        <th className="text-left p-4 hidden md:table-cell">Tier</th>
                        <th className="text-left p-4 hidden md:table-cell">Verified</th>
                        <th className="text-left p-4 hidden lg:table-cell">Coins</th>
                        <th className="text-left p-4 hidden lg:table-cell">Joined</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                {u.profilePhoto ? <img src={u.profilePhoto} className="w-full h-full object-cover" alt="" /> : <Users className="w-4 h-4 text-gray-500 m-auto mt-2.5" />}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <span className={"text-xs px-2 py-1 rounded-full " + (u.tier === "gold" ? "bg-yellow-500/10 text-yellow-400" : u.tier === "premium" ? "bg-pink-500/10 text-pink-400" : "bg-gray-700 text-gray-400")}>{u.tier}</span>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            {u.verified ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-gray-600" />}
                          </td>
                          <td className="p-4 hidden lg:table-cell text-gray-400">{u.coins}</td>
                          <td className="p-4 hidden lg:table-cell text-gray-500 text-xs">{ago(u.createdAt)}</td>
                          <td className="p-4">
                            <button onClick={() => setSelectedUser(u)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors">
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No users found</div>
                )}
              </div>
            </div>
          )}

          {/* User Detail */}
          {tab === "users" && selectedUser && (
            <div className="space-y-6">
              <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4">
                <ArrowLeft className="w-4 h-4" /> Back to users
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile card */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden mx-auto mb-4">
                      {selectedUser.profilePhoto ? (
                        <img src={selectedUser.profilePhoto} className="w-full h-full object-cover cursor-pointer" onClick={() => setPhotoViewer(selectedUser.profilePhoto)} alt="" />
                      ) : (
                        <Users className="w-10 h-10 text-gray-500 m-auto mt-7" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold">{selectedUser.name} {selectedUser.verified && <CheckCircle className="w-4 h-4 text-blue-400 inline ml-1" />}</h3>
                    <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                    <span className={"inline-block mt-2 text-xs px-3 py-1 rounded-full " + (selectedUser.tier === "gold" ? "bg-yellow-500/10 text-yellow-400" : selectedUser.tier === "premium" ? "bg-pink-500/10 text-pink-400" : "bg-gray-700 text-gray-400")}>{selectedUser.tier}</span>
                  </div>

                  <div className="mt-6 space-y-3 text-sm">
                    {selectedUser.username && <div className="flex justify-between"><span className="text-gray-500">Username</span><span>@{selectedUser.username}</span></div>}
                    {selectedUser.age && <div className="flex justify-between"><span className="text-gray-500">Age</span><span>{selectedUser.age}</span></div>}
                    {selectedUser.gender && <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className="capitalize">{selectedUser.gender}</span></div>}
                    {selectedUser.country && <div className="flex justify-between"><span className="text-gray-500">Country</span><span>{selectedUser.country}</span></div>}
                    {selectedUser.phone && <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{selectedUser.phone}</span></div>}
                    <div className="flex justify-between"><span className="text-gray-500">Coins</span><span className="text-amber-400">{selectedUser.coins}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Joined</span><span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Verified</span><span>{selectedUser.verified ? "Yes" : "No"}</span></div>
                  </div>

                  {selectedUser.bio && (
                    <div className="mt-4 p-3 bg-gray-800 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Bio</p>
                      <p className="text-sm">{selectedUser.bio}</p>
                    </div>
                  )}
                </div>

                {/* Actions + Documents */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Actions */}
                  <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                    <h4 className="font-bold mb-4">Actions</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      <button onClick={() => handleUserAction(selectedUser.id, "makePremium")} disabled={actionLoading !== ""} className="p-3 bg-pink-600 hover:bg-pink-700 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4" /> Make Premium
                      </button>
                      <button onClick={() => handleUserAction(selectedUser.id, "makeGold")} disabled={actionLoading !== ""} className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        <Gem className="w-4 h-4" /> Make Gold
                      </button>
                      <button onClick={() => handleUserAction(selectedUser.id, selectedUser.banned ? "unban" : "ban")} disabled={actionLoading !== ""} className={"p-3 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 " + (selectedUser.banned ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
                        <Ban className="w-4 h-4" /> {selectedUser.banned ? "Unban" : "Ban"}
                      </button>
                      <button onClick={() => handleUserAction(selectedUser.id, "delete")} disabled={actionLoading !== ""} className="p-3 bg-red-900 hover:bg-red-800 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-red-300">
                        <Trash2 className="w-4 h-4" /> Delete User
                      </button>
                    </div>
                  </div>

                  {/* Verification documents */}
                  {(selectedUser.verificationPhoto || selectedUser.idDocument) && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                      <h4 className="font-bold mb-4">Verification Documents</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {selectedUser.verificationPhoto && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Selfie</p>
                            <img src={selectedUser.verificationPhoto} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPhotoViewer(selectedUser.verificationPhoto)} alt="Selfie" />
                          </div>
                        )}
                        {selectedUser.idDocument && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">ID Front {selectedUser.idType && `(${selectedUser.idType})`}</p>
                            <img src={selectedUser.idDocument} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPhotoViewer(selectedUser.idDocument)} alt="ID" />
                          </div>
                        )}
                        {selectedUser.idDocumentBack && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">ID Back</p>
                            <img src={selectedUser.idDocumentBack} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPhotoViewer(selectedUser.idDocumentBack)} alt="ID Back" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
                      <button onClick={() => setSelectedVerif(v)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium transition-colors">
                        Review Documents
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verification Review */}
          {tab === "verifications" && selectedVerif && (
            <div className="space-y-6">
              <button onClick={() => setSelectedVerif(null)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to list
              </button>

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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {selectedVerif.verificationPhoto && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium">Selfie Photo</p>
                      <img src={selectedVerif.verificationPhoto} className="w-full rounded-xl border border-gray-700 cursor-pointer hover:opacity-80" onClick={() => setPhotoViewer(selectedVerif.verificationPhoto)} alt="Selfie" />
                    </div>
                  )}
                  {selectedVerif.idDocument && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium">ID Front</p>
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

                {!selectedVerif.verificationPhoto && !selectedVerif.idDocument && (
                  <div className="p-6 bg-gray-800 rounded-xl text-center text-gray-500 mb-6">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No documents submitted</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerification(selectedVerif.id, "approve")}
                    disabled={actionLoading !== ""}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Approve
                  </button>
                  <button
                    onClick={() => handleVerification(selectedVerif.id, "reject")}
                    disabled={actionLoading !== ""}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
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
                        <p className="text-xs text-gray-500 mt-1">From: {r.reporterName || r.reporterId} &rarr; {r.reportedName || r.reportedId}</p>
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
          {tab === "settings" && (
            <div className="max-w-lg space-y-6">
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <h3 className="font-bold mb-1">Change Password</h3>
                <p className="text-gray-500 text-sm mb-6">Update your admin password. Only you will know the new password.</p>

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
                  <button onClick={handlePasswordChange} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
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
          <button className="absolute top-6 right-6 text-white p-2" onClick={() => setPhotoViewer(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={photoViewer} className="max-w-full max-h-[85vh] rounded-2xl" alt="Full view" />
        </div>
      )}
    </div>
  );
}
