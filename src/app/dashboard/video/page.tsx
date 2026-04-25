"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, Users, Radio, X, Gift, Send, Mic, MicOff, VideoOff, Eye, Crown, UserPlus, ShoppingCart, Check, Phone } from "lucide-react";

const GIFTS = [
  {id:"rose",name:"Rose",emoji:"🌹",coins:10},{id:"heart",name:"Heart",emoji:"💖",coins:25},
  {id:"kiss",name:"Kiss",emoji:"💋",coins:50},{id:"diamond",name:"Diamond",emoji:"💎",coins:100},
  {id:"crown",name:"Crown",emoji:"👑",coins:250},{id:"rocket",name:"Rocket",emoji:"🚀",coins:500},
  {id:"ring",name:"Ring",emoji:"💍",coins:1000},{id:"castle",name:"Castle",emoji:"🏰",coins:2500},
];

export default function LiveStreamPage() {
  const router = useRouter();
  const [page, setPage] = useState<"list"|"setup"|"live">("list");
  const [role, setRole] = useState<"host"|"viewer"|"cohost">("viewer");
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("chat");
  const [stream, setStream] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [realViewers, setRealViewers] = useState<any[]>([]);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [agoraClient, setAgoraClient] = useState<any>(null);
  const [tracks, setTracks] = useState<{a:any,v:any}>({a:null,v:null});
  const [err, setErr] = useState("");
  const [ended, setEnded] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [coins, setCoins] = useState(0);
  const [toasts, setToasts] = useState<{id:number,text:string,emoji:string}[]>([]);
  const [showViewerList, setShowViewerList] = useState(false);
  const [me, setMe] = useState<any>(null);
  const [invited, setInvited] = useState(false);
  const [myActiveStream, setMyActiveStream] = useState<any>(null);
  const [inviteSending, setInviteSending] = useState<string|null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const [floatingGifts, setFloatingGifts] = useState<{id:number;emoji:string;anim:string;x:number}[]>([]);
  const [topGifters, setTopGifters] = useState<{name:string;photo:string|null;total:number}[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const toast = useCallback((text:string, emoji="💬")=>{
    const id=Date.now()+Math.random();
    setToasts(t=>[...t,{id,text,emoji}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000);
  },[]);

  const loadStreams = useCallback(async()=>{
    try{const r=await fetch("/api/live");const d=await r.json();setStreams(d.streams||[]);}catch{}
    setLoading(false);
  },[]);

  // Load user info + coins + check for existing stream
  useEffect(()=>{
    (async()=>{
      try{const r=await fetch("/api/auth/me");const d=await r.json();setMe(d.user);
        // Check if user has an active stream
        if(d.user?.id){
          const sr=await fetch("/api/live");const sd=await sr.json();
          const myStream=(sd.streams||[]).find((s:any)=>s.userId===d.user.id);
          if(myStream) setMyActiveStream(myStream);
        }
      }catch{}
      try{const r=await fetch("/api/coins");const d=await r.json();setCoins(d.coins||0);}catch{}
    })();
    loadStreams();
  },[loadStreams]);

  // Refresh list
  useEffect(()=>{
    if(page!=="list") return;
    const i=setInterval(loadStreams,10000);
    return()=>clearInterval(i);
  },[page,loadStreams]);

  // Auto-refresh chat + viewers + invite check during live
  useEffect(()=>{
    if(page!=="live"||!stream) return;
    const loadMsgs = async()=>{
      try{const r=await fetch(`/api/live/chat?streamId=${stream.id}`);const d=await r.json();setMsgs(d.messages||[]);}catch{}
    };
    const loadViewers = async()=>{
      try{const r=await fetch(`/api/live/viewers?streamId=${stream.id}`);const d=await r.json();setRealViewers(d.viewers||[]);setViewerCount(d.count||0);}catch{}
    };
    const checkInvite = async()=>{
      if(role!=="viewer") return;
      try{const r=await fetch(`/api/live/invite?streamId=${stream.id}`);const d=await r.json();if(d.invited&&!invited) setInvited(true);}catch{}
    };
    loadMsgs(); loadViewers();
    const i1=setInterval(loadMsgs,2000);
    const i2=setInterval(loadViewers,5000);
    const i3=setInterval(checkInvite,3000);
    return()=>{clearInterval(i1);clearInterval(i2);clearInterval(i3);};
  },[page,stream,role,invited]);

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  // Helper: connect to Agora as host and start streaming
  const connectAgoraAsHost = async(s:any)=>{
    const AgoraRTC=(await import("agora-rtc-sdk-ng")).default;
    AgoraRTC.setLogLevel(4);
    const c=AgoraRTC.createClient({mode:"live",codec:"vp8"});
    await c.setClientRole("host");

    const ch=`stream_${s.id}`;
    const tk=await fetch("/api/agora",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({channelName:ch,isHost:true})}).then(r=>r.json());
    if(tk.error) throw new Error(tk.error);
    await c.join(tk.appId,ch,tk.token,tk.uid);

    const[at,vt]=await AgoraRTC.createMicrophoneAndCameraTracks({encoderConfig:"high_quality"},{encoderConfig:"720p_2"});
    setTracks({a:at,v:vt});
    await c.publish([at,vt]);

    c.on("user-published",async(user:any,type:any)=>{
      await c.subscribe(user,type);
      if(type==="video"){
        const tryPlay=()=>{const el=document.getElementById("cohost-video");if(el&&user.videoTrack){user.videoTrack.play(el,{fit:"cover"});return true;}return false;};
        if(!tryPlay()){let n=0;const iv=setInterval(()=>{n++;if(tryPlay()||n>20)clearInterval(iv);},200);}
      }
      if(type==="audio") user.audioTrack?.play();
    });
    c.on("user-joined",()=>toast("A viewer joined!","👋"));
    c.on("user-left",()=>{});

    setAgoraClient(c);
    setStream(s); setRole("host"); setPage("live");

    requestAnimationFrame(()=>{requestAnimationFrame(()=>{
      const el=document.getElementById("host-video");
      if(el&&vt){vt.play(el,{fit:"cover",mirror:true});}
    });});

    return { client: c, audioTrack: at, videoTrack: vt };
  };

  // ===== HOST: Go live =====
  const goLive = async()=>{
    if(!title.trim()){setErr("Enter a stream title");return;}
    setErr("");
    try{
      // First end any existing stale streams
      await fetch("/api/live",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"end"})});

      // Create fresh stream
      const cr=await fetch("/api/live",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start",title,category})});
      const data=await cr.json();
      if(!data.stream){setErr("Failed to create stream");return;}

      await connectAgoraAsHost(data.stream);
      setMyActiveStream(null);
      toast("You are now live!","🔴");
    }catch(e:any){
      setErr("Failed: "+(e.message||"Allow camera & microphone access"));
      // Clean up the stream if Agora failed
      await fetch("/api/live",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"end"})}).catch(()=>{});
    }
  };

  // ===== HOST: Rejoin own existing stream =====
  const rejoinAsHost = async(s:any)=>{
    setErr("");
    try{
      await connectAgoraAsHost(s);
      setMyActiveStream(null);
      toast("Rejoined your stream!","🔴");
    }catch(e:any){
      // If rejoin fails, end the stale stream
      setErr("Stream expired. Starting fresh...");
      await fetch("/api/live",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"end"})}).catch(()=>{});
      setMyActiveStream(null);
      loadStreams();
    }
  };

  // ===== VIEWER: Join stream =====
  const joinLive = async(s:any)=>{
    setStream(s); setRole("viewer"); setErr("");
    try{
      console.log("[Live] Step 1: Importing Agora SDK...");
      const AgoraRTC=(await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(4);
      console.log("[Live] Step 2: Creating client...");
      const c=AgoraRTC.createClient({mode:"live",codec:"vp8"});
      await c.setClientRole("audience");
      console.log("[Live] Step 3: Getting token...");
      const ch=`stream_${s.id}`;
      const tk=await fetch("/api/agora",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({channelName:ch,isHost:false})}).then(r=>r.json());
      console.log("[Live] Step 4: Token response:", JSON.stringify(tk).substring(0,100));
      if(tk.error) throw new Error(tk.error);

      c.on("user-published",async(user:any,type:any)=>{
        await c.subscribe(user,type);
        if(type==="video"){
          const tryPlay=()=>{const el=document.getElementById("viewer-video");if(el&&user.videoTrack){user.videoTrack.play(el,{fit:"cover"});return true;}return false;};
          if(!tryPlay()){let n=0;const iv=setInterval(()=>{n++;if(tryPlay()||n>30)clearInterval(iv);},200);}
        }
        if(type==="audio") user.audioTrack?.play();
      });

      c.on("user-left",(user:any)=>{
        // Check if stream is still live when host leaves
        setTimeout(async()=>{
          try{const r=await fetch("/api/live");const d=await r.json();
            const still = (d.streams||[]).find((x:any)=>x.id===s.id);
            if(!still) setEnded(true);
          }catch{}
        },2000);
      });

      console.log("[Live] Step 5: Joining channel:", ch);
      await c.join(tk.appId,ch,tk.token,tk.uid);
      console.log("[Live] Step 6: Joined successfully!");
      setAgoraClient(c);
      setPage("live");
      toast(`Joined ${s.host?.name||"the host"}'s stream`,"🎉");

      // Register as viewer
      try{await fetch("/api/live/viewers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:s.id})});}catch{}
    }catch(e:any){
      console.error("[Live] Join failed:", e);
      const msg = e.message || "Unknown error";
      setErr("Failed to join: " + msg);
      setStream(null); setPage("list");
    }
  };

  // ===== ACCEPT CO-HOST INVITE =====
  const acceptInvite = async()=>{
    if(!agoraClient||!stream) return;
    setInvited(false);
    try{
      const AgoraRTC=(await import("agora-rtc-sdk-ng")).default;

      // Switch from audience to host
      await agoraClient.setClientRole("host");

      // Create own camera + mic
      const[at,vt]=await AgoraRTC.createMicrophoneAndCameraTracks();
      setTracks({a:at,v:vt});
      await agoraClient.publish([at,vt]);

      setRole("cohost");
      toast("You are now co-hosting!","🎤");

      // Play own video in small preview
      requestAnimationFrame(()=>{requestAnimationFrame(()=>{
        const el=document.getElementById("cohost-self-video");
        if(el&&vt) vt.play(el,{fit:"cover",mirror:true});
      });});

      // Announce in chat
      try{await fetch("/api/live/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:stream.id,content:`🎤 ${me?.name||"A viewer"} is now co-hosting!`})});}catch{}
    }catch(e:any){toast("Failed to start co-hosting: "+(e.message||""),"❌");}
  };

  // ===== HOST: Invite viewer to co-host =====
  const inviteViewer = async(viewerId:string, viewerName:string)=>{
    setInviteSending(viewerId);
    try{
      await fetch("/api/live/invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:stream.id,inviteeId:viewerId})});
      toast(`Invite sent to ${viewerName}!`,"📩");
    }catch{toast("Failed to send invite","❌");}
    setTimeout(()=>setInviteSending(null),2000);
  };

  // ===== END STREAM =====
  const leave = async()=>{
    try{
      if(tracks.v){tracks.v.stop();tracks.v.close();}
      if(tracks.a){tracks.a.stop();tracks.a.close();}
      if(agoraClient) await agoraClient.leave();
      if(role==="host") await fetch("/api/live",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"end"})});
    }catch{}
    setAgoraClient(null);setTracks({a:null,v:null});setStream(null);setPage("list");
    setViewerCount(0);setRealViewers([]);setMsgs([]);setEnded(false);setTitle("");
    setRole("viewer");setInvited(false);setMyActiveStream(null);loadStreams();
    try{const r=await fetch("/api/coins");const d=await r.json();setCoins(d.coins||0);}catch{}
  };

  const toggleMic=async()=>{if(tracks.a){await tracks.a.setEnabled(muted);setMuted(!muted);}};
  const toggleCam=async()=>{if(tracks.v){await tracks.v.setEnabled(camOff);setCamOff(!camOff);}};

  const sendChat=async()=>{
    if(!chatText.trim()||!stream) return;
    const t=chatText.trim();setChatText("");
    try{
      await fetch("/api/live/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:stream.id,content:t})});
      const r=await fetch(`/api/live/chat?streamId=${stream.id}`);const d=await r.json();setMsgs(d.messages||[]);
    }catch{}
  };

  const sendGift=async(g:any)=>{
    if(coins<g.coins){toast("Not enough coins!","💰");setShowGifts(false);setTimeout(()=>router.push("/dashboard/coins"),1000);return;}
    try{
      const r=await fetch("/api/gifts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receiverId:stream.userId,giftType:g.name,amount:g.coins})});
      const d=await r.json();
      if(d.success){
        setCoins(c=>c-g.coins);toast(`Sent ${g.emoji} ${g.name}!`,g.emoji);setShowGifts(false);
        // Floating gift animation
        const anims = ["animate-gift-float","animate-gift-float-2","animate-gift-float-3"];
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const fid = Date.now() + Math.random();
            const x = 15 + Math.random() * 70;
            setFloatingGifts(p => [...p, { id: fid, emoji: g.emoji, anim: anims[i % 3], x }]);
            setTimeout(() => setFloatingGifts(p => p.filter(f => f.id !== fid)), 3200);
          }, i * 300);
        }
        // Update top gifters
        setTopGifters(prev => {
          const name = me?.name || "You";
          const photo = me?.profilePhoto || null;
          const exists = prev.find(p => p.name === name);
          if (exists) {
            return prev.map(p => p.name === name ? { ...p, total: p.total + g.coins } : p).sort((a,b) => b.total - a.total);
          }
          return [...prev, { name, photo, total: g.coins }].sort((a,b) => b.total - a.total).slice(0, 5);
        });
        await fetch("/api/live/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:stream.id,content:`🎁 sent ${g.emoji} ${g.name} (${g.coins} coins)`})});
        const r2=await fetch(`/api/live/chat?streamId=${stream.id}`);const d2=await r2.json();setMsgs(d2.messages||[]);
      }else{toast(d.error||"Gift failed","❌");}
    }catch{toast("Gift failed","❌");}
  };

  // ===== STREAM ENDED =====
  if(ended){
    return(
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-5"><Radio className="w-10 h-10 text-gray-400"/></div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Stream Ended</h2>
          <p className="text-gray-500 text-sm mb-6">The host has ended this live stream. Thanks for watching!</p>
          <button onClick={leave} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold hover:shadow-lg transition-all">Discover More Streams</button>
        </div>
      </div>
    );
  }

  // ===== LIST =====
  if(page==="list"){
    return(
      <div className="min-h-screen bg-gradient-to-b from-rose-50/30 to-white pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2"><Radio className="text-rose-500"/> Live Now</h1>
              <p className="text-gray-500 text-sm mt-1">{streams.length} stream{streams.length!==1?"s":""} active</p>
            </div>
            <button onClick={()=>setPage("setup")} className="px-5 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm shadow-lg shadow-rose-200 hover:shadow-xl transition-all flex items-center gap-2"><Video className="w-4 h-4"/> Go Live</button>
          </div>

          {/* Resume active stream banner */}
          {myActiveStream && (
            <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-2xl p-5 mb-6 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"/>
                  <div className="relative w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Radio className="w-5 h-5 text-white"/></div>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Your stream is still live!</p>
                  <p className="text-white/70 text-xs">{myActiveStream.title}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>rejoinAsHost(myActiveStream)} className="px-4 py-2 bg-white text-rose-600 rounded-full font-bold text-xs hover:shadow-lg transition-all">Rejoin</button>
                <button onClick={async()=>{await fetch("/api/live",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"end"})});setMyActiveStream(null);loadStreams();}} className="px-4 py-2 bg-white/20 text-white rounded-full font-bold text-xs hover:bg-white/30 border border-white/20">End</button>
              </div>
            </div>
          )}
          {loading?(
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"/></div>
          ):streams.length===0?(
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-4"><Radio className="w-10 h-10 text-rose-500"/></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Live Streams Yet</h3>
              <p className="text-gray-500 text-sm mb-6">Be the first to go live!</p>
              <button onClick={()=>setPage("setup")} className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm">Start Streaming</button>
            </div>
          ):(
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map(s=>(
                <button key={s.id} onClick={()=>{if(me?.id && s.userId===me.id){rejoinAsHost(s);}else{joinLive(s);}}} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group">
                  <div className="aspect-video bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500 relative overflow-hidden">
                    {s.host?.profilePhoto?<img src={s.host.profilePhoto} alt="" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"/>:<div className="w-full h-full flex items-center justify-center"><Radio className="w-16 h-16 text-white/30"/></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"/>
                    {/* Live pulse badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-40"/>
                        <div className="relative bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full"/> LIVE</div>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-lg text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10"><Eye className="w-3 h-3"/> {s.viewers||0}</div>
                    {/* Category badge */}
                    {s.category && <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-lg text-white text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/10">{s.category==="dating"?"💕":s.category==="music"?"🎵":s.category==="dance"?"💃":s.category==="gaming"?"🎮":s.category==="cooking"?"🍳":s.category==="fitness"?"💪":s.category==="talk"?"🎤":"💬"} {s.category.charAt(0).toUpperCase()+s.category.slice(1)}</div>}
                    {/* Viewer avatars */}
                    {(s.viewers||0) > 0 && (
                      <div className="absolute bottom-3 right-3 flex -space-x-1.5">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 border-2 border-black/30 flex items-center justify-center text-white text-[8px] font-bold" style={{opacity: 1 - i * 0.2}}/>
                        ))}
                        {(s.viewers||0) > 3 && <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur border-2 border-black/30 flex items-center justify-center text-white text-[8px] font-bold">+{(s.viewers||0)-3}</div>}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-gray-900 text-sm truncate group-hover:text-rose-600 transition-colors">{s.title}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-[8px] font-bold overflow-hidden flex-shrink-0">
                          {s.host?.profilePhoto ? <img src={s.host.profilePhoto} alt="" className="w-full h-full object-cover"/> : (s.host?.name?.[0] || "?")}
                        </div>
                        <p className="text-gray-500 text-xs flex items-center gap-1 truncate">{s.host?.verified&&<span className="text-blue-500 text-[10px]">✓</span>}{s.host?.name||"Host"}</p>
                      </div>
                      {s.host?.tier==="premium"&&<div className="bg-gradient-to-r from-amber-100 to-orange-100 px-2 py-0.5 rounded-full flex items-center gap-0.5"><Crown className="w-2.5 h-2.5 text-amber-500"/><span className="text-[9px] font-bold text-amber-700">PRO</span></div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== SETUP =====
  if(page==="setup"){
    return(
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-rose-100">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-2xl font-extrabold text-gray-900">Go Live</h2><p className="text-gray-500 text-sm mt-1">Broadcast to your audience</p></div>
            <button onClick={()=>setPage("list")} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
          </div>
          <div className="w-full aspect-video bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"/><div className="relative text-center"><Radio className="w-16 h-16 text-white mx-auto mb-2"/><p className="text-white font-bold text-lg">Ready to Stream</p></div>
          </div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Stream Title *</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What is your stream about?" maxLength={80} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 mb-2"/>
          <p className="text-xs text-gray-400 mb-5">{title.length}/80</p>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[{id:"chat",l:"Chat",e:"💬"},{id:"dating",l:"Dating",e:"💕"},{id:"music",l:"Music",e:"🎵"},{id:"dance",l:"Dance",e:"💃"},{id:"talk",l:"Talk",e:"🎤"},{id:"gaming",l:"Gaming",e:"🎮"},{id:"cooking",l:"Cooking",e:"🍳"},{id:"fitness",l:"Fitness",e:"💪"}].map(c=>(
              <button key={c.id} onClick={()=>setCategory(c.id)} className={"p-3 rounded-xl text-center transition-all "+(category===c.id?"bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg":"bg-gray-50 hover:bg-gray-100 text-gray-600")}><p className="text-xl mb-1">{c.e}</p><p className="text-xs font-medium">{c.l}</p></button>
            ))}
          </div>
          {err&&<div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-200">{err}</div>}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-xs text-amber-900 font-medium mb-1">📹 Camera and Microphone Required</p>
            <p className="text-xs text-amber-700">Allow camera and mic access when prompted.</p>
          </div>
          <button onClick={goLive} disabled={!title.trim()} className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full font-bold text-base disabled:opacity-50 hover:shadow-xl transition-all flex items-center justify-center gap-2"><Radio className="w-5 h-5"/> Start Streaming</button>
        </div>
      </div>
    );
  }

  // ===== LIVE =====
  return(
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex-1 relative overflow-hidden bg-gray-900">
        {/* Host self-view */}
        {role==="host"&&<div id="host-video" style={{width:"100%",height:"100%",position:"absolute",top:0,left:0,background:"#111"}}/>}
        {/* Co-host video (shown alongside host) */}
        {role==="host"&&<div id="cohost-video" style={{width:"120px",height:"160px",position:"absolute",bottom:"140px",right:"12px",borderRadius:"16px",overflow:"hidden",border:"3px solid rgba(255,255,255,0.3)",zIndex:15,background:"#222"}}/>}
        {/* Viewer sees host */}
        {role==="viewer"&&<div id="viewer-video" style={{width:"100%",height:"100%",position:"absolute",top:0,left:0,background:"#111"}}/>}
        {/* Co-host sees host + own small preview */}
        {role==="cohost"&&(
          <>
            <div id="viewer-video" style={{width:"100%",height:"100%",position:"absolute",top:0,left:0,background:"#111"}}/>
            <div id="cohost-self-video" style={{width:"120px",height:"160px",position:"absolute",bottom:"140px",right:"12px",borderRadius:"16px",overflow:"hidden",border:"3px solid rgba(255,255,255,0.3)",zIndex:15,background:"#222"}}/>
          </>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><span className="w-2 h-2 bg-white rounded-full animate-pulse"/> LIVE</div>
                <button onClick={()=>setShowViewerList(true)} className="bg-black/40 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-black/60"><Eye className="w-3 h-3"/> {viewerCount} viewer{viewerCount!==1?"s":""}</button>
                {role==="cohost"&&<div className="bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">🎤 Co-hosting</div>}
              </div>
              <p className="text-white font-bold text-lg drop-shadow-lg line-clamp-1">{stream?.title||title}</p>
              {role!=="host"&&stream?.host&&<p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">{stream.host.verified&&<span className="text-blue-400">✓</span>}{stream.host.name||"Host"}</p>}
            </div>
            <button onClick={leave} className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center ml-3 flex-shrink-0"><X className="w-5 h-5"/></button>
          </div>
        </div>

        {/* Toasts */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 space-y-2 pointer-events-none z-30 w-[90%] max-w-md">
          {toasts.map(t=>(<div key={t.id} className="bg-gradient-to-r from-rose-500/95 to-pink-500/95 backdrop-blur-lg text-white text-sm px-5 py-3 rounded-full flex items-center justify-center gap-2 shadow-2xl"><span className="text-lg">{t.emoji}</span><span className="font-semibold">{t.text}</span></div>))}
        </div>

        {/* Floating gift emojis */}
        <div className="absolute bottom-32 left-0 right-0 pointer-events-none z-20">
          {floatingGifts.map(fg => (
            <div key={fg.id} className={fg.anim} style={{ position: "absolute", bottom: 0, left: fg.x + "%", fontSize: "48px", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>
              {fg.emoji}
            </div>
          ))}
        </div>

        {/* Top Gifter leaderboard button */}
        {topGifters.length > 0 && (
          <button onClick={() => setShowLeaderboard(true)} className="absolute top-20 right-3 z-20 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-lg text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg hover:scale-105 transition-all border border-amber-400/30">
            <Crown className="w-4 h-4" />
            <div className="text-left">
              <p className="text-[10px] font-bold leading-none">Top Gifter</p>
              <p className="text-[10px] opacity-80 leading-none mt-0.5">{topGifters[0]?.name}</p>
            </div>
          </button>
        )}

        {/* Co-host invite popup for viewer */}
        {invited&&role==="viewer"&&(
          <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4"><Phone className="w-8 h-8 text-white"/></div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Co-Host Invite!</h3>
              <p className="text-gray-500 text-sm mb-6">The host wants you to join the live stream together! Your camera and mic will turn on.</p>
              <div className="flex gap-3">
                <button onClick={()=>setInvited(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-bold text-sm">Decline</button>
                <button onClick={acceptInvite} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-sm shadow-lg">Accept</button>
              </div>
            </div>
          </div>
        )}

        {/* Chat overlay */}
        <div className="absolute left-3 right-3 bottom-4 max-h-[35vh] overflow-y-auto scrollbar-hide z-10">
          <div className="space-y-1.5">
            {msgs.slice(-20).map((m:any)=>(
              <div key={m.id} className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
                  {m.user?.profilePhoto?<img src={m.user.profilePhoto} alt="" className="w-full h-full object-cover"/>:(m.user?.name?.[0]||"?")}
                </div>
                <div className={"backdrop-blur-md rounded-2xl px-3 py-1.5 max-w-[75%] "+(m.content.includes("🎁")?"bg-gradient-to-r from-amber-500/50 to-orange-500/40 border border-amber-400/30":"bg-black/50")}>
                  <span className="text-white/80 text-[11px] font-semibold mr-1.5">{m.user?.name||"User"}</span>
                  <span className="text-white text-sm break-words">{m.content}</span>
                </div>
              </div>
            ))}
            <div ref={chatEnd}/>
          </div>
        </div>

        {err&&<div className="absolute top-24 left-4 right-4 bg-red-500 text-white p-3 rounded-xl text-sm z-20">{err}</div>}
      </div>

      {/* Controls */}
      <div className="bg-black/95 p-3 pb-6 z-10">
        <div className="flex items-center gap-2 mb-2">
          <input value={chatText} onChange={e=>setChatText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Say something..." className="flex-1 px-4 py-3 bg-white/10 text-white placeholder:text-white/40 rounded-full outline-none text-sm border border-white/10 focus:border-rose-500/50"/>
          <button onClick={sendChat} className="w-11 h-11 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full flex items-center justify-center flex-shrink-0"><Send className="w-4 h-4"/></button>
          {role!=="host"&&<button onClick={()=>setShowGifts(true)} className="w-11 h-11 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0"><Gift className="w-5 h-5"/></button>}
        </div>
        {(role==="host"||role==="cohost")&&(
          <div className="flex items-center justify-center gap-2">
            <button onClick={toggleMic} className={"w-11 h-11 rounded-full flex items-center justify-center "+(muted?"bg-red-500 text-white":"bg-white/10 text-white hover:bg-white/20")}>{muted?<MicOff className="w-5 h-5"/>:<Mic className="w-5 h-5"/>}</button>
            <button onClick={toggleCam} className={"w-11 h-11 rounded-full flex items-center justify-center "+(camOff?"bg-red-500 text-white":"bg-white/10 text-white hover:bg-white/20")}>{camOff?<VideoOff className="w-5 h-5"/>:<Video className="w-5 h-5"/>}</button>
            {role==="host"&&<button onClick={()=>setShowViewerList(true)} className="w-11 h-11 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20"><Users className="w-5 h-5"/></button>}
            <button onClick={leave} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-sm">{role==="host"?"End Stream":"Leave"}</button>
          </div>
        )}
      </div>

      {/* Gift modal */}
      {showGifts&&(
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center" onClick={()=>setShowGifts(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
              <div><h3 className="font-bold text-gray-900 flex items-center gap-2"><Gift className="w-5 h-5 text-amber-500"/> Send a Gift</h3><p className="text-xs text-gray-500 mt-0.5">80% goes to the host</p></div>
              <div className="flex items-center gap-2"><div className="bg-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1.5"><span className="text-amber-600">🪙</span><span className="font-bold text-amber-900 text-sm">{coins}</span></div><button onClick={()=>setShowGifts(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button></div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {GIFTS.map(g=>(<button key={g.id} onClick={()=>sendGift(g)} disabled={coins<g.coins} className={"aspect-square rounded-2xl flex flex-col items-center justify-center transition-all "+(coins<g.coins?"bg-gray-50 opacity-50":"bg-gradient-to-br from-amber-50 to-orange-50 hover:scale-105 border border-amber-100")}><span className="text-3xl mb-1">{g.emoji}</span><span className="text-[10px] font-bold text-gray-700">{g.name}</span><span className="text-[10px] text-amber-600 font-semibold">🪙 {g.coins}</span></button>))}
              </div>
              <Link href="/dashboard/coins" onClick={()=>setShowGifts(false)} className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2"><ShoppingCart className="w-4 h-4"/> Buy More Coins</Link>
            </div>
          </div>
        </div>
      )}

      {/* Top Gifter Leaderboard */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center" onClick={() => setShowLeaderboard(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)",backgroundSize:"16px 16px"}} />
              <div className="relative">
                <Crown className="w-10 h-10 text-white mx-auto mb-2" />
                <h3 className="text-xl font-extrabold text-white">Top Gifters</h3>
                <p className="text-amber-100 text-xs mt-1">Most generous supporters this stream</p>
              </div>
            </div>
            <div className="p-5">
              {topGifters.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No gifts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topGifters.map((g, i) => (
                    <div key={i} className={"flex items-center gap-3 p-3 rounded-xl " + (i === 0 ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200" : i === 1 ? "bg-gray-50 border border-gray-100" : "bg-gray-50/50")}>
                      <div className={"w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 " + (i === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200" : i === 1 ? "bg-gradient-to-br from-gray-400 to-gray-500" : "bg-gradient-to-br from-amber-600 to-amber-700")}>
                        {i + 1}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                        {g.photo ? <img src={g.photo} alt="" className="w-full h-full object-cover" /> : g.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{g.name}</p>
                        <p className="text-xs text-gray-500">{i === 0 ? "👑 Top Gifter" : i === 1 ? "🥈 2nd Place" : "🥉 " + (i + 1) + "th Place"}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500">🪙</span>
                        <span className="font-bold text-amber-600 text-sm">{g.total.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setShowLeaderboard(false)} className="w-full py-3 bg-gray-100 text-gray-700 rounded-full font-bold text-sm hover:bg-gray-200 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Viewers modal with REAL names and invite */}
      {showViewerList&&(
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center" onClick={()=>setShowViewerList(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-rose-500"/> Viewers</h3>
                <p className="text-gray-500 text-xs mt-0.5">{viewerCount} active viewer{viewerCount!==1?"s":""}</p>
              </div>
              <button onClick={()=>setShowViewerList(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {realViewers.length===0?(
                <div className="text-center py-8"><div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3"><Users className="w-8 h-8 text-gray-400"/></div><p className="text-gray-500 text-sm">No viewers yet</p><p className="text-gray-400 text-xs mt-1">Share your stream to get viewers!</p></div>
              ):(
                <div className="space-y-2">
                  {realViewers.map((v:any)=>(
                    <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                          {v.profilePhoto?<img src={v.profilePhoto} alt="" className="w-full h-full object-cover"/>:(v.name?.[0]||"?")}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                            {v.name||"User"}
                            {v.verified&&<span className="text-blue-500 text-xs">✓</span>}
                            {v.tier==="premium"&&<Crown className="w-3 h-3 text-amber-500"/>}
                          </p>
                          <p className="text-xs text-gray-500">Watching now</p>
                        </div>
                      </div>
                      {role==="host"&&(
                        <button
                          onClick={()=>inviteViewer(v.id,v.name||"User")}
                          disabled={inviteSending===v.id}
                          className={"px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all "+(inviteSending===v.id?"bg-green-100 text-green-600":"bg-rose-100 text-rose-600 hover:bg-rose-200")}
                        >
                          {inviteSending===v.id?<><Check className="w-3 h-3"/>Sent</>:<><UserPlus className="w-3 h-3"/>Invite to Co-Host</>}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
