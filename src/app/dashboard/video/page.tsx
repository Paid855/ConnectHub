"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, Users, Radio, X, Gift, Send, Mic, MicOff, VideoOff, Eye, Crown, UserPlus, ShoppingCart } from "lucide-react";

const GIFTS = [
  { id:"rose",name:"Rose",emoji:"🌹",coins:10 },
  { id:"heart",name:"Heart",emoji:"💖",coins:25 },
  { id:"kiss",name:"Kiss",emoji:"💋",coins:50 },
  { id:"diamond",name:"Diamond",emoji:"💎",coins:100 },
  { id:"crown",name:"Crown",emoji:"👑",coins:250 },
  { id:"rocket",name:"Rocket",emoji:"🚀",coins:500 },
  { id:"ring",name:"Ring",emoji:"💍",coins:1000 },
  { id:"castle",name:"Castle",emoji:"🏰",coins:2500 },
];

export default function LiveStreamPage() {
  const router = useRouter();
  const [page, setPage] = useState<"list"|"setup"|"live">("list");
  const [role, setRole] = useState<"host"|"viewer">("viewer");
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("chat");
  const [stream, setStream] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState<any[]>([]);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [client, setClient] = useState<any>(null);
  const [tracks, setTracks] = useState<{a:any,v:any}>({a:null,v:null});
  const [err, setErr] = useState("");
  const [ended, setEnded] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [coins, setCoins] = useState(0);
  const [toasts, setToasts] = useState<{id:number,text:string,emoji:string}[]>([]);
  const [showViewerList, setShowViewerList] = useState(false);
  const [me, setMe] = useState<any>(null);

  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  const toast = useCallback((text:string, emoji="💬") => {
    const id = Date.now()+Math.random();
    setToasts(t=>[...t,{id,text,emoji}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000);
  },[]);

  // Load streams list
  const loadStreams = useCallback(async()=>{
    try{ const r=await fetch("/api/live"); const d=await r.json(); setStreams(d.streams||[]); }catch{}
    setLoading(false);
  },[]);

  // Load my info + coins
  useEffect(()=>{
    (async()=>{
      try{ const r=await fetch("/api/auth/me"); const d=await r.json(); setMe(d.user); }catch{}
      try{ const r=await fetch("/api/coins"); const d=await r.json(); setCoins(d.coins||0); }catch{}
    })();
    loadStreams();
  },[loadStreams]);

  // Refresh stream list every 10s on list page
  useEffect(()=>{
    if(page!=="list") return;
    const i=setInterval(loadStreams,10000);
    return()=>clearInterval(i);
  },[page,loadStreams]);

  // Auto-refresh chat every 2s during live
  useEffect(()=>{
    if(page!=="live"||!stream) return;
    const loadMsgs = async()=>{
      try{ const r=await fetch(`/api/live/chat?streamId=${stream.id}`); const d=await r.json(); setMsgs(d.messages||[]); }catch{}
    };
    loadMsgs();
    const i=setInterval(loadMsgs,2000);
    return()=>clearInterval(i);
  },[page,stream]);

  // Auto-scroll chat
  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  // ===== HOST: Start broadcasting =====
  const goLive = async()=>{
    if(!title.trim()){ setErr("Enter a stream title"); return; }
    setErr("");
    try {
      // 1. Create stream in DB
      const cr = await fetch("/api/live",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start",title})});
      const {stream:s} = await cr.json();
      setStream(s);
      setRole("host");

      // 2. Init Agora
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(4);
      const c = AgoraRTC.createClient({mode:"live",codec:"vp8"});
      await c.setClientRole("host");

      // 3. Get token
      const ch = `stream_${s.id}`;
      const tk = await fetch("/api/agora",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({channelName:ch,isHost:true})}).then(r=>r.json());

      // 4. Join channel
      await c.join(tk.appId, ch, tk.token, tk.uid);

      // 5. Create camera + mic
      const [at, vt] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { encoderConfig: "high_quality" },
        { encoderConfig: "720p_2" }
      );
      setTracks({a:at,v:vt});

      // 6. Publish
      await c.publish([at, vt]);

      // 7. Viewer events
      c.on("user-joined", ()=>{
        setViewerCount(n=>n+1);
        setViewers(v=>[...v,{uid:Date.now(),t:Date.now()}]);
        toast("A new viewer joined!","👋");
      });
      c.on("user-left", ()=>{
        setViewerCount(n=>Math.max(0,n-1));
      });

      setClient(c);
      setPage("live");
      toast("You are now live!","🔴");

      // 8. Play local video AFTER state updates (next tick)
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          const el = document.getElementById("host-video");
          if(el && vt) {
            vt.play(el, {fit:"cover",mirror:true});
            console.log("[Agora] Host video playing in element", el);
          } else {
            console.error("[Agora] Host element not found or no track", !!el, !!vt);
          }
        });
      });

    } catch(e:any){
      console.error("Go live error:",e);
      setErr("Failed: "+(e.message||"Unknown error. Make sure camera is allowed."));
    }
  };

  // ===== VIEWER: Join stream =====
  const joinLive = async(s:any)=>{
    setStream(s);
    setRole("viewer");
    setErr("");
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(4);
      const c = AgoraRTC.createClient({mode:"live",codec:"vp8"});
      await c.setClientRole("audience");

      const ch = `stream_${s.id}`;
      const tk = await fetch("/api/agora",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({channelName:ch,isHost:false})}).then(r=>r.json());

      // When host publishes video/audio
      c.on("user-published", async(user:any, type:any)=>{
        await c.subscribe(user, type);
        if(type==="video"){
          const playRemote = ()=>{
            const el = document.getElementById("viewer-video");
            if(el && user.videoTrack){
              user.videoTrack.play(el, {fit:"cover"});
              console.log("[Agora] Remote video playing");
              return true;
            }
            return false;
          };
          if(!playRemote()){
            let tries=0;
            const iv = setInterval(()=>{
              tries++;
              if(playRemote()||tries>30) clearInterval(iv);
            },200);
          }
        }
        if(type==="audio") user.audioTrack?.play();
      });

      // Host left = stream ended
      c.on("user-left", ()=>{
        setTimeout(async()=>{
          try{
            const r=await fetch("/api/live"); const d=await r.json();
            if(!d.streams?.find((x:any)=>x.id===s.id)) setEnded(true);
          }catch{}
        },1000);
      });

      await c.join(tk.appId, ch, tk.token, tk.uid);
      setClient(c);
      setPage("live");
      toast(`Joined ${s.host?.name||"the host"}'s stream`,"🎉");

      // Post join message to chat
      try{
        await fetch("/api/live/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:s.id,content:"👋 joined the stream"})});
      }catch{}

    } catch(e:any){
      console.error("Join error:",e);
      setErr("Failed to join: "+(e.message||"Unknown error"));
    }
  };

  // ===== END STREAM =====
  const leave = async()=>{
    try{
      if(tracks.v){tracks.v.stop();tracks.v.close();}
      if(tracks.a){tracks.a.stop();tracks.a.close();}
      if(client) await client.leave();
      if(role==="host"){
        await fetch("/api/live",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"end"})});
      }
    }catch{}
    setClient(null);setTracks({a:null,v:null});setStream(null);setPage("list");
    setViewerCount(0);setViewers([]);setMsgs([]);setEnded(false);setTitle("");
    setRole("viewer");loadStreams();
    try{ const r=await fetch("/api/coins"); const d=await r.json(); setCoins(d.coins||0); }catch{}
  };

  // Toggle mic/cam
  const toggleMic = async()=>{ if(tracks.a){await tracks.a.setEnabled(muted);setMuted(!muted);} };
  const toggleCam = async()=>{ if(tracks.v){await tracks.v.setEnabled(camOff);setCamOff(!camOff);} };

  // Send chat
  const sendChat = async()=>{
    if(!chatText.trim()||!stream) return;
    const t=chatText.trim(); setChatText("");
    try{
      await fetch("/api/live/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:stream.id,content:t})});
      const r=await fetch(`/api/live/chat?streamId=${stream.id}`); const d=await r.json(); setMsgs(d.messages||[]);
    }catch{}
  };

  // Send gift
  const sendGift = async(g:any)=>{
    if(coins<g.coins){ toast("Not enough coins!","💰"); setShowGifts(false); setTimeout(()=>router.push("/dashboard/coins"),1000); return; }
    try{
      const r=await fetch("/api/gifts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receiverId:stream.userId,giftType:g.name,amount:g.coins})});
      const d=await r.json();
      if(d.success){
        setCoins(c=>c-g.coins); toast(`Sent ${g.emoji} ${g.name}!`,g.emoji); setShowGifts(false);
        await fetch("/api/live/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:stream.id,content:`🎁 sent ${g.emoji} ${g.name} (${g.coins} coins)`})});
        const r2=await fetch(`/api/live/chat?streamId=${stream.id}`); const d2=await r2.json(); setMsgs(d2.messages||[]);
      } else { toast(d.error||"Gift failed","❌"); }
    }catch{ toast("Gift failed","❌"); }
  };

  // ==================== STREAM ENDED ====================
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

  // ==================== LIST PAGE ====================
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
                <button key={s.id} onClick={()=>joinLive(s)} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                  <div className="aspect-video bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500 relative overflow-hidden">
                    {s.host?.profilePhoto?(<img src={s.host.profilePhoto} alt="" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"/>):(<div className="w-full h-full flex items-center justify-center text-6xl">👤</div>)}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/> LIVE</div>
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"><Eye className="w-3 h-3"/> {s.viewers||0}</div>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-gray-900 text-sm truncate">{s.title}</p>
                    <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">{s.host?.verified&&<span className="text-blue-500">✓</span>}{s.host?.name||"Host"}{s.host?.tier==="premium"&&<Crown className="w-3 h-3 text-amber-500"/>}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== SETUP PAGE ====================
  if(page==="setup"){
    return(
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-rose-100">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-2xl font-extrabold text-gray-900">Go Live</h2><p className="text-gray-500 text-sm mt-1">Broadcast to your audience</p></div>
            <button onClick={()=>setPage("list")} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
          </div>
          <div className="w-full aspect-video bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"/>
            <div className="relative text-center"><Radio className="w-16 h-16 text-white mx-auto mb-2"/><p className="text-white font-bold text-lg">Ready to Stream</p><p className="text-white/80 text-xs">Your audience is waiting</p></div>
          </div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Stream Title *</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What is your stream about?" maxLength={80} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 mb-2"/>
          <p className="text-xs text-gray-400 mb-5">{title.length}/80</p>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[{id:"chat",l:"Chat",e:"💬"},{id:"music",l:"Music",e:"🎵"},{id:"dance",l:"Dance",e:"💃"},{id:"talk",l:"Talk",e:"🎤"}].map(c=>(
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

  // ==================== LIVE PAGE ====================
  return(
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* VIDEO */}
      <div className="flex-1 relative overflow-hidden bg-gray-900">
        {/* HOST sees own camera */}
        {role==="host" && <div id="host-video" style={{width:"100%",height:"100%",position:"absolute",top:0,left:0,background:"#111"}}/>}
        {/* VIEWER sees remote */}
        {role==="viewer" && <div id="viewer-video" style={{width:"100%",height:"100%",position:"absolute",top:0,left:0,background:"#111"}}/>}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><span className="w-2 h-2 bg-white rounded-full animate-pulse"/> LIVE</div>
                <button onClick={()=>setShowViewerList(true)} className="bg-black/40 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-black/60"><Eye className="w-3 h-3"/> {viewerCount}</button>
              </div>
              <p className="text-white font-bold text-lg drop-shadow-lg line-clamp-1">{stream?.title||title}</p>
              {role==="viewer"&&stream?.host&&(
                <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">{stream.host.verified&&<span className="text-blue-400">✓</span>}{stream.host.name||"Host"}</p>
              )}
            </div>
            <button onClick={leave} className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center ml-3 flex-shrink-0"><X className="w-5 h-5"/></button>
          </div>
        </div>

        {/* Toasts */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 space-y-2 pointer-events-none z-30 w-[90%] max-w-md">
          {toasts.map(t=>(
            <div key={t.id} className="bg-gradient-to-r from-rose-500/95 to-pink-500/95 backdrop-blur-lg text-white text-sm px-5 py-3 rounded-full flex items-center justify-center gap-2 shadow-2xl"><span className="text-lg">{t.emoji}</span><span className="font-semibold">{t.text}</span></div>
          ))}
        </div>

        {/* Chat overlay */}
        <div className="absolute left-3 right-3 bottom-4 max-h-[40vh] overflow-y-auto scrollbar-hide z-10">
          <div className="space-y-1.5">
            {msgs.slice(-20).map((m:any)=>(
              <div key={m.id} className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
                  {m.user?.profilePhoto?<img src={m.user.profilePhoto} alt="" className="w-full h-full object-cover"/>:(m.user?.name?.[0]||"?")}
                </div>
                <div className="bg-black/50 backdrop-blur-md rounded-2xl px-3 py-1.5 max-w-[75%]">
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

      {/* CONTROLS */}
      <div className="bg-black/95 p-3 pb-6 z-10">
        {/* Chat input for EVERYONE */}
        <div className="flex items-center gap-2 mb-2">
          <input value={chatText} onChange={e=>setChatText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Say something..." className="flex-1 px-4 py-3 bg-white/10 text-white placeholder:text-white/40 rounded-full outline-none text-sm border border-white/10 focus:border-rose-500/50"/>
          <button onClick={sendChat} className="w-11 h-11 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full flex items-center justify-center flex-shrink-0"><Send className="w-4 h-4"/></button>
          {role==="viewer"&&<button onClick={()=>setShowGifts(true)} className="w-11 h-11 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0"><Gift className="w-5 h-5"/></button>}
        </div>
        {/* Host controls */}
        {role==="host"&&(
          <div className="flex items-center justify-center gap-2">
            <button onClick={toggleMic} className={"w-11 h-11 rounded-full flex items-center justify-center "+(muted?"bg-red-500 text-white":"bg-white/10 text-white hover:bg-white/20")}>{muted?<MicOff className="w-5 h-5"/>:<Mic className="w-5 h-5"/>}</button>
            <button onClick={toggleCam} className={"w-11 h-11 rounded-full flex items-center justify-center "+(camOff?"bg-red-500 text-white":"bg-white/10 text-white hover:bg-white/20")}>{camOff?<VideoOff className="w-5 h-5"/>:<Video className="w-5 h-5"/>}</button>
            <button onClick={()=>setShowViewerList(true)} className="w-11 h-11 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20"><Users className="w-5 h-5"/></button>
            <button onClick={leave} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-sm">End Stream</button>
          </div>
        )}
      </div>

      {/* GIFT MODAL */}
      {showGifts&&(
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center" onClick={()=>setShowGifts(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
              <div><h3 className="font-bold text-gray-900 flex items-center gap-2"><Gift className="w-5 h-5 text-amber-500"/> Send a Gift</h3><p className="text-xs text-gray-500 mt-0.5">80% goes to the host</p></div>
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1.5"><span className="text-amber-600">🪙</span><span className="font-bold text-amber-900 text-sm">{coins}</span></div>
                <button onClick={()=>setShowGifts(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {GIFTS.map(g=>(
                  <button key={g.id} onClick={()=>sendGift(g)} disabled={coins<g.coins} className={"aspect-square rounded-2xl flex flex-col items-center justify-center transition-all "+(coins<g.coins?"bg-gray-50 opacity-50":"bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 hover:scale-105 border border-amber-100")}>
                    <span className="text-3xl mb-1">{g.emoji}</span><span className="text-[10px] font-bold text-gray-700">{g.name}</span><span className="text-[10px] text-amber-600 font-semibold">🪙 {g.coins}</span>
                  </button>
                ))}
              </div>
              <Link href="/dashboard/coins" onClick={()=>setShowGifts(false)} className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg"><ShoppingCart className="w-4 h-4"/> Buy More Coins</Link>
            </div>
          </div>
        </div>
      )}

      {/* VIEWERS MODAL */}
      {showViewerList&&(
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center" onClick={()=>setShowViewerList(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-rose-500"/> Viewers ({viewerCount})</h3>
              <button onClick={()=>setShowViewerList(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {viewers.length===0?(
                <div className="text-center py-8"><div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3"><Users className="w-8 h-8 text-gray-400"/></div><p className="text-gray-500 text-sm">No viewers yet</p><p className="text-gray-400 text-xs mt-1">Share your stream to get viewers!</p></div>
              ):(
                <div className="space-y-2">
                  {viewers.map((v:any,i:number)=>(
                    <div key={v.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold">V</div>
                        <div><p className="font-semibold text-gray-900 text-sm">Viewer #{i+1}</p><p className="text-xs text-gray-500">Watching now</p></div>
                      </div>
                      {role==="host"&&<button onClick={()=>toast("Invite sent! (co-host coming soon)","📩")} className="px-3 py-1.5 bg-rose-100 text-rose-600 rounded-full text-xs font-bold flex items-center gap-1"><UserPlus className="w-3 h-3"/> Invite</button>}
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
