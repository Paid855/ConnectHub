"use client";
import { useState, useEffect } from "react";
import { useUser, TierBadge } from "../layout";
import { Eye, Lock, Crown, Shield, MapPin } from "lucide-react";
import Link from "next/link";

export default function ViewsPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [views, setViews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  useEffect(() => {
    fetch("/api/profile-views").then(r => {
      if (r.status === 403) { setNeedsUpgrade(true); setLoading(false); return null; }
      return r.json();
    }).then(d => { if (d) setViews(d.views || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;
  const timeAgo = (d: string) => { const diff = Date.now()-new Date(d).getTime(); if(diff<3600000) return Math.floor(diff/60000)+"m ago"; if(diff<86400000) return Math.floor(diff/3600000)+"h ago"; return new Date(d).toLocaleDateString(); };

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;

  if (needsUpgrade) return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className={"rounded-3xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
        <div className="bg-gradient-to-br from-violet-500 to-purple-500 p-8">
          <Lock className="w-12 h-12 text-white/80 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Premium Feature</h2>
          <p className="text-violet-100">See who's been checking out your profile</p>
        </div>
        <div className="p-6">
          <p className={"text-sm mb-5 " + (dc?"text-gray-400":"text-gray-500")}>Upgrade to Premium or Gold to unlock this feature</p>
          <Link href="/dashboard/coins" className="block w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg text-center"><Crown className="w-4 h-4 inline mr-2" />Upgrade Now</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><Eye className={"w-6 h-6 " + (dc?"text-violet-400":"text-violet-500")} /><h1 className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>Who Viewed You</h1><span className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>{views.length} views</span></div>

      {views.length === 0 ? (
        <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}><Eye className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} /><p className={"font-bold " + (dc?"text-white":"text-gray-900")}>No views yet</p><p className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>Complete your profile to attract more visitors</p></div>
      ) : (
        <div className="space-y-2">{views.map((v: any) => (
          <Link key={v.id} href={"/dashboard/user?id=" + v.viewer?.id} className={"flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
            <div className="relative">
              {v.viewer?.profilePhoto ? <img src={v.viewer.profilePhoto} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-white font-bold">{v.viewer?.name?.[0]}</div>}
              {isOnline(v.viewer?.lastSeen) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2"><p className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>{v.viewer?.name}{v.viewer?.age ? ", " + v.viewer.age : ""}</p>{v.viewer?.verified && <Shield className="w-3.5 h-3.5 text-blue-500" />}<TierBadge tier={v.viewer?.tier} /></div>
              {v.viewer?.country && <p className={"text-xs flex items-center gap-1 " + (dc?"text-gray-500":"text-gray-400")}><MapPin className="w-3 h-3" />{v.viewer.country}</p>}
            </div>
            <span className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>{timeAgo(v.createdAt)}</span>
          </Link>
        ))}</div>
      )}
    </div>
  );
}
