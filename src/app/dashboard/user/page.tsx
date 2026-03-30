"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser, TierBadge } from "../layout";
import { Heart, MessageCircle, Shield, MapPin, ArrowLeft, UserPlus, Ban, Flag, Phone, Mail, Calendar, Users, Sparkles } from "lucide-react";
import Link from "next/link";

export default function UserProfilePage() {
  const { user, dark } = useUser();
  const dc = dark;
  const params = useSearchParams();
  const viewId = params.get("id");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    if (!viewId) { setLoading(false); return; }
    fetch("/api/users/profile?id=" + viewId).then(r => r.json()).then(d => {
      if (d.user) setProfile(d.user);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [viewId]);

  const sendFriendReq = async () => {
    setActionLoading("friend");
    await fetch("/api/friends", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ friendId: viewId }) });
    setProfile((p: any) => ({ ...p, friendshipStatus: "pending" }));
    setActionLoading("");
  };

  const blockUser = async () => {
    if (!confirm("Block this user? They won't be able to contact you.")) return;
    setActionLoading("block");
    await fetch("/api/block", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ blockedId: viewId }) });
    setActionLoading("");
  };

  const reportUser = async () => {
    const reason = prompt("Why are you reporting this user?");
    if (!reason) return;
    await fetch("/api/report", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ reportedId: viewId, reason }) });
    alert("Report submitted. Our team will review it within 24 hours.");
  };

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;
  if (!profile) return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="text-5xl mb-4">😕</div>
      <h2 className={"text-xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>User not found</h2>
      <p className={"text-sm mb-6 " + (dc?"text-gray-400":"text-gray-500")}>This profile may have been removed or does not exist.</p>
      <Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm hover:shadow-lg">Back to Discover</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className={"flex items-center gap-2 mb-4 text-sm font-medium " + (dc?"text-gray-400 hover:text-white":"text-gray-500 hover:text-gray-900")}><ArrowLeft className="w-4 h-4" /> Back</Link>

      {/* Profile header */}
      <div className={"rounded-2xl border overflow-hidden mb-4 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <div className="relative h-64 sm:h-80">
          {profile.profilePhoto ? <img src={profile.profilePhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-rose-400 via-pink-400 to-purple-400 flex items-center justify-center"><span className="text-white text-8xl font-bold">{profile.name?.[0]}</span></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            {isOnline(profile.lastSeen) && <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Online</span>}
            {profile.verified && <span className="bg-blue-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Shield className="w-3 h-3" /> Verified</span>}
            <TierBadge tier={profile.tier} />
          </div>
          <div className="absolute bottom-4 left-4">
            <h1 className="text-2xl font-bold text-white">{profile.name}{profile.age ? ", " + profile.age : ""}</h1>
            {profile.country && <p className="text-white/80 text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.country}</p>}
          </div>
        </div>

        {/* Action buttons */}
        <div className={"flex gap-2 p-4 " + (dc?"bg-gray-800":"bg-white")}>
          {!profile.isFriend && profile.friendshipStatus !== "pending" && (
            <button onClick={sendFriendReq} disabled={!!actionLoading} className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg"><UserPlus className="w-4 h-4" /> Add Friend</button>
          )}
          {profile.friendshipStatus === "pending" && (
            <div className="flex-1 py-3 bg-amber-50 text-amber-600 rounded-xl font-bold text-sm text-center border border-amber-200">Request Pending</div>
          )}
          {profile.isFriend && (
            <Link href={"/dashboard/messages?user=" + profile.id} className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg"><MessageCircle className="w-4 h-4" /> Message</Link>
          )}
          <button onClick={reportUser} className={"py-3 px-4 rounded-xl border text-sm font-medium " + (dc?"border-gray-600 text-gray-400":"border-gray-200 text-gray-500")}><Flag className="w-4 h-4" /></button>
          <button onClick={blockUser} className={"py-3 px-4 rounded-xl border text-sm font-medium " + (dc?"border-gray-600 text-red-400":"border-gray-200 text-red-500")}><Ban className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className={"rounded-2xl border p-5 mb-4 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
          <h3 className={"font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>About</h3>
          <p className={"text-sm leading-relaxed " + (dc?"text-gray-300":"text-gray-600")}>{profile.bio}</p>
        </div>
      )}

      {/* Details */}
      <div className={"rounded-2xl border p-5 mb-4 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <h3 className={"font-bold mb-3 " + (dc?"text-white":"text-gray-900")}>Details</h3>
        <div className="grid grid-cols-2 gap-3">
          {profile.gender && <div className={"rounded-xl p-3 " + (dc?"bg-gray-700":"bg-gray-50")}><p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Gender</p><p className={"text-sm font-medium " + (dc?"text-white":"text-gray-900")}>{profile.gender}</p></div>}
          {profile.lookingFor && <div className={"rounded-xl p-3 " + (dc?"bg-gray-700":"bg-gray-50")}><p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Looking for</p><p className={"text-sm font-medium " + (dc?"text-white":"text-gray-900")}>{profile.lookingFor}</p></div>}
          {profile.phone && <div className={"rounded-xl p-3 " + (dc?"bg-gray-700":"bg-gray-50")}><p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Phone</p><p className={"text-sm font-medium " + (dc?"text-white":"text-gray-900")}>{profile.phone}</p></div>}
          {profile.email && <div className={"rounded-xl p-3 " + (dc?"bg-gray-700":"bg-gray-50")}><p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Email</p><p className={"text-sm font-medium " + (dc?"text-white":"text-gray-900")}>{profile.email}</p></div>}
          <div className={"rounded-xl p-3 " + (dc?"bg-gray-700":"bg-gray-50")}><p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Posts</p><p className={"text-sm font-medium " + (dc?"text-white":"text-gray-900")}>{profile.postCount || 0}</p></div>
          <div className={"rounded-xl p-3 " + (dc?"bg-gray-700":"bg-gray-50")}><p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Friends</p><p className={"text-sm font-medium " + (dc?"text-white":"text-gray-900")}>{profile.friendCount || 0}</p></div>
        </div>
      </div>

      {/* Interests */}
      {profile.interests?.length > 0 && (
        <div className={"rounded-2xl border p-5 mb-4 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
          <h3 className={"font-bold mb-3 " + (dc?"text-white":"text-gray-900")}>Interests</h3>
          <div className="flex flex-wrap gap-2">{profile.interests.map((t: string) => <span key={t} className={"px-3 py-1.5 rounded-full text-sm font-medium " + (dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600")}>{t}</span>)}</div>
        </div>
      )}

      {/* Photos */}
      {profile.photos?.length > 1 && (
        <div className={"rounded-2xl border p-5 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
          <h3 className={"font-bold mb-3 " + (dc?"text-white":"text-gray-900")}>Photos</h3>
          <div className="grid grid-cols-3 gap-2">{profile.photos.map((p: string, i: number) => <img key={i} src={p} className="w-full h-28 rounded-xl object-cover" />)}</div>
        </div>
      )}
    </div>
  );
}
