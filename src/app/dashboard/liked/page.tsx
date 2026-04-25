"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Heart, Star, Lock, Crown, Shield, MessageCircle, Eye } from "lucide-react";
import Link from "next/link";

export default function WhoLikedMePage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [likes, setLikes] = useState<any[]>([]);
  const [canSee, setCanSee] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("/api/discover/liked-me").then(r => r.json()).then(d => {
      setLikes(d.likes || []);
      setCanSee(d.canSeeDetails || false);
      setTotal(d.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));

    const handleRefresh = () => {
      fetch("/api/discover/liked-me").then(r => r.json()).then(d => {
        setLikes(d.likes || []);
        setCanSee(d.canSeeDetails || false);
        setTotal(d.total || 0);
      });
    };
    const i = setInterval(handleRefresh, 15000);
    window.addEventListener("connecthub:refresh", handleRefresh);
    return () => { clearInterval(i); window.removeEventListener("connecthub:refresh", handleRefresh); };
  }, []);

  const likeBack = async (targetId: string) => {
    await fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, type: "like" }),
    });
    setLikes(prev => prev.filter(l => l.user?.id !== targetId));
  };

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;

  return (
    <div className={"max-w-2xl mx-auto px-4 py-6 " + (dc ? "text-white" : "")}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={"text-2xl font-extrabold " + (dc ? "text-white" : "text-gray-900")}>Who Likes You</h1>
          <p className={"text-sm mt-1 " + (dc ? "text-gray-400" : "text-gray-500")}>{total} {total === 1 ? "person" : "people"} liked your profile</p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200/40">
          <Heart className="w-6 h-6 fill-white" />
        </div>
      </div>

      {/* Upgrade prompt for free users */}
      {!canSee && total > 0 && (
        <div className={"rounded-2xl border p-6 mb-6 text-center " + (dc ? "bg-gradient-to-br from-gray-800 to-gray-800/80 border-gray-700" : "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100")}>
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg shadow-amber-200/50">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className={"text-xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>{total} People Like You!</h2>
          <p className={"text-sm mb-5 " + (dc ? "text-gray-400" : "text-gray-500")}>Upgrade to Plus or Premium to see who likes you and match instantly.</p>
          <Link href="/dashboard/coins?upgrade=plus" className="inline-block px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm hover:shadow-xl hover:shadow-rose-200/40 transition-all">
            Unlock Now →
          </Link>
        </div>
      )}

      {total === 0 && (
        <div className={"rounded-2xl border p-10 text-center " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm")}>
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-5">
            <Heart className="w-10 h-10 text-rose-400" />
          </div>
          <h2 className={"text-xl font-bold mb-2 " + (dc ? "text-white" : "text-gray-900")}>No Likes Yet</h2>
          <p className={"text-sm mb-5 " + (dc ? "text-gray-400" : "text-gray-500")}>Complete your profile and add great photos to attract more people!</p>
          <Link href="/dashboard/profile" className="inline-block px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm hover:shadow-lg transition-all">Update Profile</Link>
        </div>
      )}

      {/* Likes grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {likes.map((like: any, i: number) => {
          const u = like.user;
          if (!u) return null;
          const blurred = u.blurred;

          return (
            <div key={i} className={"relative rounded-2xl overflow-hidden border transition-all hover:shadow-xl hover:-translate-y-1 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm")}>
              {/* Super like badge */}
              {like.type === "superlike" && (
                <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-lg">
                  <Star className="w-3 h-3 fill-white" /> Super Like
                </div>
              )}

              {/* Profile photo */}
              <div className="relative aspect-[3/4] min-h-[160px]">
                {blurred ? (
                  <div className="w-full h-full bg-gradient-to-br from-rose-200 to-pink-200 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className={"w-8 h-8 mx-auto mb-2 " + (dc ? "text-gray-600" : "text-rose-300")} />
                      <p className={"text-xs font-semibold " + (dc ? "text-gray-500" : "text-rose-400")}>Upgrade to reveal</p>
                    </div>
                  </div>
                ) : u.profilePhoto ? (
                  <img src={u.profilePhoto} alt={u.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">{u.name?.[0] || "?"}</span>
                  </div>
                )}
                {!blurred && u.isOnline && <div className="absolute top-3 right-3 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className={"font-bold text-sm truncate " + (dc ? "text-white" : "text-gray-900")}>{blurred ? "???" : u.name}{!blurred && u.age ? `, ${u.age}` : ""}</p>
                  {!blurred && u.verified && <Shield className="w-3.5 h-3.5 text-blue-500 fill-blue-500 flex-shrink-0" />}
                </div>
                {!blurred && u.city && <p className={"text-xs truncate " + (dc ? "text-gray-500" : "text-gray-400")}>{u.city}{u.country ? `, ${u.country}` : ""}</p>}

                {/* Actions */}
                {!blurred && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => likeBack(u.id)} className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all flex items-center justify-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-white" /> Like Back
                    </button>
                    <Link href={"/dashboard/messages?user=" + u.id} className={"py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center " + (dc ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600")}>
                      <MessageCircle className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
