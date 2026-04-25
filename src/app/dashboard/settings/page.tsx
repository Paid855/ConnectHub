"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../layout";
import {
  Lock, Eye, EyeOff, Trash2, AlertTriangle, CheckCircle, Shield, Key, UserX,
  Bell, BellOff, Mail, Phone, Globe, Users, MessageCircle, Heart, Gift,
  Fingerprint, MapPin, Clock, ChevronRight, Sparkles, Crown, Save
} from "lucide-react";

type TabId = "security" | "privacy" | "notifications" | "account";

export default function SettingsPage() {
  const router = useRouter();
  const { user, dark } = useUser();
  const dc = dark;
  const [tab, setTab] = useState<TabId>("security");
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{type:"success"|"error";text:string}|null>(null);

  // Password
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{type:"success"|"error";text:string}|null>(null);

  // Delete
  const [deletePwd, setDeletePwd] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch("/api/account/settings").then(r => r.json()).then(d => setSettings(d.settings)).catch(() => {});
  }, []);

  const updateSetting = async (key: string, value: any) => {
    const prev = settings?.[key];
    setSettings((s: any) => ({ ...s, [key]: value }));
    try {
      const r = await fetch("/api/account/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: value }) });
      if (!r.ok) setSettings((s: any) => ({ ...s, [key]: prev }));
    } catch { setSettings((s: any) => ({ ...s, [key]: prev })); }
  };

  const changePassword = async () => {
    setPwdMsg(null);
    if (!currentPwd) { setPwdMsg({ type: "error", text: "Enter your current password" }); return; }
    if (newPwd.length < 6) { setPwdMsg({ type: "error", text: "New password must be at least 6 characters" }); return; }
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "error", text: "Passwords do not match" }); return; }
    setPwdLoading(true);
    try {
      const r = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "change_password", currentPassword: currentPwd, newPassword: newPwd }) });
      const d = await r.json();
      if (d.success) { setPwdMsg({ type: "success", text: "Password updated!" }); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }
      else setPwdMsg({ type: "error", text: d.error });
    } catch { setPwdMsg({ type: "error", text: "Network error" }); }
    setPwdLoading(false);
  };

  const deleteAccount = async () => {
    if (!deletePwd || deleteConfirm !== "DELETE MY ACCOUNT") return;
    setDeleteLoading(true);
    try {
      const r = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_account", password: deletePwd, confirmation: deleteConfirm }) });
      const d = await r.json();
      if (d.success) router.push("/login?deleted=true");
    } catch {}
    setDeleteLoading(false);
  };

  const pwdStrength = newPwd.length === 0 ? 0 : newPwd.length < 6 ? 1 : newPwd.length < 10 ? 2 : /[A-Z]/.test(newPwd) && /[0-9]/.test(newPwd) && /[^a-zA-Z0-9]/.test(newPwd) ? 4 : 3;
  const strengthColors = ["", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-green-500"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const tabs: { id: TabId; label: string; icon: any; desc: string }[] = [
    { id: "security", label: "Security", icon: Shield, desc: "Password & login" },
    { id: "privacy", label: "Privacy", icon: Eye, desc: "Control your visibility" },
    { id: "notifications", label: "Notifications", icon: Bell, desc: "What alerts you get" },
    { id: "account", label: "Account", icon: Fingerprint, desc: "Data & deletion" },
  ];

  const isPremium = settings?.tier === "premium" || settings?.tier === "plus" || settings?.tier === "gold";

  const Toggle = ({ value, onChange, locked }: { value: boolean; onChange: (v: boolean) => void; locked?: boolean }) => {
    const isLocked = locked && !isPremium;
    return (
      <button onClick={() => isLocked ? router.push("/dashboard/upgrade") : onChange(!value)} className={"relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 " + (isLocked ? "opacity-50 cursor-pointer " : "cursor-pointer ") + (value && !isLocked ? "bg-gradient-to-r from-rose-500 to-pink-500" : (dc ? "bg-gray-600" : "bg-gray-300"))}>
        <div className={"absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 " + (value && !isLocked ? "translate-x-[22px]" : "translate-x-0.5")} />
        {isLocked && <Crown className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />}
      </button>
    );
  };

  const SettingRow = ({ icon: Icon, label, desc, children, border = true }: { icon: any; label: string; desc?: string; children: React.ReactNode; border?: boolean }) => (
    <div className={"flex items-center justify-between py-4 " + (border ? (dc ? "border-b border-gray-700/50" : "border-b border-gray-100") : "")}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={"w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 " + (dc ? "bg-gray-700" : "bg-gray-100")}>
          <Icon className={"w-4 h-4 " + (dc ? "text-gray-400" : "text-gray-500")} />
        </div>
        <div className="min-w-0">
          <p className={"text-sm font-semibold " + (dc ? "text-white" : "text-gray-900")}>{label}</p>
          {desc && <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>{desc}</p>}
        </div>
      </div>
      <div className="flex-shrink-0 ml-3">{children}</div>
    </div>
  );


  if (!settings) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className={"text-2xl sm:text-3xl font-extrabold " + (dc ? "text-white" : "text-gray-900")}>Settings</h1>
          <p className={"text-sm mt-1 " + (dc ? "text-gray-400" : "text-gray-500")}>Manage your account, privacy, and preferences</p>
        </div>

        {/* Tab Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={"p-3 rounded-2xl text-left transition-all border " + (tab === t.id ? (dc ? "bg-rose-500/20 border-rose-500/30 ring-1 ring-rose-500/20" : "bg-rose-50 border-rose-200 ring-1 ring-rose-100") : (dc ? "bg-gray-800 border-gray-700 hover:bg-gray-750" : "bg-white border-gray-200 hover:bg-gray-50 shadow-sm"))}>
              <t.icon className={"w-5 h-5 mb-2 " + (tab === t.id ? "text-rose-500" : (dc ? "text-gray-500" : "text-gray-400"))} />
              <p className={"text-xs font-bold " + (tab === t.id ? "text-rose-500" : (dc ? "text-white" : "text-gray-900"))}>{t.label}</p>
              <p className={"text-[10px] " + (dc ? "text-gray-500" : "text-gray-400")}>{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Security Tab */}
        {tab === "security" && (
          <div className={(dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100") + " rounded-2xl border shadow-sm overflow-hidden"}>
            <div className={"px-6 py-4 border-b " + (dc ? "border-gray-700" : "border-gray-100")}>
              <h2 className={"text-lg font-bold flex items-center gap-2 " + (dc ? "text-white" : "text-gray-900")}><Key className="w-5 h-5 text-rose-500" /> Change Password</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={"block text-xs font-bold mb-1.5 uppercase tracking-wider " + (dc ? "text-gray-400" : "text-gray-500")}>Current Password</label>
                <div className="relative">
                  <input type={showCurrent?"text":"password"} value={currentPwd} onChange={e=>setCurrentPwd(e.target.value)} placeholder="Enter current password" className={"w-full px-4 py-3 rounded-xl border text-sm outline-none " + (dc ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-600 focus:border-rose-500" : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-300")} />
                  <button type="button" onClick={()=>setShowCurrent(!showCurrent)} className={"absolute right-3 top-1/2 -translate-y-1/2 " + (dc?"text-gray-500":"text-gray-400")}>{showCurrent?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
                </div>
              </div>
              <div>
                <label className={"block text-xs font-bold mb-1.5 uppercase tracking-wider " + (dc ? "text-gray-400" : "text-gray-500")}>New Password</label>
                <div className="relative">
                  <input type={showNew?"text":"password"} value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Min 6 characters" className={"w-full px-4 py-3 rounded-xl border text-sm outline-none " + (dc ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-600 focus:border-rose-500" : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-300")} />
                  <button type="button" onClick={()=>setShowNew(!showNew)} className={"absolute right-3 top-1/2 -translate-y-1/2 " + (dc?"text-gray-500":"text-gray-400")}>{showNew?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
                </div>
                {newPwd && <div className="mt-2"><div className="flex gap-1 mb-1">{[1,2,3,4].map(i=><div key={i} className={"h-1 flex-1 rounded-full "+(i<=pwdStrength?strengthColors[pwdStrength]:(dc?"bg-gray-700":"bg-gray-200"))}/>)}</div><p className={"text-[10px] font-bold "+(pwdStrength<=1?"text-red-500":pwdStrength===2?"text-amber-500":pwdStrength===3?"text-blue-500":"text-green-500")}>{strengthLabels[pwdStrength]}</p></div>}
              </div>
              <div>
                <label className={"block text-xs font-bold mb-1.5 uppercase tracking-wider " + (dc ? "text-gray-400" : "text-gray-500")}>Confirm New Password</label>
                <div className="relative">
                  <input type="password" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} placeholder="Confirm password" className={"w-full px-4 py-3 rounded-xl border text-sm outline-none " + (dc ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-600 focus:border-rose-500" : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-300")} />
                  {confirmPwd && newPwd === confirmPwd && <CheckCircle className="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                </div>
              </div>
              {pwdMsg && <div className={"p-3 rounded-xl text-sm flex items-center gap-2 " + (pwdMsg.type==="success"?(dc?"bg-green-900/30 text-green-400":"bg-green-50 text-green-700 border border-green-200"):(dc?"bg-red-900/30 text-red-400":"bg-red-50 text-red-700 border border-red-200"))}>{pwdMsg.type==="success"?<CheckCircle className="w-4 h-4"/>:<AlertTriangle className="w-4 h-4"/>} {pwdMsg.text}</div>}
              <button onClick={changePassword} disabled={pwdLoading} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                {pwdLoading?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<><Key className="w-4 h-4"/> Update Password</>}
              </button>
            </div>

            {/* Account info */}
            <div className={"px-6 py-4 border-t " + (dc ? "border-gray-700 bg-gray-800/50" : "border-gray-100 bg-gray-50/50")}>
              <p className={"text-xs font-bold uppercase tracking-wider mb-3 " + (dc ? "text-gray-500" : "text-gray-400")}>Account Info</p>
              <div className="space-y-2">
                <div className="flex justify-between"><span className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Email</span><span className={"text-xs font-semibold " + (dc?"text-gray-300":"text-gray-700")}>{settings.email}</span></div>
                <div className="flex justify-between"><span className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Phone</span><span className={"text-xs font-semibold " + (dc?"text-gray-300":"text-gray-700")}>{settings.phone || "Not set"}</span></div>
                <div className="flex justify-between"><span className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Member since</span><span className={"text-xs font-semibold " + (dc?"text-gray-300":"text-gray-700")}>{settings.createdAt ? new Date(settings.createdAt).toLocaleDateString("en-US",{month:"long",year:"numeric"}) : "—"}</span></div>
                <div className="flex justify-between"><span className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Verified</span><span className={"text-xs font-semibold " + (settings.verified?"text-green-500":"text-amber-500")}>{settings.verified?"Yes ✓":"Not yet"}</span></div>
                <div className="flex justify-between"><span className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Plan</span><span className={"text-xs font-bold " + (settings.tier==="premium"?"text-purple-500":settings.tier==="plus"?"text-blue-500":"text-gray-500")}>{(settings.tier||"basic").charAt(0).toUpperCase()+(settings.tier||"basic").slice(1)}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {tab === "privacy" && (
          <div className={(dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100") + " rounded-2xl border shadow-sm"}>
            <div className={"px-6 py-4 border-b " + (dc ? "border-gray-700" : "border-gray-100")}>
              <h2 className={"text-lg font-bold flex items-center gap-2 " + (dc ? "text-white" : "text-gray-900")}><Eye className="w-5 h-5 text-rose-500" /> Privacy Controls</h2>
              <p className={"text-xs mt-0.5 " + (dc ? "text-gray-500" : "text-gray-400")}>Control what others can see about you</p>
            </div>
            {!isPremium && (
              <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 rounded-xl flex items-center gap-3">
                <Crown className="w-8 h-8 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className={"text-xs font-bold " + (dc?"text-white":"text-gray-900")}>Upgrade to unlock Privacy Controls</p>
                  <p className={"text-[10px] " + (dc?"text-gray-400":"text-gray-500")}>Plus and Premium members can hide their online status, age, and more</p>
                </div>
                <a href="/dashboard/upgrade" className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-[10px] font-bold flex-shrink-0">Upgrade</a>
              </div>
            )}
            <div className="px-6">
              <SettingRow icon={Globe} label="Private Profile" desc="Only matched users can see your full profile">
                <Toggle value={settings.isPrivate} onChange={v => updateSetting("isPrivate", v)} locked />
              </SettingRow>
              <SettingRow icon={Clock} label="Hide Online Status" desc="Others won't see when you're online">
                <Toggle value={settings.hideOnline} onChange={v => updateSetting("hideOnline", v)} locked />
              </SettingRow>
              <SettingRow icon={Eye} label="Hide Last Seen" desc="Others won't see when you were last active">
                <Toggle value={settings.hideLastSeen} onChange={v => updateSetting("hideLastSeen", v)} locked />
              </SettingRow>
              <SettingRow icon={MapPin} label="Show Distance" desc="Display how far you are from others">
                <Toggle value={settings.showDistance} onChange={v => updateSetting("showDistance", v)} locked />
              </SettingRow>

              <div className={"py-3 text-xs font-bold uppercase tracking-wider " + (dc ? "text-gray-500" : "text-gray-400")}>Profile Details</div>

              <SettingRow icon={Clock} label="Hide Age" desc="Your age won't be visible on your profile">
                <Toggle value={settings.hideDob} onChange={v => updateSetting("hideDob", v)} locked />
              </SettingRow>
              <SettingRow icon={Mail} label="Hide Email" desc="Your email won't be visible to other users">
                <Toggle value={settings.hideEmail} onChange={v => updateSetting("hideEmail", v)} locked />
              </SettingRow>
              <SettingRow icon={Phone} label="Hide Phone" desc="Your phone number stays private">
                <Toggle value={settings.hidePhone} onChange={v => updateSetting("hidePhone", v)} locked />
              </SettingRow>

              <div className={"py-3 text-xs font-bold uppercase tracking-wider " + (dc ? "text-gray-500" : "text-gray-400")}>Messaging</div>

              <SettingRow icon={MessageCircle} label="Who Can Message Me" desc="Control who starts conversations" border={false}>
                <select value={settings.allowMessages} onChange={e => updateSetting("allowMessages", e.target.value)} className={"px-3 py-2 rounded-lg border text-xs font-semibold outline-none " + (dc ? "bg-gray-900 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-700")}>
                  <option value="everyone">Everyone</option>
                  <option value="matches">Matches Only</option>
                  <option value="verified">Verified Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </SettingRow>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === "notifications" && (
          <div className={(dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100") + " rounded-2xl border shadow-sm"}>
            <div className={"px-6 py-4 border-b " + (dc ? "border-gray-700" : "border-gray-100")}>
              <h2 className={"text-lg font-bold flex items-center gap-2 " + (dc ? "text-white" : "text-gray-900")}><Bell className="w-5 h-5 text-rose-500" /> Notification Preferences</h2>
              <p className={"text-xs mt-0.5 " + (dc ? "text-gray-500" : "text-gray-400")}>Choose how you want to be notified</p>
            </div>
            {!isPremium && (
              <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 rounded-xl flex items-center gap-3">
                <Crown className="w-8 h-8 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className={"text-xs font-bold " + (dc?"text-white":"text-gray-900")}>Upgrade to customize Notifications</p>
                  <p className={"text-[10px] " + (dc?"text-gray-400":"text-gray-500")}>Free users receive all notifications. Upgrade to control what alerts you get.</p>
                </div>
                <a href="/dashboard/upgrade" className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-[10px] font-bold flex-shrink-0">Upgrade</a>
              </div>
            )}
            <div className="px-6">
              <div className={"py-3 text-xs font-bold uppercase tracking-wider " + (dc ? "text-gray-500" : "text-gray-400")}>Channels</div>

              <SettingRow icon={Bell} label="Push Notifications" desc="Receive notifications on your device">
                <Toggle value={settings.pushNotifs} onChange={v => updateSetting("pushNotifs", v)} locked />
              </SettingRow>
              <SettingRow icon={Mail} label="Email Notifications" desc="Receive updates via email">
                <Toggle value={settings.emailNotifs} onChange={v => updateSetting("emailNotifs", v)} locked />
              </SettingRow>

              <div className={"py-3 text-xs font-bold uppercase tracking-wider " + (dc ? "text-gray-500" : "text-gray-400")}>Notification Types</div>

              <SettingRow icon={Heart} label="New Matches" desc="When you match with someone">
                <Toggle value={settings.notifMatches} onChange={v => updateSetting("notifMatches", v)} locked />
              </SettingRow>
              <SettingRow icon={MessageCircle} label="Messages" desc="When you receive a new message">
                <Toggle value={settings.notifMessages} onChange={v => updateSetting("notifMessages", v)} locked />
              </SettingRow>
              <SettingRow icon={Heart} label="Likes & Super Likes" desc="When someone likes your profile">
                <Toggle value={settings.notifLikes} onChange={v => updateSetting("notifLikes", v)} locked />
              </SettingRow>
              <SettingRow icon={Gift} label="Gifts & Coins" desc="When you receive gifts or earn coins" border={false}>
                <Toggle value={settings.notifGifts} onChange={v => updateSetting("notifGifts", v)} />
              </SettingRow>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {tab === "account" && (
          <div className="space-y-4">
            {/* Verification status */}
            <div className={(dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100") + " rounded-2xl border shadow-sm p-6"}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center " + (settings.verified ? "bg-green-100" : "bg-amber-100")}>
                    <Shield className={"w-5 h-5 " + (settings.verified ? "text-green-500" : "text-amber-500")} />
                  </div>
                  <div>
                    <p className={"text-sm font-bold " + (dc ? "text-white" : "text-gray-900")}>{settings.verified ? "Verified Account" : "Unverified Account"}</p>
                    <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>{settings.verified ? "Your identity has been confirmed" : "Verify to get a trusted badge"}</p>
                  </div>
                </div>
                {!settings.verified && <a href="/dashboard/verify" className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-xs font-bold hover:shadow-lg transition-all">Verify Now</a>}
              </div>
            </div>

            {/* Subscription */}
            <div className={(dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100") + " rounded-2xl border shadow-sm p-6"}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center " + (settings.tier === "premium" ? "bg-purple-100" : settings.tier === "plus" ? "bg-blue-100" : "bg-gray-100")}>
                    <Crown className={"w-5 h-5 " + (settings.tier === "premium" ? "text-purple-500" : settings.tier === "plus" ? "text-blue-500" : "text-gray-400")} />
                  </div>
                  <div>
                    <p className={"text-sm font-bold " + (dc ? "text-white" : "text-gray-900")}>{(settings.tier || "basic").charAt(0).toUpperCase() + (settings.tier || "basic").slice(1)} Plan</p>
                    <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>{settings.tier === "premium" ? "You have all features unlocked" : settings.tier === "plus" ? "Upgrade for more features" : "Upgrade for premium features"}</p>
                  </div>
                </div>
                {settings.tier !== "premium" && <a href="/dashboard/upgrade" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold hover:shadow-lg transition-all">Upgrade</a>}
              </div>
            </div>

            {/* Delete Account */}
            <div className={(dc ? "bg-gray-800 border-red-900/30" : "bg-white border-red-100") + " rounded-2xl border shadow-sm overflow-hidden"}>
              <button onClick={() => setShowDelete(!showDelete)} className={"w-full p-6 flex items-center justify-between text-left " + (dc ? "hover:bg-gray-750" : "hover:bg-red-50/30")}>
                <div className="flex items-center gap-3">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center " + (dc ? "bg-red-900/30" : "bg-red-50")}>
                    <UserX className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className={"font-bold text-sm " + (dc ? "text-red-400" : "text-red-600")}>Delete Account</p>
                    <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>Permanently remove your account and data</p>
                  </div>
                </div>
                <ChevronRight className={"w-5 h-5 transition-transform " + (showDelete ? "rotate-90 " : "") + (dc ? "text-gray-600" : "text-gray-400")} />
              </button>

              {showDelete && (
                <div className={"px-6 pb-6 border-t " + (dc ? "border-gray-700" : "border-red-100")}>
                  <div className={"p-4 rounded-xl my-4 " + (dc ? "bg-red-900/20 border border-red-800/30" : "bg-red-50 border border-red-200")}>
                    <p className="text-xs text-red-500 font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> This action is permanent and cannot be undone</p>
                    <ul className={"text-[11px] space-y-1 " + (dc ? "text-red-300/70" : "text-red-600/80")}>
                      <li>• All messages, matches, and connections deleted</li>
                      <li>• Photos, verification, and profile removed</li>
                      <li>• Remaining coins will be lost forever</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <input type="password" value={deletePwd} onChange={e=>setDeletePwd(e.target.value)} placeholder="Enter your password" className={"w-full px-4 py-3 rounded-xl border text-sm outline-none " + (dc ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-600" : "bg-gray-50 border-gray-200")} />
                    <input type="text" value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder='Type "DELETE MY ACCOUNT"' className={"w-full px-4 py-3 rounded-xl border text-sm outline-none font-mono " + (dc ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-600" : "bg-gray-50 border-gray-200")} />
                    <button onClick={deleteAccount} disabled={deleteLoading || deleteConfirm !== "DELETE MY ACCOUNT"} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                      {deleteLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Trash2 className="w-4 h-4" /> Permanently Delete</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
