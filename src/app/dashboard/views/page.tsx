"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Eye, Crown, Lock, Globe } from "lucide-react";
import Link from "next/link";

export default function ProfileViewsPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [views, setViews] = useState<any[]>([]);
  const [needUpgrade, setNeedUpgrade] = useState(false);

  useEffect(() => {
    fetch("/api/profile-views").then(r => { if (r.status === 403) { setNeedUpgrade(true); return { views:[] }; } return r.json(); }).then(d => setViews(d.views || [])).catch(() => {});
  }, []);

  if (needUpgrade) return (
    <div className="max-w-md mx-auto text-center py-20">
      <Lock className={"w-16 h-16 mx-auto mb-4 " + (dc?"text-gray-600":"text-gray-300")} />
      <h2 className={"text-2xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Premium Feature</h2>
      <p className={"mb-6 " + (dc?"text-gray-400":"text-gray-500")}>See who viewed your profile with Premium or Gold plan</p>
      <Link href="/dashboard/coins" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold inline-flex items-center gap-2 hover:shadow-lg"><Crown className="w-4 h-4" /> Upgrade Now</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><Eye className="w-6 h-6 text-rose-500" /><h1 className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>Who Viewed Your Profile</h1><span className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>{views.length} views</span></div>
      {views.length === 0 ? <p className={"text-center py-16 " + (dc?"text-gray-500":"text-gray-400")}>No one has viewed your profile yet</p> : (
        <div className="space-y-2">{views.map((v:any) => (
          <Link href={"/dashboard/user?id=" + v.viewer?.id} key={v.id} className={"flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md " + (dc?"bg-gray-800 border-gray-700 hover:border-gray-600":"bg-white border-gray-100 hover:border-rose-200")}>
            {v.viewer?.profilePhoto ? <img src={v.viewer.profilePhoto} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{v.viewer?.name?.[0]||"?"}</div>}
            <div className="flex-1"><p className={"font-bold " + (dc?"text-white":"text-gray-900")}>{v.viewer?.name||"User"}{v.viewer?.age ? ", "+v.viewer.age : ""}</p><p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>{v.viewer?.country && <><Globe className="w-3 h-3 inline mr-1"/>{v.viewer.country}</>}</p></div>
            <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>{new Date(v.createdAt).toLocaleDateString()}</p>
          </Link>
        ))}</div>
      )}
    </div>
  );
}
