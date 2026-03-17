"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, TierBadge } from "../layout";
import { Shield, Heart, Calendar, User, Globe, MessageCircle, ArrowLeft, Crown, Gem, Rss, Phone, Video } from "lucide-react";
import Link from "next/link";

type ViewUser = { id:string; name:string; age:number|null; gender:string|null; lookingFor:string|null; bio:string|null; country:string|null; profilePhoto:string|null; tier:string; verified:boolean; createdAt:string; };
type Post = { id:string; content:string|null; image:string|null; createdAt:string; likeCount:number; liked:boolean; };

function UserProfileContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user: me } = useUser();
  const userId = params.get("id");
  const [profile, setProfile] = useState<ViewUser|null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (!userId) return;
    fetch("/api/users/profile?id="+userId).then(r=>r.json()).then(d=>{
      setProfile(d.user); setPosts(d.posts||[]); setPostCount(d.postCount||0); setLoading(false);
    }).catch(()=>setLoading(false));
  }, [userId]);

  const toggleLike = async (postId: string) => {
    await fetch("/api/feed/like", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }) });
    setPosts(prev => prev.map(p => p.id===postId ? { ...p, liked:!p.liked, likeCount:p.liked?p.likeCount-1:p.likeCount+1 } : p));
  };

  const sendMessage = async () => {
    if (!profile) return;
    await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId:profile.id, content:"Hey! I checked out your profile! 👋" }) });
    router.push("/dashboard/messages");
  };

  const formatTime = (d: string) => { const diff = Date.now()-new Date(d).getTime(); if(diff<3600000) return Math.floor(diff/60000)+"m ago"; if(diff<86400000) return Math.floor(diff/3600000)+"h ago"; return new Date(d).toLocaleDateString([],{month:"short",day:"numeric"}); };

  // Simple online simulation (users created in last 24h show as online)
  const isOnline = profile ? (Date.now() - new Date(profile.createdAt).getTime()) < 86400000 * 30 : false;

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;
  if (!profile) return <div className="text-center py-20"><p className="text-gray-500">User not found</p><Link href="/dashboard/browse" className="text-rose-500 font-semibold mt-2 inline-block">Back to Browse</Link></div>;

  const tierColor = profile.tier==="gold"?"from-amber-400 via-yellow-500 to-orange-500":profile.tier==="premium"?"from-rose-500 via-pink-500 to-purple-500":"from-rose-500 via-pink-500 to-purple-500";

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm font-medium"><ArrowLeft className="w-4 h-4" /> Back</button>

      {/* Profile Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-6 shadow-lg">
        <div className={"h-44 bg-gradient-to-br "+tierColor+" relative"}><div className="absolute inset-0 bg-black/10" /><div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full" /></div>
        <div className="bg-white px-6 pb-6 pt-16 relative">
          <div className="absolute -top-14 left-6">
            <div className="relative">
              <div className="ring-4 ring-white rounded-2xl shadow-xl">
                {profile.profilePhoto ? <img src={profile.profilePhoto} className="w-28 h-28 rounded-2xl object-cover" /> : <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-rose-300 to-pink-300 flex items-center justify-center text-white text-4xl font-bold">{profile.name[0]}</div>}
              </div>
              {/* Online indicator */}
              <div className={"absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-white flex items-center justify-center " + (isOnline ? "bg-emerald-400" : "bg-gray-300")}>
                <div className={"w-2.5 h-2.5 rounded-full " + (isOnline ? "bg-white animate-pulse" : "bg-gray-400")} />
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}{profile.age?", "+profile.age:""}</h1>
                {profile.tier==="verified"&&<Shield className="w-5 h-5 text-blue-500 fill-blue-100"/>}
                {profile.tier==="gold"&&<Crown className="w-5 h-5 text-amber-500"/>}
                {profile.tier==="premium"&&<Gem className="w-5 h-5 text-rose-500"/>}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + (isOnline ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500")}>{isOnline ? "Online now" : "Offline"}</span>
                <TierBadge tier={profile.tier} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                {profile.gender && <span>{profile.gender}</span>}
                {profile.lookingFor && <span>Looking for {profile.lookingFor}</span>}
                {profile.country && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{profile.country}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Joined {new Date(profile.createdAt).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-5 pt-5 border-t border-gray-100">
            <button onClick={sendMessage} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"><MessageCircle className="w-4 h-4" /> Message</button>
            <button onClick={sendMessage} className="w-11 h-11 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all"><Phone className="w-5 h-5" /></button>
            <button onClick={sendMessage} className="w-11 h-11 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-all"><Video className="w-5 h-5" /></button>
            <button onClick={() => toggleLike(profile.id)} className="w-11 h-11 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all"><Heart className="w-5 h-5" /></button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-5 pt-5 border-t border-gray-100">
            <div className="text-center"><p className="text-xl font-bold text-gray-900">{postCount}</p><p className="text-[11px] text-gray-500">Posts</p></div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center"><p className="text-xl font-bold text-gray-900">{profile.age||"--"}</p><p className="text-[11px] text-gray-500">Age</p></div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center"><p className="text-sm font-bold text-gray-900">{profile.gender||"--"}</p><p className="text-[11px] text-gray-500">Gender</p></div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center"><p className="text-sm font-bold text-gray-900">{profile.lookingFor||"--"}</p><p className="text-[11px] text-gray-500">Seeking</p></div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</h3>
          <p className="text-gray-700 leading-relaxed text-sm">{profile.bio}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setActiveTab("posts")} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all " + (activeTab==="posts"?"bg-white text-gray-900 shadow-sm":"text-gray-500")}><Rss className="w-4 h-4" /> Posts ({postCount})</button>
        <button onClick={() => setActiveTab("info")} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all " + (activeTab==="info"?"bg-white text-gray-900 shadow-sm":"text-gray-500")}><User className="w-4 h-4" /> Info</button>
      </div>

      {/* Posts Tab */}
      {activeTab === "posts" && (
        posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center"><p className="text-gray-400 text-sm">No posts yet</p></div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-4 pb-2">
                  {profile.profilePhoto ? <img src={profile.profilePhoto} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">{profile.name[0]}</div>}
                  <div><p className="text-sm font-bold text-gray-900">{profile.name}</p><p className="text-xs text-gray-400">{formatTime(post.createdAt)}</p></div>
                </div>
                {post.content && <p className="px-4 pb-3 text-sm text-gray-800">{post.content}</p>}
                {post.image && <img src={post.image} className="w-full max-h-[400px] object-cover" />}
                <div className="flex border-t border-gray-100">
                  <button onClick={() => toggleLike(post.id)} className={"flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium " + (post.liked?"text-rose-500":"text-gray-500 hover:bg-gray-50")}>
                    <Heart className={"w-5 h-5 " + (post.liked?"fill-rose-500":"")} /> {post.likeCount>0?post.likeCount+" ":""}{post.liked?"Liked":"Like"}
                  </button>
                  <Link href="/dashboard/feed" className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50"><MessageCircle className="w-5 h-5" /> Comment</Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Info Tab */}
      {activeTab === "info" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="space-y-4">
            {[
              { icon:User, label:"Name", value:profile.name },
              { icon:Calendar, label:"Age", value:profile.age ? profile.age + " years old" : "Not shared" },
              { icon:User, label:"Gender", value:profile.gender || "Not shared" },
              { icon:Heart, label:"Looking For", value:profile.lookingFor || "Not shared" },
              { icon:Globe, label:"Country", value:profile.country || "Not shared" },
              { icon:Shield, label:"Account Type", value:profile.tier.charAt(0).toUpperCase()+profile.tier.slice(1) },
              { icon:Calendar, label:"Joined", value:new Date(profile.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) },
            ].map((item,i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0"><item.icon className="w-5 h-5 text-gray-400" /></div>
                <div className="flex-1"><p className="text-xs text-gray-500">{item.label}</p><p className="text-sm font-semibold text-gray-900">{item.value}</p></div>
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
