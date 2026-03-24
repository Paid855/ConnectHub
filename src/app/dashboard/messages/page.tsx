"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../layout";
import { Send, ArrowLeft, Shield, MessageCircle, Search, Heart, Smile, Phone, Video, Image as ImageIcon, X, PhoneOff, Mic, Square, Play, Pause, MicOff, VideoOff, PhoneCall, Trash2, Archive, Ban, MoreVertical } from "lucide-react";
import Link from "next/link";

type Partner = { id:string; name:string; profilePhoto:string|null; tier:string; lastSeen?:string|null; verified?:boolean; };
type Conversation = { partner:Partner; lastMessage:any; unreadCount:number; };
type Msg = { id:string; senderId:string; receiverId:string; content:string; read:boolean; createdAt:string; };

const EMOJIS = ["😀","😂","🥰","😍","😘","🤗","😊","🥺","😢","😎","🤔","🙌","❤️","🔥","💕","✨","💯","👋","🎉","💐","🌹","💝","💖","😏","🤭","😇","🥳","💪","👏","🙏"];

export default function MessagesPage() {
  const { user } = useUser();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<Partner|null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<string|null>(null);
  const [showConvoMenu, setShowConvoMenu] = useState<string|null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob|null>(null);
  const [audioUrl, setAudioUrl] = useState<string|null>(null);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [callState, setCallState] = useState<"idle"|"ringing"|"connected">("idle");
  const [callType, setCallType] = useState<"voice"|"video">("voice");
  const [callTimer, setCallTimer] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout|null>(null);
  const callTimerRef = useRef<NodeJS.Timeout|null>(null);
  const ringTimerRef = useRef<NodeJS.Timeout|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const audioRef = useRef<HTMLAudioElement|null>(null);

  const loadConversations = async () => { const res = await fetch("/api/messages"); if (res.ok) { const d = await res.json(); setConvos(d.conversations||[]); } setLoading(false); };
  useEffect(() => { loadConversations(); }, []);

  const openChat = async (partner: Partner) => {
    setActivePartner(partner); setShowEmoji(false); setLimitHit(false); endCall();
    const res = await fetch("/api/messages?with="+partner.id);
    if (res.ok) { const d = await res.json(); setMessages(d.messages||[]); }
    setTimeout(() => endRef.current?.scrollIntoView({behavior:"smooth"}), 100);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => { if (callState !== "idle") return; const r = await fetch("/api/messages?with="+partner.id); if (r.ok) { const d = await r.json(); setMessages(d.messages||[]); } }, 3000);
  };

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); endCall(); }; }, []);
  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordTimerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch { alert("Microphone access denied"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); }
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !activePartner) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const content = "[VOICE]" + base64;
      await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId:activePartner.id, content }) });
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      const r2 = await fetch("/api/messages?with=" + activePartner.id);
      if (r2.ok) { const d2 = await r2.json(); setMessages(d2.messages||[]); }
    };
    reader.readAsDataURL(audioBlob);
  };

  const formatRecTime = (s: number) => Math.floor(s/60).toString().padStart(2,"0") + ":" + (s%60).toString().padStart(2,"0");

  const deleteMessage = async (messageId: string, deleteFor: "me"|"everyone") => {
    await fetch("/api/messages/delete", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ messageId, deleteFor }) });
    setSelectedMsg(null);
    if (activePartner) { const r = await fetch("/api/messages?with="+activePartner.id); if (r.ok) { const d = await r.json(); setMessages(d.messages||[]); } }
  };

  const clearConversation = async (partnerId: string) => {
    if (!confirm("Clear all messages with this user? This cannot be undone.")) return;
    await fetch("/api/messages/actions", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"clear", partnerId }) });
    setShowConvoMenu(null);
    if (activePartner?.id === partnerId) { setMessages([]); }
    loadConversations();
  };

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;
  const lastSeenText = (d: string|null) => { if (!d) return "Offline"; const diff = Date.now()-new Date(d).getTime(); if (diff<300000) return "Online"; if (diff<3600000) return Math.floor(diff/60000)+"m ago"; if (diff<86400000) return Math.floor(diff/3600000)+"h ago"; return "Long time ago"; };

  const sendMessage = async (content?: string) => {
    const msg = content||newMsg.trim();
    if (!msg||!activePartner||sending) return;
    setSending(true); setLimitHit(false);
    const res = await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId:activePartner.id, content:msg }) });
    if (res.status===403) { const d = await res.json(); if (d.limited) { setLimitHit(true); setSending(false); return; } }
    if (!content) setNewMsg("");
    setShowEmoji(false);
    const r2 = await fetch("/api/messages?with="+activePartner.id);
    if (r2.ok) { const d = await r2.json(); setMessages(d.messages||[]); }
    setSending(false); loadConversations();
  };

  const handleImageSend = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size>3*1024*1024) { alert("Max 3MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { sendMessage("[IMG]"+(ev.target?.result as string)); };
    reader.readAsDataURL(file);
    if (imageRef.current) imageRef.current.value = "";
  };

  const startCall = useCallback(async (type: "voice"|"video") => {
    if (!activePartner) return;
    setCallType(type);
    setCallState("ringing");
    setCallTimer(0);
    setMicOn(true); setCamOn(true);

    // Ringing phase (3-5 seconds simulating ring)
    ringTimerRef.current = setTimeout(async () => {
      // 70% chance they answer
      if (Math.random() > 0.3) {
        try {
          const constraints = type==="video" ? {video:true,audio:true} : {audio:true};
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;
          if (type==="video" && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.muted = true;
            await videoRef.current.play();
          }
          setCallState("connected");
          callTimerRef.current = setInterval(() => setCallTimer(t => t+1), 1000);

          // Send call message
          await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId:activePartner.id, content:type==="video"?"📹 Video call":"📞 Voice call" }) });
        } catch {
          alert("Please allow camera/microphone access to make calls");
          setCallState("idle");
        }
      } else {
        // They didn't answer
        setCallState("idle");
        await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId:activePartner.id, content:type==="video"?"📹 Missed video call":"📞 Missed call" }) });
        await fetch("/api/calls", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId:activePartner.id, type, status:"missed", duration:0 }) });
        const r2 = await fetch("/api/messages?with="+activePartner.id);
        if (r2.ok) { const d = await r2.json(); setMessages(d.messages||[]); }
      }
    }, 3000 + Math.random()*2000);
  }, [activePartner]);

  const switchCallType = useCallback(async () => {
    const newType = callType==="voice"?"video":"voice";
    if (newType==="video" && !streamRef.current?.getVideoTracks().length) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
        if (streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.muted = true; await videoRef.current.play(); }
      } catch { alert("Camera access needed for video"); return; }
    }
    setCallType(newType);
  }, [callType]);

  const endCall = useCallback(async () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current = null; }
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    if (ringTimerRef.current) { clearTimeout(ringTimerRef.current); ringTimerRef.current = null; }

    if (callState === "connected" && activePartner && callTimer > 0) {
      await fetch("/api/calls", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId:activePartner.id, type:callType, status:"completed", duration:callTimer }) }).catch(()=>{});
    }

    setCallState("idle"); setCallTimer(0);
  }, [callState, activePartner, callTimer, callType]);

  const formatCallTime = (s: number) => { const m = Math.floor(s/60); const sec = s%60; return `${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`; };
  const isImage = (content: string) => content.startsWith("[IMG]data:image");
  const isStoryReply = (content: string) => content.startsWith("[STORY_REPLY]") || content.startsWith("[STORY_REACT]");
  const getStoryContent = (content: string) => content.replace("[STORY_REPLY]", "").replace("[STORY_REACT]", "");
  const isVoice = (content: string) => content.startsWith("[VOICE]");
  const getVoiceSrc = (content: string) => content.replace("[VOICE]","");
  const getImageSrc = (content: string) => content.replace("[IMG]","");
  const addEmoji = (emoji: string) => { setNewMsg(p=>p+emoji); inputRef.current?.focus(); };
  const formatTime = (d: string) => { const diff = Date.now()-new Date(d).getTime(); if(diff<60000) return "Now"; if(diff<3600000) return Math.floor(diff/60000)+"m"; if(diff<86400000) return new Date(d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); return new Date(d).toLocaleDateString([],{month:"short",day:"numeric"}); };
  const filteredConvos = convos.filter(c => !search||c.user.name.toLowerCase().includes(search.toLowerCase()));
  if (!user) return null;

  return (
    <div className="h-[calc(100vh-7rem)] flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
      {/* CALL OVERLAY */}
      {callState !== "idle" && activePartner && (
        <div className="absolute inset-0 z-50 bg-gray-900 flex flex-col">
          {callType === "video" && callState === "connected" ? (
            <div className="relative flex-1">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{transform:"scaleX(-1)"}} />
              <div className="absolute inset-0 bg-black/10" />

              <div className="absolute top-6 left-0 right-0 text-center">
                <p className="text-white font-bold text-lg drop-shadow-lg">{activePartner.name}</p>
                <p className="text-emerald-400 text-sm font-semibold">{formatCallTime(callTimer)}</p>
              </div>

              <div className="absolute top-20 right-4 w-28 h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl">
                {activePartner.profilePhoto ? <img src={activePartner.profilePhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-3xl text-white/50 font-bold">{activePartner.name[0]}</span></div>}
              </div>

              <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4">
                <button onClick={()=>setMicOn(!micOn)} className={"w-13 h-13 rounded-full flex items-center justify-center backdrop-blur-sm " + (micOn?"bg-white/20 text-white":"bg-red-500 text-white")}><div className="w-12 h-12 flex items-center justify-center">{micOn?<Mic className="w-5 h-5"/>:<MicOff className="w-5 h-5"/>}</div></button>
                <button onClick={endCall} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-red-600"><PhoneOff className="w-7 h-7" /></button>
                <button onClick={switchCallType} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"><Phone className="w-5 h-5" /></button>
                <button onClick={()=>setCamOn(!camOn)} className={"w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm " + (camOn?"bg-white/20 text-white":"bg-red-500 text-white")}>{camOn?<Video className="w-5 h-5"/>:<VideoOff className="w-5 h-5"/>}</button>
              </div>
            </div>
          ) : (
            /* Voice call OR ringing state */
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Ringing animation */}
              {callState === "ringing" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-40 rounded-full border-2 border-emerald-400/30 animate-ping" />
                </div>
              )}

              <div className={"relative w-32 h-32 rounded-full shadow-2xl mb-6 " + (callState==="ringing"?"animate-pulse":"")}>
                <div className="absolute inset-0 rounded-full ring-4 ring-offset-4 ring-offset-gray-900 ring-rose-500/50" />
                {activePartner.profilePhoto ? <img src={activePartner.profilePhoto} className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-5xl font-bold">{activePartner.name[0]}</div>}
              </div>

              <h2 className="text-white text-2xl font-bold mb-1">{activePartner.name}</h2>

              {callState === "ringing" ? (
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-2">
                    <PhoneCall className="w-4 h-4 text-emerald-400 animate-bounce" />
                    <p className="text-emerald-400 font-semibold">Ringing...</p>
                  </div>
                  <p className="text-white/40 text-sm">{callType === "video" ? "Video call" : "Voice call"}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-emerald-400 font-semibold mb-1">Connected</p>
                  <p className="text-white/60 text-lg font-mono">{formatCallTime(callTimer)}</p>
                  <p className="text-white/30 text-xs mt-1">{callType==="video"?"Video Call":"Voice Call"}</p>
                </div>
              )}

              <div className="flex justify-center gap-5 mt-12">
                <button onClick={()=>setMicOn(!micOn)} className={"w-14 h-14 rounded-full flex items-center justify-center transition-all " + (micOn?"bg-white/10 text-white hover:bg-white/20":"bg-red-500 text-white")}>{micOn?<Mic className="w-6 h-6"/>:<MicOff className="w-6 h-6"/>}</button>
                <button onClick={endCall} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-red-600 transition-all"><PhoneOff className="w-7 h-7" /></button>
                <button onClick={switchCallType} title={callType==="voice"?"Switch to video":"Switch to voice"} className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">{callType==="voice"?<Video className="w-6 h-6"/>:<Phone className="w-6 h-6"/>}</button>
              </div>
              {callState === "connected" && <p className="text-white/30 text-xs mt-6">Tap the {callType==="voice"?"video":"phone"} icon to switch call type</p>}
            </div>
          )}
        </div>
      )}

      {/* Conversation List */}
      <div className={"w-full md:w-80 border-r border-gray-100 flex flex-col " + (activePartner?"hidden md:flex":"flex")}>
        <div className="p-4 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900 mb-3">Messages</h2><div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2"><Search className="w-4 h-4 text-gray-400" /><input className="bg-transparent border-none outline-none text-sm w-full" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} /></div></div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" /></div> : filteredConvos.length===0 ? (
            <div className="p-8 text-center"><Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" /><h3 className="font-bold text-gray-900 mb-1">No messages</h3><p className="text-sm text-gray-500">Match with someone to chat!</p></div>
          ) : filteredConvos.map(c => (
            <div key={c.user.id} className={"relative w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-all text-left border-b border-gray-50 "+(activePartner?.id===c.user.id?"bg-rose-50":"")}>
              <button onClick={()=>openChat(c.user)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="relative flex-shrink-0">
                  {c.user.profilePhoto?<img src={c.user.profilePhoto} className="w-12 h-12 rounded-full object-cover"/>:<div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{c.user.name[0]}</div>}
                  {isOnline(c.user.lastSeen) ? <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"/> : <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gray-300 rounded-full border-2 border-white"/>}
                  {c.unreadCount>0&&<span className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{c.unreadCount}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1">{c.user.name}{c.user.verified&&<Shield className="w-3.5 h-3.5 text-blue-500 fill-blue-100"/>}</p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{c.lastMessage?formatTime(c.lastMessage.createdAt):""}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={"text-xs truncate flex-1 "+(c.unreadCount>0?"text-gray-900 font-semibold":"text-gray-500")}>{c.lastMessage?.content?.startsWith("[DELETED]")?"🚫 Message deleted":c.lastMessage?.content?.startsWith("[IMG]")?"📷 Photo":c.lastMessage?.content?.startsWith("[VOICE]")?"🎤 Voice message":c.lastMessage?.content||"Start chatting!"}</p>
                    {c.unreadCount>0&&<span className="ml-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{c.unreadCount}</span>}
                  </div>
                </div>
              </button>
              <button onClick={(e)=>{e.stopPropagation();setShowConvoMenu(showConvoMenu===c.user.id?null:c.user.id);}} className="p-1.5 rounded-full hover:bg-gray-100 flex-shrink-0"><MoreVertical className="w-4 h-4 text-gray-400"/></button>
              {showConvoMenu===c.user.id && (
                <div className="absolute right-12 top-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-30 overflow-hidden w-44">
                  <button onClick={()=>clearConversation(c.user.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left"><Trash2 className="w-4 h-4"/> Clear chat</button>
                  <Link href={"/dashboard/user?id="+c.user.id} onClick={()=>setShowConvoMenu(null)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Shield className="w-4 h-4"/> View profile</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={"flex-1 flex flex-col "+(activePartner?"flex":"hidden md:flex")}>
        {activePartner ? (<>
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
            <button onClick={()=>{setActivePartner(null);if(pollRef.current)clearInterval(pollRef.current);loadConversations();}} className="md:hidden p-1"><ArrowLeft className="w-5 h-5 text-gray-600"/></button>
            <Link href={"/dashboard/user?id="+activePartner.id}>{activePartner.profilePhoto?<img src={activePartner.profilePhoto} className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-rose-200"/>:<div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{activePartner.name[0]}</div>}</Link>
            <div className="flex-1"><Link href={"/dashboard/user?id="+activePartner.id} className="font-bold text-gray-900 hover:text-rose-500 flex items-center gap-1">{activePartner.name}{activePartner.tier==="verified"&&<Shield className="w-4 h-4 text-blue-500"/>}</Link><p className={"text-xs " + (isOnline(activePartner.lastSeen)?"text-emerald-500":"text-gray-400")}>{isOnline(activePartner.lastSeen)?"Online":lastSeenText(activePartner.lastSeen)}</p></div>
            <div className="flex items-center gap-1.5">
              <button onClick={()=>startCall("voice")} className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all" title="Voice Call"><Phone className="w-4 h-4"/></button>
              <button onClick={()=>startCall("video")} className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-all" title="Video Call"><Video className="w-4 h-4"/></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" onClick={()=>{setSelectedMsg(null);setShowConvoMenu(null);}}>
            {messages.length===0&&<div className="text-center py-12"><p className="text-gray-400 text-sm">Say hello to {activePartner.name}!</p></div>}
            {messages.map(m => {
              const isMine = m.senderId===user.id;
              const img = isImage(m.content);
              const isCallMsg = m.content.startsWith("📞")||m.content.startsWith("📹");
              const isDeleted = m.content.startsWith("[DELETED]");
              return (
                <div key={m.id} className={"flex "+(isMine?"justify-end":"justify-start")+" group relative"}>
                  {isDeleted ? (
                    <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-2.5 max-w-[75%] italic">
                      <p className="text-sm text-gray-400 flex items-center gap-1.5"><Ban className="w-3.5 h-3.5"/> This message was deleted</p>
                      <p className="text-[10px] text-gray-300 mt-1">{formatTime(m.createdAt)}</p>
                    </div>
                  ) : (m.content.startsWith("[STORY_REPLY]") || m.content.startsWith("[STORY_REACT]")) ? (
                    <div className={"max-w-[75%] " + (isMine?"ml-auto":"")}>
                      <a href="/dashboard/stories" className={(isMine?"bg-gradient-to-r from-violet-500 to-purple-500":"bg-violet-50 border border-violet-200") + " rounded-2xl px-4 py-3 block hover:shadow-md transition-shadow cursor-pointer"}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{m.content.startsWith("[STORY_REACT]") ? "❤️" : "💬"}</span>
                          <span className={(isMine?"text-violet-100":"text-violet-500") + " text-xs font-bold"}>{m.content.startsWith("[STORY_REACT]") ? "Story Reaction" : "Story Reply"}</span>
                        </div>
                        <p className={(isMine?"text-white":"text-gray-800") + " text-sm"}>{m.content.replace("[STORY_REPLY]","").replace("[STORY_REACT]","")}</p>
                        <p className={(isMine?"text-violet-200":"text-violet-400") + " text-[10px] mt-1 underline"}>Tap to view stories →</p>
                      </a>
                      <p className={"text-[10px] mt-1 " + (isMine?"text-right text-gray-400":"text-gray-400")}>{formatTime(m.createdAt)}{isMine && m.read && " · ✓✓ Read"}</p>
                    </div>
                  ) : img ? (
                    <div className="max-w-[70%] relative" onClick={()=>setSelectedMsg(selectedMsg===m.id?null:m.id)}>
                      <img src={getImageSrc(m.content)} className="rounded-2xl max-h-64 object-cover border border-gray-200 shadow-sm"/>
                      <p className={"text-[10px] mt-1 "+(isMine?"text-right text-gray-400":"text-gray-400")}>{formatTime(m.createdAt)}{isMine&&m.read&&" · ✓✓ Read"}</p>
                      {selectedMsg===m.id && <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden w-48"><button onClick={()=>deleteMessage(m.id,"me")} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Trash2 className="w-4 h-4"/> Delete for me</button>{isMine&&<button onClick={()=>deleteMessage(m.id,"everyone")} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/> Delete for everyone</button>}</div>}
                    </div>
                  ) : isVoice(m.content) ? (
                    <div className={"max-w-[75%] " + (isMine?"ml-auto":"")}>
                      <div className={(isMine?"bg-gradient-to-r from-rose-500 to-pink-500":"bg-white border border-gray-100") + " rounded-2xl px-4 py-3 shadow-sm"}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{isMine?"🎤":"🎵"}</span>
                          <span className={(isMine?"text-rose-100":"text-gray-500") + " text-xs font-medium"}>Voice message</span>
                        </div>
                        <audio controls className="w-full h-8" style={{filter:isMine?"invert(1) brightness(2) contrast(0.8)":"none"}} src={getVoiceSrc(m.content)} />
                      </div>
                      <p className={"text-[10px] mt-1 " + (isMine?"text-right text-gray-400":"text-gray-400")}>{formatTime(m.createdAt)}{isMine && m.read && " · Read"}</p>
                    </div>
                  ) : isCallMsg ? (
                    <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-2.5 max-w-[75%] text-center">
                      <p className="text-sm text-gray-600">{m.content}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatTime(m.createdAt)}</p>
                    </div>
                  ) : (
                    <div className="relative max-w-[75%]" onClick={()=>setSelectedMsg(selectedMsg===m.id?null:m.id)}>
                      <div className={(isMine?"bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl rounded-br-md":"bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-100")+" px-4 py-2.5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"}>
                        <p className="text-sm leading-relaxed">{m.content}</p>
                        <p className={"text-[10px] mt-1 "+(isMine?"text-rose-200":"text-gray-400")}>{formatTime(m.createdAt)}{isMine&&m.read&&" · ✓✓ Read"}</p>
                      </div>
                      {selectedMsg===m.id && (
                        <div className={"absolute top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden w-48 " + (isMine?"right-0":"left-0")}>
                          <button onClick={(e)=>{e.stopPropagation();deleteMessage(m.id,"me");}} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"><Trash2 className="w-4 h-4"/> Delete for me</button>
                          {isMine && <button onClick={(e)=>{e.stopPropagation();deleteMessage(m.id,"everyone");}} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left"><Trash2 className="w-4 h-4"/> Delete for everyone</button>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={endRef}/>
          </div>

          {limitHit&&(
            <div className="mx-4 mb-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1"><p className="text-sm font-bold text-amber-800">Daily limit reached</p><p className="text-xs text-amber-600">Upgrade for unlimited messages</p></div>
              <Link href="/dashboard/upgrade" className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold">Upgrade</Link>
            </div>
          )}

          <div className="relative border-t border-gray-100 bg-white">
            {showEmoji&&<div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-100 p-3 shadow-lg"><div className="flex flex-wrap gap-1.5">{EMOJIS.map(e=><button key={e} onClick={()=>addEmoji(e)} className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg">{e}</button>)}</div></div>}
            <div className="flex items-center gap-2 p-3">
              {isRecording ? (
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-1 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-bold text-red-500">{formatRecTime(recordingTime)}</span>
                    <span className="text-xs text-red-400 flex-1">Recording...</span>
                  </div>
                  <button onClick={cancelRecording} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0 hover:bg-red-100 hover:text-red-500"><X className="w-5 h-5"/></button>
                  <button onClick={stopRecording} className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center text-white flex-shrink-0 hover:bg-red-600"><div className="w-3.5 h-3.5 bg-white rounded-sm"/></button>
                </div>
              ) : audioUrl ? (
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-1 bg-violet-50 border border-violet-200 rounded-2xl px-3 py-2">
                    <span className="text-sm">🎤</span>
                    <audio controls className="flex-1 h-8" src={audioUrl} />
                  </div>
                  <button onClick={cancelRecording} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0 hover:bg-red-100 hover:text-red-500"><X className="w-5 h-5"/></button>
                  <button onClick={sendVoiceMessage} className="w-9 h-9 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white flex-shrink-0 hover:shadow-lg"><Send className="w-4 h-4"/></button>
                </div>
              ) : (
                <>
                  <button onClick={()=>setShowEmoji(!showEmoji)} className={"w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 "+(showEmoji?"bg-rose-100 text-rose-500":"bg-gray-100 text-gray-400")}><Smile className="w-5 h-5"/></button>
                  <input ref={imageRef} type="file" accept="image/*" onChange={handleImageSend} className="hidden"/>
                  <button onClick={()=>imageRef.current?.click()} className="w-9 h-9 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0 hover:bg-emerald-100 hover:text-emerald-500"><ImageIcon className="w-5 h-5"/></button>
                  <input ref={inputRef} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder={limitHit?"Upgrade to send more...":"Type a message..."} value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} onFocus={()=>setShowEmoji(false)} disabled={limitHit}/>
                  {newMsg.trim() ? (
                    <button onClick={()=>sendMessage()} disabled={sending||limitHit} className="w-9 h-9 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"><Send className="w-4 h-4"/></button>
                  ) : (
                    <button onClick={startRecording} disabled={limitHit} className="w-9 h-9 rounded-full bg-violet-100 text-violet-500 flex items-center justify-center flex-shrink-0 hover:bg-violet-200 disabled:opacity-40"><Mic className="w-5 h-5"/></button>
                  )}
                </>
              )}
            </div>
          </div>
        </>) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50"><div className="text-center"><MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4"/><h3 className="text-xl font-bold text-gray-400">Select a conversation</h3></div></div>
        )}
      </div>
    </div>
  );
}
