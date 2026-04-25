"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../layout";
import { Lock, Eye, EyeOff, Trash2, AlertTriangle, CheckCircle, Shield, Key, UserX } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, dark } = useUser();
  const dc = dark;

  // Password change
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{type:"success"|"error";text:string}|null>(null);

  // Delete account
  const [deletePwd, setDeletePwd] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{type:"success"|"error";text:string}|null>(null);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  const changePassword = async () => {
    setPwdMsg(null);
    if (!currentPwd) { setPwdMsg({ type: "error", text: "Enter your current password" }); return; }
    if (newPwd.length < 6) { setPwdMsg({ type: "error", text: "New password must be at least 6 characters" }); return; }
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "error", text: "Passwords do not match" }); return; }
    if (currentPwd === newPwd) { setPwdMsg({ type: "error", text: "New password must be different" }); return; }

    setPwdLoading(true);
    try {
      const r = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "change_password", currentPassword: currentPwd, newPassword: newPwd }) });
      const d = await r.json();
      if (d.success) {
        setPwdMsg({ type: "success", text: "Password changed successfully!" });
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      } else { setPwdMsg({ type: "error", text: d.error || "Failed" }); }
    } catch { setPwdMsg({ type: "error", text: "Network error" }); }
    setPwdLoading(false);
  };

  const deleteAccount = async () => {
    setDeleteMsg(null);
    if (!deletePwd) { setDeleteMsg({ type: "error", text: "Enter your password" }); return; }
    if (deleteConfirm !== "DELETE MY ACCOUNT") { setDeleteMsg({ type: "error", text: 'Type "DELETE MY ACCOUNT" exactly to confirm' }); return; }

    setDeleteLoading(true);
    try {
      const r = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_account", password: deletePwd, confirmation: deleteConfirm }) });
      const d = await r.json();
      if (d.success) {
        router.push("/login?deleted=true");
      } else { setDeleteMsg({ type: "error", text: d.error || "Failed" }); }
    } catch { setDeleteMsg({ type: "error", text: "Network error" }); }
    setDeleteLoading(false);
  };

  const pwdStrength = newPwd.length === 0 ? 0 : newPwd.length < 6 ? 1 : newPwd.length < 10 ? 2 : /[A-Z]/.test(newPwd) && /[0-9]/.test(newPwd) && /[^a-zA-Z0-9]/.test(newPwd) ? 4 : 3;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-green-500"];

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className={"text-2xl sm:text-3xl font-extrabold flex items-center gap-2 " + (dc ? "text-white" : "text-gray-900")}>
            <Shield className="text-rose-500" /> Settings
          </h1>
          <p className={"text-sm mt-1 " + (dc ? "text-gray-400" : "text-gray-500")}>Manage your account security and privacy</p>
        </div>

        {/* Change Password */}
        <div className={(dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100") + " rounded-2xl p-6 border shadow-sm mb-6"}>
          <h2 className={"text-lg font-bold mb-1 flex items-center gap-2 " + (dc ? "text-white" : "text-gray-900")}>
            <Key className="w-5 h-5 text-rose-500" /> Change Password
          </h2>
          <p className={"text-xs mb-5 " + (dc ? "text-gray-400" : "text-gray-500")}>Update your password to keep your account secure</p>

          <div className="space-y-4">
            <div>
              <label className={"block text-sm font-semibold mb-1.5 " + (dc ? "text-gray-300" : "text-gray-700")}>Current Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><Lock className={"w-4 h-4 " + (dc ? "text-gray-500" : "text-gray-400")} /></div>
                <input type={showCurrent ? "text" : "password"} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="Enter current password" className={"w-full pl-11 pr-12 py-3 rounded-xl border text-sm outline-none transition-all " + (dc ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus:border-rose-500" : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-300")} />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className={"absolute right-4 top-1/2 -translate-y-1/2 " + (dc ? "text-gray-500" : "text-gray-400")}>{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>

            <div>
              <label className={"block text-sm font-semibold mb-1.5 " + (dc ? "text-gray-300" : "text-gray-700")}>New Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><Lock className={"w-4 h-4 " + (dc ? "text-gray-500" : "text-gray-400")} /></div>
                <input type={showNew ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min 6 characters" className={"w-full pl-11 pr-12 py-3 rounded-xl border text-sm outline-none transition-all " + (dc ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus:border-rose-500" : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-300")} />
                <button type="button" onClick={() => setShowNew(!showNew)} className={"absolute right-4 top-1/2 -translate-y-1/2 " + (dc ? "text-gray-500" : "text-gray-400")}>{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              {newPwd && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">{[1,2,3,4].map(i => <div key={i} className={"h-1 flex-1 rounded-full " + (i <= pwdStrength ? strengthColor[pwdStrength] : (dc ? "bg-gray-700" : "bg-gray-200"))} />)}</div>
                  <p className={"text-xs " + (pwdStrength <= 1 ? "text-red-500" : pwdStrength === 2 ? "text-amber-500" : pwdStrength === 3 ? "text-blue-500" : "text-green-500")}>{strengthLabel[pwdStrength]}</p>
                </div>
              )}
            </div>

            <div>
              <label className={"block text-sm font-semibold mb-1.5 " + (dc ? "text-gray-300" : "text-gray-700")}>Confirm New Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><Lock className={"w-4 h-4 " + (dc ? "text-gray-500" : "text-gray-400")} /></div>
                <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Confirm new password" className={"w-full pl-11 pr-12 py-3 rounded-xl border text-sm outline-none transition-all " + (dc ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus:border-rose-500" : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-300")} />
                {confirmPwd && newPwd === confirmPwd && <div className="absolute right-4 top-1/2 -translate-y-1/2"><CheckCircle className="w-4 h-4 text-green-500" /></div>}
              </div>
            </div>
          </div>

          {pwdMsg && (
            <div className={"mt-4 p-3 rounded-xl text-sm flex items-center gap-2 " + (pwdMsg.type === "success" ? (dc ? "bg-green-900/30 text-green-400 border border-green-800" : "bg-green-50 text-green-700 border border-green-200") : (dc ? "bg-red-900/30 text-red-400 border border-red-800" : "bg-red-50 text-red-700 border border-red-200"))}>
              {pwdMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {pwdMsg.text}
            </div>
          )}

          <button onClick={changePassword} disabled={pwdLoading} className="w-full mt-5 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:shadow-lg transition-all flex items-center justify-center gap-2">
            {pwdLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Key className="w-4 h-4" /> Update Password</>}
          </button>
        </div>

        {/* Delete Account */}
        <div className={(dc ? "bg-gray-800 border-red-900/30" : "bg-white border-red-100") + " rounded-2xl border shadow-sm overflow-hidden"}>
          <button onClick={() => setShowDeleteSection(!showDeleteSection)} className={"w-full p-6 flex items-center justify-between text-left " + (dc ? "hover:bg-gray-750" : "hover:bg-red-50/50")}>
            <div className="flex items-center gap-3">
              <div className={"w-10 h-10 rounded-full flex items-center justify-center " + (dc ? "bg-red-900/30" : "bg-red-50")}>
                <UserX className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className={"text-lg font-bold " + (dc ? "text-red-400" : "text-red-600")}>Delete Account</h2>
                <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>Permanently delete your account and all data</p>
              </div>
            </div>
            <Trash2 className={"w-5 h-5 transition-transform " + (showDeleteSection ? "rotate-90 " : "") + (dc ? "text-gray-600" : "text-gray-400")} />
          </button>

          {showDeleteSection && (
            <div className={"p-6 border-t " + (dc ? "border-gray-700" : "border-red-100")}>
              <div className={"p-4 rounded-xl mb-5 " + (dc ? "bg-red-900/20 border border-red-800/30" : "bg-red-50 border border-red-200")}>
                <p className="text-sm text-red-500 font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Warning: This action is permanent</p>
                <ul className={"text-xs space-y-1 " + (dc ? "text-red-300/70" : "text-red-600/80")}>
                  <li>• All your messages, matches, and connections will be deleted</li>
                  <li>• Your profile, photos, and verification will be removed</li>
                  <li>• Any remaining coins will be lost</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={"block text-sm font-semibold mb-1.5 " + (dc ? "text-gray-300" : "text-gray-700")}>Enter your password</label>
                  <input type="password" value={deletePwd} onChange={e => setDeletePwd(e.target.value)} placeholder="Your current password" className={"w-full px-4 py-3 rounded-xl border text-sm outline-none " + (dc ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-500" : "bg-gray-50 border-gray-200")} />
                </div>
                <div>
                  <label className={"block text-sm font-semibold mb-1.5 " + (dc ? "text-gray-300" : "text-gray-700")}>Type <span className="text-red-500 font-mono">DELETE MY ACCOUNT</span> to confirm</label>
                  <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE MY ACCOUNT" className={"w-full px-4 py-3 rounded-xl border text-sm outline-none font-mono " + (dc ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-500" : "bg-gray-50 border-gray-200")} />
                </div>
              </div>

              {deleteMsg && (
                <div className={"mt-4 p-3 rounded-xl text-sm flex items-center gap-2 " + (deleteMsg.type === "error" ? (dc ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700 border border-red-200") : "bg-green-50 text-green-700")}>
                  <AlertTriangle className="w-4 h-4" /> {deleteMsg.text}
                </div>
              )}

              <button onClick={deleteAccount} disabled={deleteLoading || deleteConfirm !== "DELETE MY ACCOUNT"} className="w-full mt-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {deleteLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Trash2 className="w-4 h-4" /> Permanently Delete Account</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
