"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../layout";
import { Send, ArrowLeft, Shield, MessageCircle, Search, Heart, Smile, Phone, Video, Image as ImageIcon, X, PhoneOff, Mic, MicOff, VideoOff } from "lucide-react";
import Link from "next/link";

type Partner = { id:string; name:string; profilePhoto:string|null; tier:string; };
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
  const [limitHit, setLimitHit] = useState(false);
  const [calling, setCalling] = useState<"voice"|"video"|null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout|null>(null);
  const callTimerRef = useRef<NodeJS.Timeout|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);

  const loadConversations = async () => { const res = await fetch("/api/messages"); if (res.ok) { const d = await res.json(); setConvos(d.conversations||[]); } setLoading(false); };
  useEffect(() => { loadConversations(); }, []);

  const openChat = async (partner: Partner) => {
    setActivePartner(partner); setShowEmoji(false); setLimitHit(false); setCalling(null);
    const res = await fetch("/api/messages?partnerId="+partner.id);
    if (res.ok) { const d = await res.json(); setMessages(d.messages||[]); }
    setTimeout(() => endRef.current?.scrollIntoView({behavior:"smooth"}), 100);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => { const r = await fetch("/api/messages?partnerId="+partner.id); if (r.ok) { const d = await r.json(); setMessages(d.messages||[]); } }, 3000);
  };

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); endCall(); }; }, []);
  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const sendMessage = async (content?: string) => {
    const msg = content || newMsg.trim();
    if (!msg || !activePartner || sending) return;
    setSending(true); setLimitHit(false);
    const res = await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId:activePartner.id, content:msg }) });
    if (res.status===403) { const d = await res.json(); if (d.limited) { setLimitHit(true); setSending(false); return; } }
    if (!content) setNewMsg("");
    setShowEmoji(false);
    const r2 = await fetch("/api/messages?partnerId="+activePartner.id);
    if (r2.ok) { const d = await r2.json(); setMessages(d.messages||[]); }
    setSending(false); loadConversations();
  };

  const handleImageSend = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 3*1024*1024) { alert("Max 3MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { sendMessage("[IMG]"+(ev.target?.result as string)); };
    reader.readAsDataURL(file);
    if (imageRef.current) imageRef.current.value = "";
  };

  const startCall = useCallback(async (type: "voice"|"video") => {
    try {
      const constraints = type === "video" ? { video:true, audio:true } : { audio:true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (type === "video" && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      setCalling(type);
      setCallTimer(0);
      callTimerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
      // Send call notification message
      if (activePartner) {
        await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId:activePartner.id, content:type==="video"?"📹 Video call started":"📞 Voice call started" }) });
      }
    } catch {
      alert("Please allow camera/microphone access");
    }
  }, [activePartner]);

  const endCall = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    setCalling(null); setCallTimer(0);
  }, []);

  const formatCallTime = (s: number) => {
    const m = Math.floor(s/60); const sec = s%60;
    return `${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
  };

  const isImage = (content: string) => content.startsWith("[IMG]data:image");
  const getImageSrc = (content: string) => content.replace("[IMG]","");
  const addEmoji = (emoji: string) => { setNewMsg(p => p+emoji); inputRef.current?.focus(); };
  const formatTime = (d: string) => { const diff = Date.now()-new Date(d).getTime(); if(diff<60000) return "Now"; if(diff<3600000) return Math.floor(diff/60000)+"m"; if(diff<86400000) return new Date(d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); return new Date(d).toLocaleDateString([],{month:"short",day:"numeric"}); };
  const filteredConvos = convos.filter(c => !search||c.partner.name.toLowerCase().includes(search.toLowerCase()));
  if (!user) return null;

  return (
    <div className="h-[calc(100vh-7rem)] flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Conversation List */}
      <div className={"w-full md:w-80 border-r border-gray-100 flex flex-col " + (activePartner?"hidden md:flex":"flex")}>
        <div className="p-4 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900 mb-3">Messages</h2><div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2"><Search className="w-4 h-4 text-gray-400" /><input className="bg-transparent border-none outline-none text-sm w-full" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} /></div></div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" /></div> : filteredConvos.length === 0 ? (
            <div className="p-8 text-center"><Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" /><h3 className="font-bold text-gray-900 mb-1">No messages</h3><p className="text-sm text-gray-500">Match with someone to chat!</p></div>
          ) : filteredConvos.map(c => (
            <button key={c.partner.id} onClick={() => openChat(c.partner)} className={"w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-all text-left border-b border-gray-50 " + (activePartner?.id===c.partner.id?"bg-rose-50":"")}>
              <div className="relative flex-shrink-0">{c.partner.profilePhoto ? <img src={c.partner.profilePhoto} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{c.partner.name[0]}</div>}{c.unreadCount>0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{c.unreadCount}</span>}</div>
              <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1">{c.partner.name}{c.partner.tier==="verified"&&<Shield className="w-3.5 h-3.5 text-blue-500"/>}</p><span className="text-[11px] text-gray-400 flex-shrink-0">{c.lastMessage?formatTime(c.lastMessage.createdAt):""}</span></div><p className={"text-xs truncate mt-0.5 "+(c.unreadCount>0?"text-gray-900 font-semibold":"text-gray-500")}>{c.lastMessage?.content?.startsWith("[IMG]")?"📷 Photo":c.lastMessage?.content||"Start chatting!"}</p></div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={"flex-1 flex flex-col " + (activePartner?"flex":"hidden md:flex")}>
        {activePartner ? (<>
          {/* Calling UI */}
          {calling && (
            <div className="absolute inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center">
              {calling === "video" ? (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{transform:"scaleX(-1)"}} />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-8 left-0 right-0 text-center">
                    <p className="text-white font-bold text-lg">{activePartner.name}</p>
                    <p className="text-white/70 text-sm">Video Call · {formatCallTime(callTimer)}</p>
                    <p className="text-emerald-400 text-xs mt-1 animate-pulse">Connected</p>
                  </div>
                  {/* Partner placeholder */}
                  <div className="absolute top-20 right-4 w-28 h-36 bg-gray-800 rounded-xl flex items-center justify-center border-2 border-white/20">
                    {activePartner.profilePhoto ? <img src={activePartner.profilePhoto} className="w-full h-full object-cover rounded-xl" /> : <span className="text-3xl text-white/50 font-bold">{activePartner.name[0]}</span>}
                    <p className="absolute bottom-1 text-[10px] text-white/70 font-semibold">Connecting...</p>
                  </div>
                  <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-4">
                    <button onClick={() => setMicOn(!micOn)} className={"w-14 h-14 rounded-full flex items-center justify-center " + (micOn?"bg-white/20 text-white":"bg-red-500 text-white")}>{micOn?<Mic className="w-6 h-6"/>:<MicOff className="w-6 h-6"/>}</button>
                    <button onClick={endCall} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow-lg"><PhoneOff className="w-7 h-7" /></button>
                    <button onClick={() => setCamOn(!camOn)} className={"w-14 h-14 rounded-full flex items-center justify-center " + (camOn?"bg-white/20 text-white":"bg-red-500 text-white")}>{camOn?<Video className="w-6 h-6"/>:<VideoOff className="w-6 h-6"/>}</button>
                  </div>
                </div>
              ) : (
                /* Voice Call UI */
                <div className="text-center">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center mx-auto mb-6 shadow-xl ring-4 ring-rose-500/30 ring-offset-4 ring-offset-gray-900">
                    {activePartner.profilePhoto ? <img src={activePartner.profilePhoto} className="w-full h-full rounded-full object-cover" /> : <span className="text-4xl text-white font-bold">{activePartner.name[0]}</span>}
                  </div>
                  <h2 className="text-white text-2xl font-bold mb-1">{activePartner.name}</h2>
                  <p className="text-emerald-400 text-sm mb-1 animate-pulse">Connected</p>
                  <p className="text-white/50 text-lg font-mono mb-12">{formatCallTime(callTimer)}</p>
                  <div className="flex justify-center gap-6">
                    <button onClick={() => setMicOn(!micOn)} className={"w-14 h-14 rounded-full flex items-center justify-center " + (micOn?"bg-white/10 text-white":"bg-red-500 text-white")}>{micOn?<Mic className="w-6 h-6"/>:<MicOff className="w-6 h-6"/>}</button>
                    <button onClick={endCall} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow-xl"><PhoneOff className="w-7 h-7" /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
            <button onClick={() => { setActivePartner(null); if (pollRef.current) clearInterval(pollRef.current); loadConversations(); }} className="md:hidden p-1"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
            <Link href={"/dashboard/user?id="+activePartner.id}>
              {activePartner.profilePhoto ? <img src={activePartner.profilePhoto} className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-rose-200" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{activePartner.name[0]}</div>}
            </Link>
            <div className="flex-1">
              <Link href={"/dashboard/user?id="+activePartner.id} className="font-bold text-gray-900 hover:text-rose-500 flex items-center gap-1">{activePartner.name}{activePartner.tier==="verified"&&<Shield className="w-4 h-4 text-blue-500"/>}</Link>
              <p className="text-xs text-emerald-500">Online</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => startCall("voice")} className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all" title="Voice Call"><Phone className="w-4 h-4" /></button>
              <button onClick={() => startCall("video")} className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-all" title="Video Call"><Video className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length===0 && <div className="text-center py-12"><p className="text-gray-400 text-sm">Say hello to {activePartner.name}!</p></div>}
            {messages.map(m => {
              const isMine = m.senderId===user.id;
              const img = isImage(m.content);
              return (
                <div key={m.id} className={"flex " + (isMine?"justify-end":"justify-start")}>
                  {img ? (
                    <div className="max-w-[70%]"><img src={getImageSrc(m.content)} className="rounded-2xl max-h-64 object-cover border border-gray-200 shadow-sm" /><p className={"text-[10px] mt-1 " + (isMine?"text-right text-gray-400":"text-gray-400")}>{formatTime(m.createdAt)}{isMine && m.read && " · Read"}</p></div>
                  ) : (
                    <div className={(isMine?"bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl rounded-br-md":"bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-100")+" px-4 py-2.5 max-w-[75%] shadow-sm"}>
                      <p className="text-sm leading-relaxed">{m.content}</p>
                      <p className={"text-[10px] mt-1 " + (isMine?"text-rose-200":"text-gray-400")}>{formatTime(m.createdAt)}{isMine && m.read && " · Read"}</p>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {limitHit && (
            <div className="mx-4 mb-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1"><p className="text-sm font-bold text-amber-800">Daily limit reached</p><p className="text-xs text-amber-600">Upgrade for unlimited messages</p></div>
              <Link href="/dashboard/upgrade" className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold">Upgrade</Link>
            </div>
          )}

          {/* Input */}
          <div className="relative border-t border-gray-100 bg-white">
            {showEmoji && <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-100 p-3 shadow-lg"><div className="flex flex-wrap gap-1.5">{EMOJIS.map(e => <button key={e} onClick={() => addEmoji(e)} className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg">{e}</button>)}</div></div>}
            <div className="flex items-center gap-2 p-3">
              <button onClick={() => setShowEmoji(!showEmoji)} className={"w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 " + (showEmoji?"bg-rose-100 text-rose-500":"bg-gray-100 text-gray-400")}><Smile className="w-5 h-5" /></button>
              <input ref={imageRef} type="file" accept="image/*" onChange={handleImageSend} className="hidden" />
              <button onClick={() => imageRef.current?.click()} className="w-9 h-9 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0 hover:bg-emerald-100 hover:text-emerald-500"><ImageIcon className="w-5 h-5" /></button>
              <input ref={inputRef} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder={limitHit?"Upgrade to send more...":"Type a message..."} value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} onFocus={() => setShowEmoji(false)} disabled={limitHit} />
              <button onClick={() => sendMessage()} disabled={!newMsg.trim()||sending||limitHit} className="w-9 h-9 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </>) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50"><div className="text-center"><MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" /><h3 className="text-xl font-bold text-gray-400">Select a conversation</h3></div></div>
        )}
      </div>
    </div>
  );
}
