"use client";
import { useState, useEffect } from "react";
import { useUser, TierBadge } from "../layout";
import { useSearchParams } from "next/navigation";
import { Heart, MessageCircle, UserPlus, UserMinus, Shield, Crown, Gem, Globe, Calendar, Flag, Ban, ArrowLeft, Check, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function UserProfileContent() {
  const { user: me, dark, reload } = useUser();
  const params = useSearchParams();
  const userId = params.get("id");
  const dc = dark;
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [friendStatus, setFriendStatus] = useState<string|null>(null);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/users/profile?id=" + userId).then(r => r.json()).then(d => {
      setProfile(d.user); setPosts(d.posts || []); setFriendStatus(d.friendStatus); setBlocked(d.blocked || false); setLoading(false);
    }).catch(() => setLoading(false));
    // Record profile view
    fetch("/api/profile-views", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ viewedId: userId }) }).catch(() => {});
  }, [userId]);

  const addFriend = async () => { await fetch("/api/friends", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"add", friendId:userId }) }); setFriendStatus("pending"); };
  const removeFriend = async () => { await fetch("/api/friends", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"remove", friendId:userId }) }); setFriendStatus(null); };
  const toggleBlock = async () => { await fetch("/api/block", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ blockedId:userId }) }); setBlocked(!blocked); };

  const submitReport = async () => {
    if (!reportReason) return;
    setReporting(true);
    try {
      const res = await fetch("/api/report", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ reportedId:userId, reason:reportReason, details:reportDetails }) });
      if (res.ok) setReportSent(true);
    } catch {} finally { setReporting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;
  if (!profile) return <div className={"text-center py-20 " + (dc?"text-gray-400":"text-gray-500")}>User not found</div>;

  const interests = profile.interests || [];

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/browse" className={"flex items-center gap-2 mb-4 text-sm font-medium " + (dc?"text-gray-400 hover:text-white":"text-gray-500 hover:text-gray-900")}><ArrowLeft className="w-4 h-4" /> Back</Link>

      {/* Profile hero */}
      <div className={"rounded-2xl overflow-hidden border shadow-sm mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
        <div className={"h-32 bg-gradient-to-br " + (profile.tier==="gold"?"from-amber-400 to-orange-500":profile.tier==="premium"?"from-rose-500 to-pink-500":"from-rose-400 to-pink-400")} />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end gap-4 mb-4">
            {profile.profilePhoto ? <img src={profile.profilePhoto} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-lg" /> : <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-300 to-pink-300 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white dark:ring-gray-800">{profile.name[0]}</div>}
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap"><h1 className={"text-xl font-bold " + (dc?"text-white":"text-gray-900")}>{profile.name}{profile.age ? ", "+profile.age : ""}</h1><TierBadge tier={profile.tier} /></div>
              {profile.bio && <p className={"text-sm mt-1 " + (dc?"text-gray-400":"text-gray-600")}>{profile.bio}</p>}
            </div>
          </div>

          {interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">{interests.map((t:string) => <span key={t} className={"text-xs font-semibold px-2.5 py-1 rounded-full " + (dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-500 border border-rose-100")}>{t}</span>)}</div>
          )}

          <div className={"flex flex-wrap gap-3 text-xs mb-5 " + (dc?"text-gray-500":"text-gray-500")}>
            {profile.country && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {profile.country}</span>}
            {profile.gender && <span>{profile.gender}</span>}
            {profile.lookingFor && <span>Looking for {profile.lookingFor}</span>}
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {new Date(profile.createdAt).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</span>
          </div>

          {/* Action buttons */}
          {me?.id !== userId && (
            <div className="flex flex-wrap gap-2">
              <Link href={"/dashboard/messages?chat=" + userId} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"><MessageCircle className="w-4 h-4" /> Message</Link>
              {friendStatus === "accepted" ? (
                <button onClick={removeFriend} className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border " + (dc?"bg-gray-700 border-gray-600 text-gray-300":"bg-gray-50 border-gray-200 text-gray-600")}><UserMinus className="w-4 h-4" /> Unfriend</button>
              ) : friendStatus === "pending" ? (
                <button disabled className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border " + (dc?"bg-gray-700 border-gray-600 text-gray-400":"bg-gray-50 border-gray-200 text-gray-400")}><Check className="w-4 h-4" /> Pending</button>
              ) : (
                <button onClick={addFriend} className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border " + (dc?"bg-gray-700 border-gray-600 text-white hover:bg-gray-600":"bg-white border-gray-200 text-gray-700 hover:bg-gray-50")}><UserPlus className="w-4 h-4" /> Add Friend</button>
              )}
              <button onClick={toggleBlock} className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border " + (blocked?(dc?"bg-red-500/20 border-red-500/30 text-red-400":"bg-red-50 border-red-200 text-red-600"):(dc?"bg-gray-700 border-gray-600 text-gray-400 hover:text-red-400":"bg-white border-gray-200 text-gray-500 hover:text-red-500"))}><Ban className="w-4 h-4" /> {blocked?"Unblock":"Block"}</button>
              <button onClick={() => setShowReport(true)} className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border " + (dc?"bg-gray-700 border-gray-600 text-amber-400 hover:bg-amber-500/10":"bg-white border-gray-200 text-amber-600 hover:bg-amber-50")}><Flag className="w-4 h-4" /> Report</button>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !reportSent && setShowReport(false)}>
          <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200") + " w-full max-w-md rounded-2xl border shadow-2xl p-6"} onClick={e => e.stopPropagation()}>
            {reportSent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7 text-emerald-500" /></div>
                <h3 className={"text-lg font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Report Submitted</h3>
                <p className={"text-sm mb-4 " + (dc?"text-gray-400":"text-gray-500")}>Our team will review this report within 24 hours. Thank you for keeping ConnectHub safe.</p>
                <button onClick={() => { setShowReport(false); setReportSent(false); setReportReason(""); setReportDetails(""); }} className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={"text-lg font-bold flex items-center gap-2 " + (dc?"text-white":"text-gray-900")}><AlertTriangle className="w-5 h-5 text-amber-500" /> Report {profile.name}</h3>
                  <button onClick={() => setShowReport(false)}><X className={"w-5 h-5 " + (dc?"text-gray-500":"text-gray-400")} /></button>
                </div>
                <p className={"text-sm mb-4 " + (dc?"text-gray-400":"text-gray-500")}>Help us keep ConnectHub safe. Select a reason for your report.</p>
                <div className="space-y-2 mb-4">
                  {["Fake profile","Inappropriate content","Harassment or bullying","Scam or fraud","Underage user","Spam","Other"].map(r => (
                    <button key={r} onClick={() => setReportReason(r)} className={"w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-all " + (reportReason===r?(dc?"bg-rose-500/20 border-rose-500/40 text-rose-400":"bg-rose-50 border-rose-300 text-rose-600"):(dc?"bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500":"bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"))}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="mb-4">
                  <label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Additional details (optional)</label>
                  <textarea className={"w-full px-4 py-3 rounded-xl border text-sm resize-none h-20 outline-none " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200 focus:ring-2 focus:ring-rose-300")} placeholder="Describe what happened..." value={reportDetails} onChange={e => setReportDetails(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowReport(false)} className={"flex-1 py-2.5 rounded-full text-sm font-semibold border " + (dc?"border-gray-600 text-gray-400":"border-gray-200 text-gray-600")}>Cancel</button>
                  <button onClick={submitReport} disabled={!reportReason || reporting} className="flex-[2] py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg disabled:opacity-60">{reporting?"Submitting...":"Submit Report"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length > 0 && (
        <div>
          <h2 className={"font-bold mb-4 " + (dc?"text-white":"text-gray-900")}>Posts ({posts.length})</h2>
          <div className="space-y-4">
            {posts.map((p:any) => (
              <div key={p.id} className={"rounded-xl border p-4 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
                <p className={"text-sm mb-2 " + (dc?"text-gray-300":"text-gray-700")}>{p.content}</p>
                {p.image && (p.image.includes("video") ? <video src={p.image} controls className="w-full rounded-lg max-h-80 object-cover" /> : <img src={p.image} className="w-full rounded-lg max-h-80 object-cover" />)}
                <p className={"text-xs mt-2 " + (dc?"text-gray-500":"text-gray-400")}>{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserProfilePage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>}><UserProfileContent /></Suspense>;
}
