"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useUser } from "../layout";
import { Video, Shield, Lock, Users, Eye, Radio, X, MessageCircle, Heart, AlertCircle, ArrowLeft, Mic, MicOff, Upload, Film, Send, Smile, Trash2, Gift, Coins } from "lucide-react";
import Link from "next/link";

const RULES = ["No nudity or sexually explicit content","No hate speech, bullying, or harassment","No violence or harmful activities","No illegal content or activities","Must be 18+ to go live","No spam or misleading content","Respect other users at all times","Violations result in permanent ban"];
const CHAT_EMOJIS = ["❤️","😂","🔥","😍","👏","💕","✨","🥰","😘","💯","🎉","👋"];

type StreamUser = { id:string; name:string; profilePhoto:string|null; tier:string; country:string|null; };
type LiveStreamData = { id:string; userId:string; title:string|null; isLive:boolean; viewerCount:number; createdAt:string; user:StreamUser; };
type ChatMsg = { id:string; content:string; createdAt:string; user:{ id:string; name:string; profilePhoto:string|null; }; };

export default function VideoPage() {
  const { user } = useUser();
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const [activeStreams, setActiveStreams] = useState<LiveStreamData[]>([]);
  const [view, setView] = useState<"home"|"live"|"watch">("home");
  const [watching, setWatching] = useState<LiveStreamData|null>(null);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [myStreamId, setMyStreamId] = useState<string|null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChatEmoji, setShowChatEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCaption, setUploadCaption] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [videoPosts, setVideoPosts] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string|null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const pollRef = useRef<NodeJS.Timeout|null>(null);
  const chatPollRef = useRef<NodeJS.Timeout|null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [showGifts, setShowGifts] = useState(false);
  const [giftList, setGiftList] = useState<{id:string;name:string;emoji:string;coins:number}[]>([]);
  const [myCoins, setMyCoins] = useState(0);
  const [sendingGift, setSendingGift] = useState("");
  const [giftAnimation, setGiftAnimation] = useState<{emoji:string;name:string}|null>(null);

  const isVerified = user?.verified === true || user?.verificationStatus === "approved" || user?.tier === "premium" || user?.tier === "gold";

  const loadStreams = async () => { try { const res = await fetch("/api/live"); if (res.ok) { const d = await res.json(); setActiveStreams((d.streams||[]).filter((s:any) => s.userId !== user?.id)); } } catch {} };
  const loadVideoPosts = async () => { try { const res = await fetch("/api/feed"); if (res.ok) { const d = await res.json(); setVideoPosts((d.feed||[]).filter((p:any) => p.image && (p.image.startsWith("[VID]") || p.image.startsWith("data:video")))); } } catch {} };

  const loadChat = useCallback(async (sid: string) => {
    try { const res = await fetch("/api/live/chat?streamId="+sid); if (res.ok) { const d = await res.json(); setChatMessages(d.messages||[]); } } catch {}
  }, []);

  const loadGifts = async () => {
    try { const res = await fetch("/api/gifts"); if (res.ok) { const d = await res.json(); setGiftList(d.gifts||[]); } } catch {}
    try { const res = await fetch("/api/coins"); if (res.ok) { const d = await res.json(); setMyCoins(d.coins||0); } } catch {}
  };

  const sendGift = async (giftId: string, receiverId: string, streamId: string) => {
    setSendingGift(giftId);
    try {
      const res = await fetch("/api/gifts", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ giftId, receiverId, streamId }) });
      const data = await res.json();
      if (res.ok) {
        setMyCoins(data.coins);
        setGiftAnimation({ emoji: data.giftEmoji, name: data.giftName });
        setTimeout(() => setGiftAnimation(null), 3000);
        loadChat(streamId);
      } else { alert(data.error || "Could not send gift"); }
    } catch { alert("Network error"); }
    setSendingGift("");
  };

  // Check if stream we are watching is still live
  const checkStreamAlive = useCallback(async (sid: string) => {
    try {
      const res = await fetch("/api/live");
      if (res.ok) {
        const d = await res.json();
        const stream = (d.streams||[]).find((s:any) => s.id === sid);
        if (!stream || !stream.isLive) {
          // Stream ended - auto leave
          if (chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; }
          setWatching(null); setView("home"); setChatMessages([]);
          alert("The live stream has ended");
        }
      }
    } catch {}
  }, []);

  useEffect(() => { loadStreams(); loadVideoPosts(); const i = setInterval(loadStreams, 8000); return () => { clearInterval(i); if(pollRef.current) clearInterval(pollRef.current); if(chatPollRef.current) clearInterval(chatPollRef.current); }; }, [user]);
  useEffect(() => { if (chatMessages.length > 0) chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [chatMessages]);

  const sendChat = useCallback(async (sid: string, text: string) => {
    if (!text.trim() || !sid) return;
    await fetch("/api/live/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ streamId:sid, content:text.trim() }) });
    loadChat(sid);
  }, [loadChat]);

  const startLive = useCallback(async () => {
    const res = await fetch("/api/live", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"start", title:liveTitle||"Live Stream" }) });
    const data = await res.json();
    const sid = data.stream?.id;
    setMyStreamId(sid); setIsLive(true); setView("live"); setViewerCount(0); setChatMessages([]);

    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}}, audio:true });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.muted = true; videoRef.current.play().catch(console.error); }
      } catch { alert("Please allow camera and microphone access"); }
    }, 500);

    pollRef.current = setInterval(async () => { try { const r = await fetch("/api/live"); if (r.ok) { const d = await r.json(); const my = (d.streams||[]).find((s:any) => s.userId === user?.id); if (my) setViewerCount(my.viewerCount); } } catch {} }, 5000);
    if (sid) { loadChat(sid); chatPollRef.current = setInterval(() => loadChat(sid), 2000); }
  }, [liveTitle, user, loadChat]);

  const stopLive = useCallback(async () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; }
    await fetch("/api/live", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"end" }) });
    setIsLive(false); setViewerCount(0); setView("home"); setChatMessages([]); setMyStreamId(null);
  }, []);

  const joinStream = async (s: LiveStreamData) => {
    await fetch("/api/live", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"join", streamId:s.id }) });
    setWatching(s); setView("watch"); setChatMessages([]); loadGifts();
    loadChat(s.id);
    if (chatPollRef.current) clearInterval(chatPollRef.current);
    chatPollRef.current = setInterval(() => { loadChat(s.id); checkStreamAlive(s.id); }, 2000);
  };

  const leaveStream = async () => {
    if (watching) await fetch("/api/live", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"leave", streamId:watching.id }) });
    if (chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; }
    setWatching(null); setView("home"); setChatMessages([]);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 50*1024*1024) { alert("Max 50MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await fetch("/api/feed", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ content:uploadCaption||"Check out my video! 🎬", image:"[VID]"+(ev.target?.result as string) }) });
      setUploadCaption(""); setShowUpload(false); setUploading(false); loadVideoPosts();
    };
    reader.readAsDataURL(file);
  };

  const deleteVideo = async (postId: string) => {
    if (!confirm("Delete this video permanently?")) return;
    setDeleting(postId);
    try {
      const res = await fetch("/api/feed/delete", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }) });
      const data = await res.json();
      if (data.success) {
        setVideoPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        alert("Could not delete: " + (data.error || "Unknown error"));
      }
    } catch { alert("Network error - try again"); }
    setDeleting(null);
  };

  const toggleLike = async (postId: string) => { await fetch("/api/feed/like", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }) }); loadVideoPosts(); };

  if (!user) return null;

  const formatChatTime = (d: string) => new Date(d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});

  // LIVE VIEW
  if (view === "live" && isLive && myStreamId) return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4"><h1 className="text-2xl font-bold text-gray-900">You are Live!</h1></div>
      <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
        <div className="relative h-[300px] sm:h-[420px] bg-gray-900">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{transform:"scaleX(-1)"}} />
          <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
            <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg"><Radio className="w-4 h-4 animate-pulse" /> LIVE</div>
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm"><Eye className="w-4 h-4" /> {viewerCount} watching</div>
          </div>
          <button onClick={stopLive} className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-red-600 shadow-lg z-10"><X className="w-4 h-4" /> End Live</button>
          <div className="absolute bottom-4 left-4 z-10"><button onClick={()=>setMicOn(!micOn)} className={"w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm "+(micOn?"bg-white/20 text-white":"bg-red-500 text-white")}>{micOn?<Mic className="w-5 h-5"/>:<MicOff className="w-5 h-5"/>}</button></div>
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 z-10">
            {user.profilePhoto?<img src={user.profilePhoto} className="w-6 h-6 rounded-full object-cover"/>:<div className="w-6 h-6 rounded-full bg-rose-400 flex items-center justify-center text-white text-xs font-bold">{user.name[0]}</div>}
            <span className="text-white text-sm font-semibold">{user.name}</span>
          </div>
        </div>
        {/* INLINE CHAT - no component re-render */}
        <div className="bg-gray-900">
          {chatMessages.length > 0 && (
            <div className="max-h-40 overflow-y-auto px-4 pt-3 space-y-2">
              {chatMessages.map(m => (
                <div key={m.id} className="flex items-start gap-2">
                  {m.user?.profilePhoto?<img src={m.user.profilePhoto} className="w-5 h-5 rounded-full object-cover flex-shrink-0 mt-0.5"/>:<div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-[8px] text-white font-bold flex-shrink-0 mt-0.5">{m.user?.name?.[0]}</div>}
                  <div className="flex-1 min-w-0"><span className="text-xs font-bold text-rose-400">{m.user?.name} </span><span className="text-xs text-white/80">{m.content}</span></div>
                  <span className="text-[10px] text-white/30 flex-shrink-0">{formatChatTime(m.createdAt)}</span>
                </div>
              ))}
              <div ref={chatEndRef}/>
            </div>
          )}
          {showChatEmoji && <div className="px-4 py-2 flex flex-wrap gap-1 border-t border-gray-800">{CHAT_EMOJIS.map(e=><button key={e} onMouseDown={ev=>{ev.preventDefault();setChatInput(p=>p+e);}} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg">{e}</button>)}</div>}
          <div className="flex items-center gap-2 p-3">
            <button onMouseDown={e=>{e.preventDefault();setShowChatEmoji(!showChatEmoji);}} className={"w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 "+(showChatEmoji?"bg-rose-500/30 text-rose-400":"bg-white/10 text-white/50")}><Smile className="w-5 h-5"/></button>
            <input ref={chatInputRef} className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-rose-500" placeholder="Send a message..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();const t=chatInput;setChatInput("");sendChat(myStreamId,t);}}} />
            <button onMouseDown={e=>{e.preventDefault();const t=chatInput;setChatInput("");sendChat(myStreamId,t);}} disabled={!chatInput.trim()} className="w-9 h-9 bg-rose-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0 hover:bg-rose-600"><Send className="w-4 h-4"/></button>
          </div>
        </div>
      </div>
    </div>
  );

  // WATCH VIEW
  if (view === "watch" && watching) return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
        <div className="relative h-[280px] sm:h-[380px] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-red-500/50 ring-offset-4 ring-offset-gray-900">
              {watching.user?.profilePhoto?<img src={watching.user.profilePhoto} className="w-full h-full rounded-full object-cover"/>:<div className="w-full h-full rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold">{watching.user?.name?.[0]}</div>}
            </div>
            <h3 className="text-white text-xl font-bold">{watching.user?.name}</h3>
            <p className="text-white/60 text-sm mb-2">{watching.title||"Live Stream"}</p>
            <div className="flex items-center justify-center gap-3">
              <span className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold"><Radio className="w-3 h-3 animate-pulse"/> LIVE</span>
              <span className="flex items-center gap-1 text-white/60 text-xs"><Eye className="w-3.5 h-3.5"/> {watching.viewerCount} watching</span>
            </div>
          </div>
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <div className="flex items-center gap-2"><span className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold"><Radio className="w-4 h-4 animate-pulse"/> LIVE</span><span className="flex items-center gap-1.5 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm"><Eye className="w-4 h-4"/> {watching.viewerCount}</span></div>
            <button onClick={leaveStream} className="flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-full font-bold text-sm"><X className="w-4 h-4"/> Leave</button>
          </div>
        </div>
        {/* INLINE CHAT for viewers */}
        <div className="bg-gray-900">
          {chatMessages.length > 0 && (
            <div className="max-h-40 overflow-y-auto px-4 pt-3 space-y-2">
              {chatMessages.map(m => (
                <div key={m.id} className="flex items-start gap-2">
                  {m.user?.profilePhoto?<img src={m.user.profilePhoto} className="w-5 h-5 rounded-full object-cover flex-shrink-0 mt-0.5"/>:<div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-[8px] text-white font-bold flex-shrink-0 mt-0.5">{m.user?.name?.[0]}</div>}
                  <div className="flex-1 min-w-0"><span className="text-xs font-bold text-rose-400">{m.user?.name} </span><span className="text-xs text-white/80">{m.content}</span></div>
                  <span className="text-[10px] text-white/30 flex-shrink-0">{formatChatTime(m.createdAt)}</span>
                </div>
              ))}
              <div ref={chatEndRef}/>
            </div>
          )}
          {showChatEmoji && <div className="px-4 py-2 flex flex-wrap gap-1 border-t border-gray-800">{CHAT_EMOJIS.map(e=><button key={e} onMouseDown={ev=>{ev.preventDefault();setChatInput(p=>p+e);}} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg">{e}</button>)}</div>}
          <div className="flex items-center gap-2 p-3">
            <button onMouseDown={e=>{e.preventDefault();setShowChatEmoji(!showChatEmoji);setShowGifts(false);}} className={"w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 "+(showChatEmoji?"bg-rose-500/30 text-rose-400":"bg-white/10 text-white/50")}><Smile className="w-5 h-5"/></button>
            <button onMouseDown={e=>{e.preventDefault();setShowGifts(!showGifts);setShowChatEmoji(false);if(!showGifts)loadGifts();}} className={"w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 "+(showGifts?"bg-amber-500/30 text-amber-400":"bg-white/10 text-white/50")}><Gift className="w-5 h-5"/></button>
            <input ref={chatInputRef} className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-rose-500" placeholder="Send a message..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();const t=chatInput;setChatInput("");sendChat(watching.id,t);}}} />
            <button onMouseDown={e=>{e.preventDefault();const t=chatInput;setChatInput("");sendChat(watching.id,t);}} disabled={!chatInput.trim()} className="w-9 h-9 bg-rose-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0 hover:bg-rose-600"><Send className="w-4 h-4"/></button>
          </div>
        </div>
      </div>
      {/* Gift Panel */}
      {showGifts && watching && (
        <div className="mt-3 bg-gray-900 rounded-2xl border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-bold text-sm flex items-center gap-2"><Gift className="w-4 h-4 text-amber-400" /> Send a Gift</h4>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">{myCoins.toLocaleString()}</span>
              <a href="/dashboard/coins" target="_blank" className="text-[10px] text-rose-400 font-bold hover:underline ml-1">+Buy</a>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {giftList.map(g => (
              <button key={g.id} onClick={() => sendGift(g.id, watching.userId, watching.id)} disabled={sendingGift === g.id || myCoins < g.coins} className={"flex flex-col items-center gap-1 p-3 rounded-xl border transition-all " + (myCoins >= g.coins ? "border-gray-700 hover:border-amber-500 hover:bg-amber-500/10" : "border-gray-800 opacity-40 cursor-not-allowed")}>
                <span className="text-2xl">{g.emoji}</span>
                <span className="text-[10px] text-white font-medium">{g.name}</span>
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5"><Coins className="w-2.5 h-2.5" />{g.coins}</span>
                {sendingGift === g.id && <div className="w-3 h-3 border-2 border-amber-300 border-t-amber-500 rounded-full animate-spin" />}
              </button>
            ))}
          </div>
          {myCoins < 10 && <p className="text-xs text-gray-500 text-center mt-2">Not enough coins. <a href="/dashboard/coins" target="_blank" className="text-rose-400 font-bold hover:underline">Buy Coins</a></p>}
        </div>
      )}

      {/* Gift animation overlay */}
      {giftAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce text-center">
            <span className="text-8xl block">{giftAnimation.emoji}</span>
            <span className="text-white text-xl font-bold bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full mt-2 inline-block">Sent {giftAnimation.name}!</span>
          </div>
        </div>
      )}

      <button onClick={leaveStream} className="mt-4 flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium"><ArrowLeft className="w-4 h-4"/> Back to Video</button>
    </div>
  );

  // HOME VIEW
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Video</h1><p className="text-sm text-gray-500">Go live, watch streams, or share videos</p></div>
        <button onClick={()=>setShowUpload(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg"><Upload className="w-4 h-4"/> Upload Video</button>
      </div>

      {activeStreams.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Radio className="w-5 h-5 text-red-500 animate-pulse"/> Live Now ({activeStreams.length})</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activeStreams.map(s => (
              <button key={s.id} onClick={()=>joinStream(s)} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all text-left group">
                <div className="relative h-36 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500">
                  {s.user?.profilePhoto&&<img src={s.user.profilePhoto} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all"/>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                  <div className="absolute top-3 left-3 flex items-center gap-2"><span className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-[11px] font-bold"><Radio className="w-3 h-3 animate-pulse"/> LIVE</span><span className="flex items-center gap-1 bg-black/50 text-white px-2 py-0.5 rounded-full text-[11px]"><Eye className="w-3 h-3"/> {s.viewerCount}</span></div>
                  <div className="absolute bottom-3 left-3 right-3"><p className="text-white font-bold text-sm truncate">{s.user?.name}</p><p className="text-white/70 text-xs truncate">{s.title||"Live Stream"}</p></div>
                </div>
                <div className="p-3 flex items-center gap-2">
                  {s.user?.profilePhoto?<img src={s.user.profilePhoto} className="w-8 h-8 rounded-full object-cover"/>:<div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">{s.user?.name?.[0]}</div>}
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{s.user?.name}</p></div>
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">Watch</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isVerified ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/30"><Radio className="w-8 h-8 text-white"/></div>
            <h2 className="text-2xl font-bold text-white mb-1">Go Live</h2>
            <p className="text-white/80 text-sm">Share moments with ConnectHub</p>
          </div>
          <div className="p-6">
            <div className="mb-5"><label className="block text-sm font-medium text-gray-700 mb-1">Stream Title</label><input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm" placeholder="What's your live about?" value={liveTitle} onChange={e=>setLiveTitle(e.target.value)}/></div>
            {!acceptedRules?<button onClick={()=>setShowRules(true)} className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg flex items-center justify-center gap-2"><Radio className="w-5 h-5"/> Review Rules & Go Live</button>:<button onClick={startLive} className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full font-semibold hover:shadow-lg flex items-center justify-center gap-2"><Radio className="w-5 h-5 animate-pulse"/> Start Live Stream</button>}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center mb-5"><Lock className="w-10 h-10 text-amber-500 mx-auto mb-3"/><h3 className="font-bold text-gray-900 mb-2">Verification Required to Go Live</h3><p className="text-sm text-gray-500 mb-4">Get verified to start live streams</p><Link href="/dashboard/verify" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold"><Shield className="w-4 h-4"/> Get Verified</Link></div>
      )}

      <div className="mb-4"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Film className="w-5 h-5 text-violet-500"/> Video Posts</h3></div>
      {videoPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-5"><Film className="w-12 h-12 text-gray-200 mx-auto mb-3"/><h3 className="font-bold text-gray-400 mb-1">No videos yet</h3><button onClick={()=>setShowUpload(true)} className="text-violet-500 font-semibold text-sm hover:underline mt-2">Upload Video</button></div>
      ) : (
        <div className="space-y-4 mb-5">
          {videoPosts.map((vp:any) => {
            const videoSrc = (vp.image||"").replace("[VID]","");
            return (
              <div key={vp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-4 pb-2">
                  <Link href={"/dashboard/user?id="+(vp.user?.id||vp.userId)}>{vp.user?.profilePhoto?<img src={vp.user.profilePhoto} className="w-10 h-10 rounded-full object-cover"/>:<div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{vp.user?.name?.[0]||"?"}</div>}</Link>
                  <div className="flex-1"><Link href={"/dashboard/user?id="+(vp.user?.id||vp.userId)} className="text-sm font-bold text-gray-900 hover:text-rose-500">{vp.user?.name}</Link><p className="text-xs text-gray-400">{new Date(vp.createdAt).toLocaleDateString()}</p></div>
                  {vp.userId===user.id&&<button onClick={()=>deleteVideo(vp.id)} disabled={deleting===vp.id} className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-40">{deleting===vp.id?<div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"/>:<Trash2 className="w-4 h-4"/>}</button>}
                </div>
                {vp.content&&<p className="px-4 pb-2 text-sm text-gray-800">{vp.content}</p>}
                <div className="bg-black"><video src={videoSrc} controls playsInline preload="metadata" className="w-full max-h-[400px]"/></div>
                <div className="flex border-t border-gray-100">
                  <button onClick={()=>toggleLike(vp.id)} className={"flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium "+(vp.liked?"text-rose-500":"text-gray-500 hover:bg-gray-50")}><Heart className={"w-5 h-5 "+(vp.liked?"fill-rose-500":"")}/> {vp.likeCount>0?vp.likeCount+" ":""}{vp.liked?"Liked":"Like"}</button>
                  <Link href="/dashboard/feed" className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50"><MessageCircle className="w-5 h-5"/> Comment</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"><h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Video className="w-5 h-5 text-blue-500"/> Video Calls</h3><p className="text-sm text-gray-500 mb-4">Start a video call from Messages.</p><Link href="/dashboard/messages" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 border border-blue-200"><MessageCircle className="w-4 h-4"/> Go to Messages</Link></div>

      {showUpload&&(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowUpload(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Film className="w-5 h-5 text-violet-500"/> Upload Video</h3><button onClick={()=>setShowUpload(false)}><X className="w-5 h-5 text-gray-400"/></button></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Caption</label><input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-300 outline-none text-sm" placeholder="Describe your video..." value={uploadCaption} onChange={e=>setUploadCaption(e.target.value)}/></div>
            <input ref={uploadRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/*" onChange={handleVideoUpload} className="hidden"/>
            <button onClick={()=>uploadRef.current?.click()} disabled={uploading} className="w-full py-12 border-2 border-dashed border-gray-200 rounded-2xl text-center hover:bg-gray-50 mb-4">
              {uploading?<div><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-2"/><p className="text-sm text-gray-500">Uploading...</p></div>:<div><Upload className="w-10 h-10 text-gray-300 mx-auto mb-2"/><p className="text-sm font-semibold text-gray-600">Tap to select video</p><p className="text-xs text-gray-400 mt-1">MP4, MOV, WebM · Max 50MB</p></div>}
            </button>
          </div>
        </div>
      )}

      {showRules&&(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowRules(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5"><div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500"/></div><div><h3 className="font-bold text-gray-900">Community Guidelines</h3></div></div>
            <div className="space-y-3 mb-6">{RULES.map((rule,i)=><div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"><span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span><p className="text-sm text-gray-700">{rule}</p></div>)}</div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5"><p className="text-xs text-red-700"><strong>Warning:</strong> Violations = permanent ban.</p></div>
            <div className="flex gap-3"><button onClick={()=>setShowRules(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-full font-semibold text-gray-600">Cancel</button><button onClick={()=>{setAcceptedRules(true);setShowRules(false);}} className="flex-[2] py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full font-semibold">I Accept</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
