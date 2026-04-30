"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser, TierBadge } from "../layout";
import { Heart, MessageCircle, Shield, MapPin, ArrowLeft, UserPlus, Ban, Flag, Calendar, Users, Sparkles, Star, Crown, Gem, Camera, X, Globe, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserProfilePage() {
  const { user, dark } = useUser();
  const dc = dark;
  const router = useRouter();
  const params = useSearchParams();
  const viewId = params.get("id");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [photoViewer, setPhotoViewer] = useState<string | null>(null);
  const [likeAnim, setLikeAnim] = useState(false);

  const [mutualFriends, setMutualFriends] = useState<any[]>([]);
  const [viewingPhoto, setViewingPhoto] = useState<string|null>(null);

  useEffect(() => {
    if (!viewId) { setLoading(false); return; }
    fetch("/api/users/profile?id=" + viewId).then(r => r.json()).then(d => {
      if (d.user) setProfile(d.user);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Track profile view
    fetch("/api/profile-views", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ viewedId: viewId }) }).catch(() => {});

    // Load mutual friends
    fetch("/api/friends").then(r => r.json()).then(d => {
      const myFriends = (d.friends || []).map((f: any) => f.id);
      fetch("/api/users/profile?id=" + viewId).then(r => r.json()).then(d2 => {
        if (d2.user?.friends) {
          const mutual = d2.user.friends.filter((f: any) => myFriends.includes(f.id));
          setMutualFriends(mutual);
        }
      }).catch(() => {});
    }).catch(() => {});
  }, [viewId]);

  const sendFriendReq = async () => {
    setActionLoading("friend");
    await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendId: viewId }) });
    setProfile((p: any) => ({ ...p, friendshipStatus: "pending" }));
    setActionLoading("");
  };

  const sendLike = async () => {
    setLikeAnim(true);
    await fetch("/api/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId: viewId, type: "like" }) });
    setTimeout(() => setLikeAnim(false), 1500);
  };

  const sendSuperLike = async () => {
    await fetch("/api/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId: viewId, type: "superlike" }) });
  };

  const blockUser = async () => {
    if (!confirm("Block this user? They won't be able to contact you.")) return;
    setActionLoading("block");
    await fetch("/api/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockedId: viewId }) });
    setActionLoading("");
  };

  const reportUser = async () => {
    const reason = prompt("Why are you reporting this user?");
    if (!reason) return;
    setActionLoading("report");
    await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportedId: viewId, reason }) });
    alert("Report submitted. Our team will review it.");
    setActionLoading("");
  };

  const isOnline = profile?.lastSeen && Date.now() - new Date(profile.lastSeen).getTime() < 300000;
  const lastSeen = profile?.lastSeen ? (() => { const ms = Date.now() - new Date(profile.lastSeen).getTime(); if (ms < 60000) return "Just now"; if (ms < 3600000) return Math.floor(ms / 60000) + "m ago"; if (ms < 86400000) return Math.floor(ms / 3600000) + "h ago"; return Math.floor(ms / 86400000) + "d ago"; })() : null;

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;
  if (!profile) return (
    <div className={"text-center py-20 " + (dc ? "text-white" : "")}>
      <p className="text-lg font-medium">User not found</p>
      <Link href="/dashboard" className="text-rose-500 text-sm mt-2 inline-block">Back to Discover</Link>
    </div>
  );

  const tierColor = profile.tier === "gold" ? "from-amber-400 to-orange-500" : profile.tier === "premium" ? "from-rose-500 to-purple-500" : "from-gray-400 to-gray-500";

  return (
    <div className={"max-w-lg mx-auto pb-8 " + (dc ? "text-white" : "")}>
      {/* Like animation */}
      {likeAnim && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
          <div className="animate-ping"><Heart className="w-32 h-32 text-rose-500 fill-rose-500 opacity-50" /></div>
        </div>
      )}

      {/* Photo viewer */}
      {photoViewer && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center" onClick={() => setPhotoViewer(null)}>
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setPhotoViewer(null)}><X className="w-8 h-8" /></button>
          <img src={photoViewer} className="max-w-full max-h-[85vh] rounded-2xl object-contain" alt="" />
        </div>
      )}

      {/* Back button */}
      <button onClick={() => router.back()} className={"inline-flex items-center gap-2 mb-4 text-sm font-medium " + (dc ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800")}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero photo section */}
      <div className={"rounded-3xl overflow-hidden border shadow-xl " + (dc ? "border-gray-700 shadow-black/50" : "border-gray-100 shadow-rose-100/30")}>
        <div className="relative aspect-[3/4] max-h-[500px] cursor-pointer" onClick={() => profile.profilePhoto && setPhotoViewer(profile.profilePhoto)}>
          {profile.profilePhoto ? (
            <img src={profile.profilePhoto} className="w-full h-full object-cover" alt={profile.name} />
          ) : (
            <div className={"w-full h-full bg-gradient-to-br " + tierColor + " flex items-center justify-center"}>
              <span className="text-9xl font-bold text-white/20">{profile.name?.[0]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Online badge */}
          {isOnline && (
            <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Online
            </div>
          )}

          {/* Verified + tier */}
          <div className="absolute top-4 right-4 flex gap-2">
            {profile.verified && <div className="bg-blue-500/90 backdrop-blur text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Verified</div>}
            {profile.tier === "gold" && <div className="bg-amber-500/90 backdrop-blur text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><Gem className="w-3.5 h-3.5" /> Gold</div>}
            {profile.tier === "premium" && <div className="bg-purple-500/90 backdrop-blur text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /> Premium</div>}
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-white text-3xl font-extrabold">{profile.name}{profile.age ? <span className="font-normal text-2xl">, {profile.age}</span> : ""}</h1>
            <div className="flex items-center gap-3 text-white/80 text-sm mt-1">
              {(profile.city || profile.country) && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {[profile.city, profile.country].filter(Boolean).join(", ")}</span>}
              {profile.gender && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {profile.gender}</span>}
            </div>
            {!isOnline && lastSeen && <p className="text-white/50 text-xs mt-1">Last seen {lastSeen}</p>}
          </div>
        </div>

        {/* Action buttons */}
        <div className={"p-4 " + (dc ? "bg-gray-800" : "bg-white")}>
          <div className="flex items-center justify-center gap-3">
            <button onClick={sendLike} className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30 hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-white" />
            </button>
            <button onClick={sendSuperLike} className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-110 transition-transform">
              <Star className="w-5 h-5 text-white fill-white" />
            </button>
            <Link href={"/dashboard/messages?chat=" + viewId} className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-white" />
            </Link>
            {!profile.isFriend && profile.friendshipStatus !== "pending" && (
              <button onClick={sendFriendReq} disabled={actionLoading === "friend"} className={"w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform " + (dc ? "bg-gray-700 shadow-gray-900/30" : "bg-gray-100 shadow-gray-200/30")}>
                <UserPlus className={"w-5 h-5 " + (dc ? "text-gray-300" : "text-gray-600")} />
              </button>
            )}
            {profile.friendshipStatus === "pending" && (
              <div className={"w-12 h-12 rounded-full flex items-center justify-center " + (dc ? "bg-gray-700" : "bg-gray-100")}>
                <Check className={"w-5 h-5 " + (dc ? "text-emerald-400" : "text-emerald-500")} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mutual Friends */}
      {mutualFriends.length > 0 && (
        <div className={"mt-4 rounded-2xl border p-4 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🤝</span>
            <h3 className={"text-sm font-bold " + (dc ? "text-gray-300" : "text-gray-800")}>{mutualFriends.length} Mutual Friend{mutualFriends.length > 1 ? "s" : ""}</h3>
          </div>
          <div className="flex -space-x-2">
            {mutualFriends.slice(0, 5).map((f: any) => (
              <div key={f.id} className="relative" title={f.name}>
                {f.profilePhoto ? (
                  <img src={f.profilePhoto} className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800" alt={f.name} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-800">{f.name?.[0]}</div>
                )}
              </div>
            ))}
            {mutualFriends.length > 5 && <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 " + (dc ? "bg-gray-700 border-gray-800 text-gray-400" : "bg-gray-100 border-white text-gray-500")}>+{mutualFriends.length - 5}</div>}
          </div>
        </div>
      )}

      {/* Vibe Status */}
      {profile.vibeStatus && (
        <div className={"mt-4 rounded-2xl border px-5 py-3.5 " + (dc ? "bg-purple-500/5 border-purple-500/20" : "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100")}>
          <p className={"text-sm font-medium " + (dc ? "text-purple-300" : "text-purple-700")}>{profile.vibeStatus}</p>
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <div className={"mt-4 rounded-2xl border p-5 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <h3 className={"text-sm font-bold mb-2 " + (dc ? "text-gray-300" : "text-gray-800")}>About</h3>
          <p className={"text-sm leading-relaxed " + (dc ? "text-gray-400" : "text-gray-600")}>{profile.bio}</p>
        </div>
      )}

      {/* Compatibility Hint */}
      {profile.interests && profile.interests.length > 0 && user.interests && user.interests.length > 0 && (() => {
        const shared = profile.interests.filter((i: string) => user.interests?.includes(i));
        if (shared.length === 0) return null;
        const pct = Math.round((shared.length / Math.max(profile.interests.length, user.interests.length || 1)) * 100);
        return (
          <div className={"mt-4 rounded-2xl border p-5 " + (dc ? "bg-gradient-to-br from-rose-500/5 to-pink-500/5 border-rose-500/20" : "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100")}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={"text-sm font-bold " + (dc ? "text-rose-400" : "text-rose-600")}>Compatibility</h3>
              <span className={"text-lg font-extrabold " + (pct >= 50 ? "text-emerald-500" : pct >= 25 ? "text-amber-500" : "text-gray-400")}>{pct}%</span>
            </div>
            <div className={"w-full h-2 rounded-full " + (dc ? "bg-gray-700" : "bg-gray-200")}>
              <div className={"h-2 rounded-full transition-all duration-500 " + (pct >= 50 ? "bg-gradient-to-r from-emerald-400 to-teal-500" : pct >= 25 ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gray-400")} style={{width: pct + "%"}} />
            </div>
            <p className={"text-xs mt-2 " + (dc ? "text-gray-400" : "text-gray-500")}>You share {shared.length} interest{shared.length > 1 ? "s" : ""}: {shared.join(", ")}</p>
          </div>
        );
      })()}

      {/* Photo Gallery */}
      {profile.photos && profile.photos.length > 0 && (
        <div className={"mt-4 rounded-2xl border p-5 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <h3 className={"text-sm font-bold mb-3 flex items-center gap-2 " + (dc ? "text-gray-300" : "text-gray-800")}><span className="text-purple-500">📸</span> Photos <span className={"text-xs font-normal " + (dc?"text-gray-500":"text-gray-400")}>{profile.photos.length}</span></h3>
          <div className="grid grid-cols-3 gap-1.5">
            {profile.photos.map((photo: string, i: number) => (
              <div key={i} className="relative rounded-lg overflow-hidden aspect-square cursor-pointer group" onClick={() => setViewingPhoto(photo)}>
                <img src={photo} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompts */}
      {profile.prompts && (() => {
        try {
          const prompts = JSON.parse(profile.prompts);
          if (!Array.isArray(prompts) || prompts.length === 0) return null;
          return (
            <div className={"mt-4 rounded-2xl border p-5 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
              <h3 className={"text-sm font-bold mb-3 flex items-center gap-2 " + (dc ? "text-gray-300" : "text-gray-800")}><span className="text-amber-500">✨</span> Prompts</h3>
              <div className="space-y-3">
                {prompts.map((p: any, i: number) => (
                  <div key={i} className={"rounded-xl p-4 " + (dc ? "bg-gray-700/50 border border-gray-600" : "bg-gradient-to-br from-rose-50/50 to-pink-50/50 border border-rose-100")}>
                    <p className={"text-xs font-bold uppercase tracking-wider mb-1.5 " + (dc ? "text-rose-400" : "text-rose-500")}>{p.question}</p>
                    <p className={"text-sm leading-relaxed " + (dc ? "text-gray-200" : "text-gray-700")}>{p.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        } catch { return null; }
      })()}

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <div className={"mt-4 rounded-2xl border p-5 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <h3 className={"text-sm font-bold mb-3 " + (dc ? "text-gray-300" : "text-gray-800")}>Interests</h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((i: string) => (
              <span key={i} className={"px-3 py-1.5 rounded-full text-xs font-medium " + (dc ? "bg-gray-700 text-gray-300" : "bg-rose-50 text-rose-600 border border-rose-100")}>
                {i}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div className={"mt-4 rounded-2xl border p-5 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
        <h3 className={"text-sm font-bold mb-3 " + (dc ? "text-gray-300" : "text-gray-800")}>Details</h3>
        <div className="space-y-3">
          {[
            profile.gender && ["Gender", profile.gender, Users],
            profile.lookingFor && ["Looking for", profile.lookingFor, Heart],
            profile.country && ["Location", [profile.city, profile.country].filter(Boolean).join(", "), Globe],
            profile.createdAt && ["Joined", new Date(profile.createdAt).toLocaleDateString([], { month: "long", year: "numeric" }), Calendar],
          ].filter(Boolean).map(([label, val, Icon]: any) => (
            <div key={label} className="flex items-center gap-3">
              <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + (dc ? "bg-gray-700" : "bg-gray-50")}><Icon className={"w-4 h-4 " + (dc ? "text-gray-400" : "text-gray-500")} /></div>
              <div>
                <p className={"text-[10px] " + (dc ? "text-gray-500" : "text-gray-400")}>{label}</p>
                <p className={"text-sm font-medium " + (dc ? "text-gray-200" : "text-gray-800")}>{val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Post count & friend count */}
      <div className={"mt-4 grid grid-cols-2 gap-3 "}>
        <div className={"rounded-2xl border p-4 text-center " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <p className={"text-2xl font-bold " + (dc ? "" : "text-gray-900")}>{profile.postCount || 0}</p>
          <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>Posts</p>
        </div>
        <div className={"rounded-2xl border p-4 text-center " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <p className={"text-2xl font-bold " + (dc ? "" : "text-gray-900")}>{profile.friendCount || 0}</p>
          <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>Friends</p>
        </div>
      </div>

      {/* Report & Block */}
      <div className="mt-4 flex gap-3">
        <button onClick={reportUser} disabled={actionLoading === "report"} className={"flex-1 py-3 rounded-2xl text-sm font-medium border flex items-center justify-center gap-2 transition-all " + (dc ? "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50")}>
          <Flag className="w-4 h-4" /> Report
        </button>
        <button onClick={blockUser} disabled={actionLoading === "block"} className={"flex-1 py-3 rounded-2xl text-sm font-medium border flex items-center justify-center gap-2 transition-all " + (dc ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100")}>
          <Ban className="w-4 h-4" /> Block
        </button>
      </div>
    </div>
  );
}
