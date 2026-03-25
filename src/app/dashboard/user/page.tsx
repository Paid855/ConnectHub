"use client";
import { useState, useEffect } from "react";
import { useUser, TierBadge } from "../layout";
import { useSearchParams } from "next/navigation";
import { Heart, Shield, Crown, Gem, MapPin, Calendar, User, MessageCircle, UserPlus, Ban, Flag, ArrowLeft, Globe, Check, X, Send, Camera, Eye } from "lucide-react";
import Link from "next/link";
import PhotoGallery from "@/components/PhotoGallery";

export default function UserProfilePage() {
  const { user, dark } = useUser();
  const dc = dark;
  const params = useSearchParams();
  const userId = params.get("id");
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [friendStatus, setFriendStatus] = useState<string|null>(null);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const res = await fetch("/api/users/profile?id=" + userId);
      if (res.ok) {
        const d = await res.json();
        setProfile(d.user); setPosts(d.posts || []); setFriendStatus(d.friendStatus); setBlocked(d.blocked);
      }
      setLoading(false);
    };
    load();
    // Record profile view
    fetch("/api/profile-views", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ viewedId:userId }) }).catch(()=>{});
  }, [userId]);

  const sendFriendRequest = async () => {
    setActing("friend");
    await fetch("/api/friends", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ friendId:userId }) });
    setFriendStatus("pending");
    setActing("");
  };

  const toggleBlock = async () => {
    setActing("block");
    await fetch("/api/block", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ blockedId:userId }) });
    setBlocked(!blocked);
    setActing("");
  };

  const submitReport = async () => {
    if (!reportReason) return;
    await fetch("/api/report", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ reportedId:userId, reason:reportReason, details:reportDetails }) });
    setReportSent(true);
    setTimeout(() => { setShowReport(false); setReportSent(false); setReportReason(""); setReportDetails(""); }, 2000);
  };

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;
  if (!profile) return <div className="text-center py-20"><p className={dc?"text-gray-400":"text-gray-500"}>User not found</p><Link href="/dashboard" className="text-rose-500 text-sm font-semibold mt-2 inline-block">← Go back</Link></div>;
  if (!user) return null;

  const tierColor = profile.tier==="gold"?"from-amber-400 via-yellow-500 to-orange-500":profile.tier==="premium"?"from-rose-500 via-pink-500 to-purple-500":"from-rose-400 via-pink-400 to-purple-400";

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard/browse" className={"flex items-center gap-1 text-sm mb-4 " + (dc?"text-gray-500 hover:text-white":"text-gray-400 hover:text-gray-900")}><ArrowLeft className="w-4 h-4" /> Back</Link>

      {/* Hero */}
      <div className={"rounded-3xl overflow-hidden mb-6 shadow-lg border " + (dc?"border-gray-700":"border-gray-100")}>
        <div className={"h-36 sm:h-44 bg-gradient-to-br " + tierColor + " relative"}>
          <div className="absolute inset-0 bg-black/10" />
          {isOnline(profile.lastSeen) && <div className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold"><div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Online now</div>}
        </div>
        <div className={(dc?"bg-gray-800":"bg-white") + " px-5 sm:px-6 pb-6 pt-16 sm:pt-20 relative"}>
          <div className="absolute -top-14 sm:-top-16 left-5 sm:left-6">
            <div className={"ring-4 rounded-2xl shadow-xl " + (dc?"ring-gray-800":"ring-white")}>
              {profile.profilePhoto ? <img src={profile.profilePhoto} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover" /> : <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-rose-300 to-pink-300 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">{profile.name[0]}</div>}
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className={"text-xl sm:text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>{profile.name}{profile.age ? ", "+profile.age : ""}</h1>
                {profile.verified && <Shield className="w-5 h-5 text-blue-500 fill-blue-100" />}
                {profile.tier==="gold" && <Crown className="w-5 h-5 text-amber-500" />}
                {profile.tier==="premium" && <Gem className="w-5 h-5 text-rose-500" />}
              </div>
              {profile.username && <p className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>@{profile.username}</p>}
            </div>
            <TierBadge tier={profile.tier} />
          </div>

          {profile.bio && <p className={"text-sm mt-3 leading-relaxed " + (dc?"text-gray-300":"text-gray-600")}>{profile.bio}</p>}

          {profile.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.interests.map((t:string) => <span key={t} className={"text-xs font-semibold px-2.5 py-1 rounded-full " + (dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-500 border border-rose-100")}>{t}</span>)}
            </div>
          )}

          <div className={"flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-3 " + (dc?"text-gray-500":"text-gray-500")}>
            {profile.country && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.country}</span>}
            {profile.gender && <span>{profile.gender}</span>}
            {profile.lookingFor && <span>Looking for {profile.lookingFor}</span>}
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {new Date(profile.createdAt).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-5">
            <Link href={"/dashboard/messages"} className="flex-1 min-w-[120px] py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold text-sm text-center hover:shadow-lg flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> Message</Link>

            {friendStatus === "accepted" ? (
              <div className={"flex-1 min-w-[120px] py-2.5 rounded-xl font-semibold text-sm text-center flex items-center justify-center gap-2 " + (dc?"bg-emerald-500/10 text-emerald-400 border border-emerald-500/30":"bg-emerald-50 text-emerald-600 border border-emerald-200")}><Check className="w-4 h-4" /> Friends</div>
            ) : friendStatus === "pending" ? (
              <div className={"flex-1 min-w-[120px] py-2.5 rounded-xl font-semibold text-sm text-center flex items-center justify-center gap-2 " + (dc?"bg-amber-500/10 text-amber-400 border border-amber-500/30":"bg-amber-50 text-amber-600 border border-amber-200")}>Pending...</div>
            ) : (
              <button onClick={sendFriendRequest} disabled={acting==="friend"} className={"flex-1 min-w-[120px] py-2.5 rounded-xl font-semibold text-sm text-center flex items-center justify-center gap-2 border " + (dc?"bg-gray-700 border-gray-600 text-white hover:bg-gray-600":"bg-white border-gray-200 text-gray-700 hover:bg-gray-50")}><UserPlus className="w-4 h-4" /> Add Friend</button>
            )}

            <button onClick={toggleBlock} className={"py-2.5 px-4 rounded-xl text-sm font-semibold border flex items-center gap-2 " + (blocked?(dc?"bg-red-500/10 border-red-500/30 text-red-400":"bg-red-50 border-red-200 text-red-500"):(dc?"bg-gray-700 border-gray-600 text-gray-400":"bg-white border-gray-200 text-gray-500"))}><Ban className="w-4 h-4" /> {blocked?"Unblock":"Block"}</button>

            <button onClick={() => setShowReport(true)} className={"py-2.5 px-4 rounded-xl text-sm font-semibold border flex items-center gap-2 " + (dc?"bg-gray-700 border-gray-600 text-gray-400":"bg-white border-gray-200 text-gray-500")}><Flag className="w-4 h-4" /> Report</button>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="mb-5"><PhotoGallery userId={profile.id} dark={dc} /></div>

      {/* Posts */}
      {posts.length > 0 && (
        <div className={"rounded-2xl border p-5 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
          <h3 className={"font-bold mb-3 " + (dc?"text-white":"text-gray-900")}>Recent Posts ({posts.length})</h3>
          <div className="space-y-3">
            {posts.slice(0, 5).map((p:any) => (
              <div key={p.id} className={"rounded-xl p-3 " + (dc?"bg-gray-700/50":"bg-gray-50")}>
                <p className={"text-sm " + (dc?"text-gray-300":"text-gray-700")}>{p.content}</p>
                {p.image && !p.image.startsWith("[VID]") && !p.image.startsWith("[VOICE]") && <img src={p.image.replace("[IMG]","")} className="mt-2 rounded-lg max-h-48 object-cover" />}
                <p className={"text-xs mt-1 " + (dc?"text-gray-500":"text-gray-400")}>{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowReport(false)}>
          <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200") + " w-full max-w-md rounded-2xl border shadow-2xl p-6"} onClick={e => e.stopPropagation()}>
            {reportSent ? (
              <div className="text-center py-4"><Check className="w-12 h-12 text-emerald-500 mx-auto mb-3" /><h3 className={"font-bold text-lg " + (dc?"text-white":"text-gray-900")}>Report Submitted</h3><p className={"text-sm " + (dc?"text-gray-400":"text-gray-500")}>Thank you. Our team will review this.</p></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4"><h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>Report {profile.name}</h3><button onClick={() => setShowReport(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
                <div className="space-y-3">
                  <div>
                    <label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Reason *</label>
                    <select className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={reportReason} onChange={e => setReportReason(e.target.value)}>
                      <option value="">Select reason</option>
                      <option>Fake profile</option><option>Harassment</option><option>Inappropriate content</option><option>Spam</option><option>Scam / Fraud</option><option>Underage user</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Details (optional)</label>
                    <textarea className={"w-full px-4 py-3 rounded-xl border outline-none text-sm h-20 resize-none " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} placeholder="Describe what happened..." value={reportDetails} onChange={e => setReportDetails(e.target.value)} />
                  </div>
                  <button onClick={submitReport} disabled={!reportReason} className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold disabled:opacity-60">Submit Report</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
