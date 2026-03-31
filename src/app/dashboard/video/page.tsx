"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Camera, Users, Shield, Send, Gift, Coins, X, ArrowLeft, Crown, Heart, Star } from "lucide-react";
import Link from "next/link";

const GIFTS = [
  { id:"rose", emoji:"🌹", name:"Rose", cost:10 },
  { id:"heart", emoji:"❤️", name:"Heart", cost:25 },
  { id:"diamond", emoji:"💎", name:"Diamond", cost:100 },
  { id:"crown", emoji:"👑", name:"Crown", cost:500 },
  { id:"rocket", emoji:"🚀", name:"Rocket", cost:1000 },
];

export default function VideoPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const [tab, setTab] = useState<"call"|"live"|"watch">("call");
  const [friends, setFriends] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/friends").then(r=>r.json()).then(d=> {
        const list = (d.friends||[]).map((f:any)=>f.user).filter(Boolean);
        setFriends(list);
      }),
      fetch("/api/live").then(r=>r.json()).then(d=>setStreams(d.streams||[]))
    ]).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className={"text-2xl font-bold mb-5 " + (dc?"text-white":"text-gray-900")}>Video</h1>
      <div className={"flex gap-1 mb-5 rounded-xl p-1 " + (dc?"bg-gray-800":"bg-gray-100")}>
        {[{k:"call",l:"Video Call",i:Video},{k:"live",l:"Go Live",i:Camera},{k:"watch",l:"Watch ("+streams.length+")",i:Users}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all "+(tab===t.k?(dc?"bg-gray-700 text-white":"bg-white text-gray-900 shadow-sm"):(dc?"text-gray-500":"text-gray-500"))}><t.i className="w-4 h-4"/>{t.l}</button>
        ))}
      </div>

      {tab === "call" && <VideoCallSection friends={friends} user={user} dc={dc} loading={loading} />}
      {tab === "live" && <LiveStreamSection user={user} dc={dc} reload={reload} />}
      {tab === "watch" && <WatchSection streams={streams} user={user} dc={dc} reload={reload} />}
    </div>
  );
}

function VideoCallSection({ friends, user, dc, loading }: any) {
  const [callState, setCallState] = useState<"idle"|"ringing"|"connected">("idle");
  const [callUser, setCallUser] = useState<any>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const localRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (callState === "connected") {
      const i = setInterval(() => setSeconds(s => s + 1), 1000);
      return () => clearInterval(i);
    } else { setSeconds(0); }
  }, [callState]);

  const startCall = async (friend: any) => {
    setCallUser(friend); setCallState("ringing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localRef.current) { localRef.current.srcObject = stream; localRef.current.play().catch(()=>{}); }
      setTimeout(() => setCallState("connected"), 3000);
    } catch { alert("Please allow camera and microphone access to make video calls"); setCallState("idle"); }
  };

  const endCall = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current = null; }
    setCallState("idle"); setCallUser(null); setMuted(false); setCamOff(false);
  };

  const toggleMic = () => { if(streamRef.current) { streamRef.current.getAudioTracks().forEach(t=>{t.enabled=!t.enabled}); setMuted(!muted); } };
  const toggleCam = () => { if(streamRef.current) { streamRef.current.getVideoTracks().forEach(t=>{t.enabled=!t.enabled}); setCamOff(!camOff); } };
  const isOnline = (d:string|null) => d ? Date.now()-new Date(d).getTime()<300000 : false;
  const fmt = (s:number) => Math.floor(s/60).toString().padStart(2,"0")+":"+String(s%60).padStart(2,"0");

  if (callState !== "idle") {
    return (
      <div>
        <div className="rounded-2xl overflow-hidden bg-gray-900 relative" style={{height:"65vh",maxHeight:"550px"}}>
          {callState === "ringing" ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {callUser?.profilePhoto ? <img src={callUser.profilePhoto} className="w-28 h-28 rounded-full object-cover mb-4 animate-pulse border-4 border-white/20"/> : <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-4xl font-bold mb-4 animate-pulse">{callUser?.name?.[0]}</div>}
              <p className="text-white text-xl font-bold">{callUser?.name}</p>
              <p className="text-gray-400 text-sm mt-2">Ringing...</p>
              <div className="flex gap-1.5 mt-4">{[0,1,2].map(i=><div key={i} className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:i*150+"ms"}}/>)}</div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {callUser?.profilePhoto ? <img src={callUser.profilePhoto} className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-white/20"/> : <div className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-5xl font-bold mb-4">{callUser?.name?.[0]}</div>}
              <p className="text-white text-xl font-bold">{callUser?.name}</p>
              <p className="text-emerald-400 text-sm mt-1 flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>Connected</p>
            </div>
          )}
          {/* Local camera preview */}
          <div className="absolute top-4 right-4 w-28 h-36 sm:w-32 sm:h-44 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
            <video ref={localRef} className="w-full h-full object-cover" muted playsInline style={{transform:"scaleX(-1)"}}/>
            {camOff && <div className="absolute inset-0 bg-gray-800 flex items-center justify-center"><VideoOff className="w-6 h-6 text-gray-400"/></div>}
          </div>
          {callState==="connected" && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-1.5 rounded-full font-mono">{fmt(seconds)}</div>}
        </div>
        <div className={"flex items-center justify-center gap-5 py-6 " + (dc?"bg-gray-800":"bg-white")}>
          <button onClick={toggleMic} className={"w-14 h-14 rounded-full flex items-center justify-center text-lg "+(muted?"bg-red-500 text-white":"bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white")}>{muted?<MicOff className="w-6 h-6"/>:<Mic className="w-6 h-6"/>}</button>
          <button onClick={toggleCam} className={"w-14 h-14 rounded-full flex items-center justify-center "+(camOff?"bg-red-500 text-white":"bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white")}>{camOff?<VideoOff className="w-6 h-6"/>:<Video className="w-6 h-6"/>}</button>
          <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg"><PhoneOff className="w-7 h-7"/></button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={"rounded-2xl border p-6 mb-5 text-center "+(dc?"bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/20":"bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200")}>
        <Video className={"w-10 h-10 mx-auto mb-3 "+(dc?"text-rose-400":"text-rose-500")}/>
        <h3 className={"font-bold mb-1 "+(dc?"text-white":"text-gray-900")}>Video Call Your Friends</h3>
        <p className={"text-sm "+(dc?"text-gray-400":"text-gray-500")}>Face-to-face with your matches</p>
      </div>
      {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"/></div> :
      friends.length===0 ? (
        <div className={"text-center py-12 rounded-2xl border "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Users className={"w-12 h-12 mx-auto mb-3 "+(dc?"text-gray-600":"text-gray-300")}/>
          <p className={"font-bold mb-1 "+(dc?"text-white":"text-gray-900")}>No friends to call</p>
          <Link href="/dashboard" className="mt-4 inline-block px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold">Discover People</Link>
        </div>
      ) : (
        <div className="space-y-2">{friends.map((f:any)=>(
          <div key={f.id} className={"flex items-center gap-3 p-4 rounded-xl border "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
            <div className="relative">{f.profilePhoto?<img src={f.profilePhoto} className="w-12 h-12 rounded-full object-cover"/>:<div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{f.name?.[0]}</div>}{isOnline(f.lastSeen)&&<div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"/>}</div>
            <div className="flex-1"><p className={"font-bold text-sm "+(dc?"text-white":"text-gray-900")}>{f.name}</p><p className={"text-xs "+(isOnline(f.lastSeen)?"text-emerald-500":"text-gray-400")}>{isOnline(f.lastSeen)?"Online":"Offline"}</p></div>
            <div className="flex gap-2">
              <button onClick={()=>startCall(f)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg"><Video className="w-4 h-4"/>Video</button>
              <button onClick={()=>startCall(f)} className={"px-3 py-2.5 rounded-xl border text-sm font-semibold "+(dc?"border-gray-600 text-gray-300":"border-gray-200 text-gray-600")}><Phone className="w-4 h-4"/></button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

function LiveStreamSection({ user, dc, reload }: any) {
  const [streaming, setStreaming] = useState(false);
  const [title, setTitle] = useState("");
  const [viewers, setViewers] = useState(0);
  const [chat, setChat] = useState<any[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const [totalCoins, setTotalCoins] = useState(0);
  const localRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [chat]);

  const startStream = async () => {
    if (!title.trim()) { alert("Enter a stream title"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}}, audio:true });
      streamRef.current = stream;
      if (localRef.current) { localRef.current.srcObject = stream; localRef.current.play().catch(()=>{}); }
      await fetch("/api/live", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start",title:title.trim()})});
      setStreaming(true); setViewers(0); setChat([]); setTotalCoins(0);
      const vi = setInterval(()=>setViewers(v=>v+Math.floor(Math.random()*2)), 15000);
      return () => clearInterval(vi);
    } catch { alert("Camera and microphone access required to go live. Please allow permissions in your browser settings."); }
  };

  const endStream = async () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; }
    await fetch("/api/live",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"end"})}).catch(()=>{});
    setStreaming(false); setTitle(""); reload();
  };

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    setChat(p=>[...p,{id:Date.now(),name:user.name,text:chatMsg.trim(),type:"message"}]);
    setChatMsg("");
  };

  if (streaming) {
    return (
      <div>
        <div className="rounded-2xl overflow-hidden bg-black relative" style={{height:"50vh",maxHeight:"450px"}}>
          <video ref={localRef} className="w-full h-full object-cover" muted playsInline style={{transform:"scaleX(-1)"}}/>
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5"><div className="w-2 h-2 bg-white rounded-full animate-pulse"/>LIVE</span>
            <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1"><Users className="w-3 h-3"/>{viewers}</span>
            <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1"><Coins className="w-3 h-3 text-amber-400"/>{totalCoins}</span>
          </div>
          <div className="absolute top-4 right-4"><button onClick={endStream} className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-red-600">End Stream</button></div>
        </div>

        {/* Chat + gifts */}
        <div className={"rounded-2xl border mt-3 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <div className="p-3 max-h-48 overflow-y-auto space-y-2">
            {chat.length===0?<p className={"text-sm text-center py-4 "+(dc?"text-gray-500":"text-gray-400")}>Waiting for viewers to join...</p>:
            chat.map(c=>(
              <div key={c.id} className={"flex items-start gap-2 px-2 py-1 rounded-lg "+(c.type==="gift"?(dc?"bg-amber-500/10":"bg-amber-50"):"")}>
                {c.type==="gift"?<span className="text-lg">{c.emoji}</span>:<span className={"text-xs font-bold "+(dc?"text-rose-400":"text-rose-500")}>{c.name}:</span>}
                <span className={"text-xs "+(c.type==="gift"?(dc?"text-amber-400":"text-amber-600"):(dc?"text-gray-300":"text-gray-600"))}>{c.text}</span>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <div className={"flex gap-2 p-3 border-t "+(dc?"border-gray-700":"border-gray-100")}>
            <input className={"flex-1 px-3 py-2 rounded-xl border text-sm outline-none "+(dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200")} placeholder="Chat with viewers..." value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}/>
            <button onClick={sendChat} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold"><Send className="w-4 h-4"/></button>
          </div>
        </div>

        {/* Earnings info */}
        <div className={"rounded-xl p-4 mt-3 text-center "+(dc?"bg-amber-500/10":"bg-amber-50")}>
          <p className={"text-sm font-bold "+(dc?"text-amber-400":"text-amber-600")}>Total earned: {totalCoins} coins (80% of gifts)</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={"rounded-2xl border p-6 mb-5 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center"><Camera className="w-6 h-6 text-white"/></div>
          <div><h3 className={"font-bold "+(dc?"text-white":"text-gray-900")}>Start Your Live Stream</h3><p className={"text-sm "+(dc?"text-gray-400":"text-gray-500")}>Go live and earn coins from gifts!</p></div>
        </div>
        <input className={"w-full px-4 py-3 rounded-xl border mb-4 outline-none text-sm "+(dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-300")} placeholder="Give your stream a title..." value={title} onChange={e=>setTitle(e.target.value)}/>
        <button onClick={startStream} className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg"><Camera className="w-5 h-5"/>Go Live</button>
      </div>

      <div className={"rounded-2xl border p-5 mb-5 "+(dc?"bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20":"bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200")}>
        <h3 className={"font-bold mb-3 "+(dc?"text-white":"text-gray-900")}>How You Earn</h3>
        <div className="space-y-2">
          {GIFTS.map(g=>(
            <div key={g.id} className={"flex items-center justify-between p-2.5 rounded-lg "+(dc?"bg-gray-800/50":"bg-white/80")}>
              <span className={"text-sm "+(dc?"text-gray-300":"text-gray-700")}>{g.emoji} {g.name} ({g.cost} coins)</span>
              <span className={"text-sm font-bold "+(dc?"text-emerald-400":"text-emerald-600")}>You earn {Math.floor(g.cost*0.8)} coins</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WatchSection({ streams, user, dc, reload }: any) {
  const [watching, setWatching] = useState<any>(null);
  const [chat, setChat] = useState<any[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const [showGifts, setShowGifts] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [chat]);

  const joinStream = (stream: any) => {
    setWatching(stream);
    setChat([{id:1,name:"System",text:"You joined the stream",type:"system"},{id:2,name:"System",text:stream.host?.name+" is live!",type:"system"}]);
  };

  const leaveStream = () => { setWatching(null); setChat([]); };

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    setChat(p=>[...p,{id:Date.now(),name:user.name,text:chatMsg.trim(),type:"message"}]);
    setChatMsg("");
  };

  const sendGift = async (gift: any) => {
    if ((user.coins||0) < gift.cost) { alert("Not enough coins! Buy more coins to send gifts."); return; }
    await fetch("/api/gifts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receiverId:watching?.userId,giftType:gift.id,amount:gift.cost})}).catch(()=>{});
    setChat(p=>[...p,{id:Date.now(),name:user.name,text:"sent "+gift.emoji+" "+gift.name+"!",type:"gift",emoji:gift.emoji}]);
    setShowGifts(false);
    reload();
  };

  if (watching) {
    return (
      <div>
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900 to-gray-900 relative" style={{height:"45vh",maxHeight:"400px"}}>
          <div className="w-full h-full flex flex-col items-center justify-center">
            {watching.host?.profilePhoto?<img src={watching.host.profilePhoto} className="w-24 h-24 rounded-full object-cover mb-3 border-4 border-white/20"/>:<div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold mb-3">{watching.host?.name?.[0]}</div>}
            <p className="text-white text-lg font-bold">{watching.host?.name}</p>
            <p className="text-white/60 text-sm">{watching.title}</p>
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5"><div className="w-2 h-2 bg-white rounded-full animate-pulse"/>LIVE</span>
          </div>
          <button onClick={leaveStream} className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"><X className="w-4 h-4"/></button>
        </div>

        {/* Chat */}
        <div className={"rounded-2xl border mt-3 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <div className="p-3 max-h-40 overflow-y-auto space-y-1.5">
            {chat.map(c=>(
              <div key={c.id} className={"flex items-start gap-2 px-2 py-1 rounded-lg text-xs "+(c.type==="system"?(dc?"text-gray-500":"text-gray-400"):c.type==="gift"?(dc?"bg-amber-500/10 text-amber-400":"bg-amber-50 text-amber-600"):(dc?"text-gray-300":"text-gray-600"))}>
                {c.type==="gift"&&<span>{c.emoji}</span>}
                {c.type!=="system"&&<span className={"font-bold "+(dc?"text-rose-400":"text-rose-500")}>{c.name}:</span>}
                <span>{c.text}</span>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <div className={"flex gap-2 p-3 border-t "+(dc?"border-gray-700":"border-gray-100")}>
            <button onClick={()=>setShowGifts(!showGifts)} className={"p-2.5 rounded-xl "+(showGifts?"bg-amber-500 text-white":(dc?"bg-gray-700 text-amber-400":"bg-amber-50 text-amber-500"))}><Gift className="w-5 h-5"/></button>
            <input className={"flex-1 px-3 py-2 rounded-xl border text-sm outline-none "+(dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200")} placeholder="Say something..." value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}/>
            <button onClick={sendChat} className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center"><Send className="w-4 h-4"/></button>
          </div>
        </div>

        {/* Gifts panel */}
        {showGifts && (
          <div className={"rounded-2xl border mt-3 p-4 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={"font-bold text-sm "+(dc?"text-white":"text-gray-900")}>Send a Gift</h4>
              <span className={"text-xs flex items-center gap-1 "+(dc?"text-amber-400":"text-amber-600")}><Coins className="w-3 h-3"/>{user.coins||0} coins</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {GIFTS.map(g=>(
                <button key={g.id} onClick={()=>sendGift(g)} disabled={(user.coins||0)<g.cost} className={"flex flex-col items-center p-3 rounded-xl border transition-all disabled:opacity-30 "+(dc?"border-gray-700 hover:border-amber-500":"border-gray-200 hover:border-amber-400")}>
                  <span className="text-2xl mb-1">{g.emoji}</span>
                  <span className={"text-[10px] font-bold "+(dc?"text-gray-400":"text-gray-500")}>{g.cost}</span>
                </button>
              ))}
            </div>
            {(user.coins||0)<10&&<Link href="/dashboard/coins" className="block text-center mt-3 text-xs text-rose-500 font-bold hover:underline">Buy more coins</Link>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {streams.length===0?(
        <div className={"text-center py-16 rounded-2xl border "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Camera className={"w-12 h-12 mx-auto mb-3 "+(dc?"text-gray-600":"text-gray-300")}/>
          <p className={"font-bold mb-1 "+(dc?"text-white":"text-gray-900")}>No live streams right now</p>
          <p className={"text-sm mb-4 "+(dc?"text-gray-500":"text-gray-400")}>Be the first to go live!</p>
          <button onClick={()=>{}} className="px-5 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full text-sm font-semibold">Go to Live tab</button>
        </div>
      ):(
        <div className="grid grid-cols-2 gap-3">
          {streams.map((s:any)=>(
            <button key={s.id} onClick={()=>joinStream(s)} className={"rounded-xl border overflow-hidden text-left transition-all hover:shadow-md "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
              <div className="relative h-36 bg-gradient-to-br from-purple-500 to-pink-500">
                {s.host?.profilePhoto&&<img src={s.host.profilePhoto} className="w-full h-full object-cover"/>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/>LIVE</span>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-bold truncate">{s.title||"Live Stream"}</p>
                  <p className="text-white/60 text-[10px]">{s.host?.name}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
