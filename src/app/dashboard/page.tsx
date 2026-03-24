"use client";
import AdBanner from "@/components/AdBanner";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, X, Star, Shield, Sparkles, MessageCircle, Users, Crown, Gem, Globe } from "lucide-react";
import { useUser } from "./layout";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = { id:string; name:string; age:number|null; gender:string|null; lookingFor:string|null; bio:string|null; country:string|null; profilePhoto:string|null; tier:string; verified:boolean; };
const gradients = ["from-rose-400 to-pink-400","from-violet-400 to-purple-400","from-amber-400 to-orange-400","from-emerald-400 to-teal-400","from-sky-400 to-blue-400","from-fuchsia-400 to-pink-400","from-indigo-400 to-violet-400","from-cyan-400 to-teal-400"];

export default function DiscoverPage() {
  const { user } = useUser();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<string|null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/users").then(r=>r.json()).then(d=>{setProfiles(d.users||[]);setLoading(false);}).catch(()=>setLoading(false)); }, []);

  const p = profiles[idx % Math.max(profiles.length, 1)];
  const match = 75 + Math.floor(Math.random() * 25);

  const swipe = (d: string) => {
    setDir(d);
    if (d === "right" && Math.random() > 0.4) setTimeout(() => setShowMatch(true), 400);
    setTimeout(() => { setDir(null); setIdx(i => i + 1); }, 400);
  };

  const sendMessage = async (receiverId: string) => {
    await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId, content:"Hey! We matched on ConnectHub! 👋" }) });
    setShowMatch(false);
    router.push("/dashboard/messages");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;

  if (profiles.length === 0) return (
    <div className="text-center py-20"><div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-5"><Users className="w-10 h-10 text-rose-400" /></div><h2 className="text-2xl font-bold text-gray-900 mb-2">No Profiles Yet</h2><p className="text-gray-500">Invite friends to join ConnectHub!</p></div>
  );

  if (!p) return <div className="text-center py-20"><h2 className="text-2xl font-bold text-gray-900 mb-2">No more profiles</h2><p className="text-gray-500">Check back later!</p></div>;

  const TierIcon = ({tier}:{tier:string}) => {
    if (tier==="gold") return <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><Crown className="w-3 h-3"/>Gold</div>;
    if (tier==="premium") return <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><Gem className="w-3 h-3"/>Pro</div>;
    if (tier==="verified") return <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><Shield className="w-3 h-3"/>Verified</div>;
    return null;
  };

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Discover</h1><p className="text-sm text-gray-500">Find your perfect match</p></div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 max-w-md mx-auto lg:mx-0">
          <motion.div animate={{ x:dir==="left"?-500:dir==="right"?500:0, rotate:dir==="left"?-15:dir==="right"?15:0, opacity:dir?0:1 }} transition={{ duration:0.4 }} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {/* Clickable photo area */}
            <Link href={"/dashboard/user?id="+p.id} className="block relative h-72">
              {p.profilePhoto ? (
                <img src={p.profilePhoto} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className={"w-full h-full bg-gradient-to-br "+gradients[idx%gradients.length]+" flex items-center justify-center"}><span className="text-7xl font-bold text-white/30">{p.name[0]}</span></div>
              )}
              <TierIcon tier={p.tier} />
              <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent" />
              <div className="absolute bottom-3 left-5 flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{p.name}{p.age?", "+p.age:""}</h2>
              </div>
            </Link>
            <div className="p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                {p.gender && <span>{p.gender}</span>}
                {p.lookingFor && <span>· Looking for {p.lookingFor}</span>}
                {p.country && <span className="flex items-center gap-1">· <Globe className="w-3.5 h-3.5"/>{p.country}</span>}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-400">Compatibility</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full" style={{width:match+"%"}} /></div>
                <span className="text-sm font-bold text-rose-500">{match}%</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{p.bio || "No bio yet — say hello and find out more!"}</p>
              {/* View Profile link */}
              <Link href={"/dashboard/user?id="+p.id} className="text-xs text-rose-500 font-semibold hover:underline">View Full Profile →</Link>
            </div>
          </motion.div>

          <div className="flex justify-center gap-5 mt-5">
            <button onClick={() => swipe("left")} className="w-14 h-14 rounded-full bg-white shadow-md border-2 border-gray-100 flex items-center justify-center hover:border-red-200 hover:bg-red-50 transition-all active:scale-90"><X className="w-6 h-6 text-gray-400" /></button>
            <button className="w-12 h-12 rounded-full bg-white shadow-md border-2 border-amber-100 flex items-center justify-center hover:bg-amber-50 transition-all active:scale-90"><Star className="w-5 h-5 text-amber-400 fill-amber-400" /></button>
            <button onClick={() => swipe("right")} className="w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg shadow-rose-200 flex items-center justify-center hover:shadow-xl transition-all active:scale-90"><Heart className="w-6 h-6 text-white fill-white" /></button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-rose-500" /> People on ConnectHub</h3>
            <div className="space-y-3">
              {profiles.slice(0,6).map((pr,i) => (
                <Link key={pr.id} href={"/dashboard/user?id="+pr.id} className="flex items-center gap-3 py-1.5 hover:bg-gray-50 rounded-lg px-1 -mx-1 transition-all">
                  {pr.profilePhoto ? <img src={pr.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className={"w-10 h-10 rounded-full bg-gradient-to-br "+gradients[i%gradients.length]+" flex items-center justify-center text-white text-sm font-bold"}>{pr.name[0]}</div>}
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{pr.name}{pr.age?", "+pr.age:""}</p><p className="text-xs text-gray-400">{pr.country||pr.gender||"Member"}</p></div>
                  {pr.tier==="verified"&&<Shield className="w-4 h-4 text-blue-400"/>}
                  {pr.tier==="gold"&&<Crown className="w-4 h-4 text-amber-400"/>}
                  {pr.tier==="premium"&&<Gem className="w-4 h-4 text-rose-400"/>}
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl p-5 text-white">
            <Sparkles className="w-6 h-6 mb-2" />
            <h3 className="font-bold mb-1">Upgrade to Premium</h3>
            <p className="text-sm text-rose-100 mb-3">See who likes you and get unlimited swipes</p>
            <Link href="/dashboard/upgrade" className="block w-full py-2 bg-white text-rose-500 rounded-xl text-sm font-bold hover:bg-rose-50 transition-all text-center">Upgrade Now</Link>
          </div>
        </div>
      </div>

      {/* Match Modal */}
      {showMatch && p && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMatch(false)}>
          <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">💕</div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">It is a Match!</h2>
            <p className="text-gray-500 mb-6">You and {p.name} liked each other</p>
            <div className="flex justify-center items-center gap-4 mb-6">
              {user?.profilePhoto ? <img src={user.profilePhoto} className="w-16 h-16 rounded-full object-cover border-2 border-rose-200" /> : <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold">{user?.name?.[0]}</div>}
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
              {p.profilePhoto ? <img src={p.profilePhoto} className="w-16 h-16 rounded-full object-cover border-2 border-rose-200" /> : <div className={"w-16 h-16 rounded-full bg-gradient-to-br "+gradients[idx%gradients.length]+" flex items-center justify-center text-white text-xl font-bold"}>{p.name[0]}</div>}
            </div>
            <button onClick={() => sendMessage(p.id)} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold mb-3 flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5" /> Send a Message</button>
            <button onClick={() => setShowMatch(false)} className="w-full py-3 border-2 border-gray-200 rounded-full font-semibold text-gray-600">Keep Swiping</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
