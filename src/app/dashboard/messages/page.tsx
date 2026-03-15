"use client";
import { useState, useEffect, useRef } from "react";
import { useUser } from "../layout";
import { Send, ArrowLeft, Shield, MessageCircle, Search, Heart, Smile, Crown, Lock } from "lucide-react";
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
  const endRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadConversations = async () => {
    const res = await fetch("/api/messages");
    if (res.ok) { const d = await res.json(); setConvos(d.conversations || []); }
    setLoading(false);
  };

  useEffect(() => { loadConversations(); }, []);

  const openChat = async (partner: Partner) => {
    setActivePartner(partner);
    setShowEmoji(false);
    setLimitHit(false);
    const res = await fetch("/api/messages?partnerId=" + partner.id);
    if (res.ok) { const d = await res.json(); setMessages(d.messages || []); }
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const r = await fetch("/api/messages?partnerId=" + partner.id);
      if (r.ok) { const d = await r.json(); setMessages(d.messages || []); }
    }, 3000);
  };

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !activePartner || sending) return;
    setSending(true);
    setLimitHit(false);
    const res = await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId: activePartner.id, content: newMsg.trim() }) });
    if (res.status === 403) {
      const data = await res.json();
      if (data.limited) { setLimitHit(true); setSending(false); return; }
    }
    setNewMsg("");
    setShowEmoji(false);
    const r2 = await fetch("/api/messages?partnerId=" + activePartner.id);
    if (r2.ok) { const d = await r2.json(); setMessages(d.messages || []); }
    setSending(false);
    loadConversations();
  };

  const addEmoji = (emoji: string) => { setNewMsg(prev => prev + emoji); inputRef.current?.focus(); };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m";
    if (diff < 86400000) return date.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    return date.toLocaleDateString([], { month:"short", day:"numeric" });
  };

  const filteredConvos = convos.filter(c => !search || c.partner.name.toLowerCase().includes(search.toLowerCase()));
  if (!user) return null;

  return (
    <div className="h-[calc(100vh-7rem)] flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={"w-full md:w-80 border-r border-gray-100 flex flex-col " + (activePartner ? "hidden md:flex" : "flex")}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Messages</h2>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2"><Search className="w-4 h-4 text-gray-400" /><input className="bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 w-full" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" /></div> : filteredConvos.length === 0 ? (
            <div className="p-8 text-center"><div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4"><Heart className="w-8 h-8 text-rose-400" /></div><h3 className="font-bold text-gray-900 mb-1">No messages yet</h3><p className="text-sm text-gray-500">Match with someone to start chatting!</p></div>
          ) : (
            filteredConvos.map(c => (
              <button key={c.partner.id} onClick={() => openChat(c.partner)} className={"w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-all text-left border-b border-gray-50 " + (activePartner?.id === c.partner.id ? "bg-rose-50" : "")}>
                <div className="relative flex-shrink-0">
                  {c.partner.profilePhoto ? <img src={c.partner.profilePhoto} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{c.partner.name[0]}</div>}
                  {c.unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{c.unreadCount}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1">{c.partner.name} {c.partner.tier === "verified" && <Shield className="w-3.5 h-3.5 text-blue-500" />}</p><span className="text-[11px] text-gray-400 flex-shrink-0">{c.lastMessage ? formatTime(c.lastMessage.createdAt) : ""}</span></div>
                  <p className={"text-xs truncate mt-0.5 " + (c.unreadCount > 0 ? "text-gray-900 font-semibold" : "text-gray-500")}>{c.lastMessage?.content || "Start chatting!"}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={"flex-1 flex flex-col " + (activePartner ? "flex" : "hidden md:flex")}>
        {activePartner ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
              <button onClick={() => { setActivePartner(null); if (pollRef.current) clearInterval(pollRef.current); loadConversations(); }} className="md:hidden p-1"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
              {activePartner.profilePhoto ? <img src={activePartner.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{activePartner.name[0]}</div>}
              <div><p className="font-bold text-gray-900 flex items-center gap-1">{activePartner.name} {activePartner.tier === "verified" && <Shield className="w-4 h-4 text-blue-500" />}</p><p className="text-xs text-emerald-500">Online</p></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 && <div className="text-center py-12"><p className="text-gray-400 text-sm">Say hello to {activePartner.name}!</p></div>}
              {messages.map(m => {
                const isMine = m.senderId === user.id;
                return (
                  <div key={m.id} className={"flex " + (isMine ? "justify-end" : "justify-start")}>
                    <div className={(isMine ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl rounded-br-md" : "bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-100") + " px-4 py-2.5 max-w-[75%] shadow-sm"}>
                      <p className="text-sm leading-relaxed">{m.content}</p>
                      <p className={"text-[10px] mt-1 " + (isMine ? "text-rose-200" : "text-gray-400")}>{formatTime(m.createdAt)}{isMine && m.read && " · Read"}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Limit warning */}
            {limitHit && (
              <div className="mx-4 mb-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1"><p className="text-sm font-bold text-amber-800">Daily limit reached</p><p className="text-xs text-amber-600">Basic accounts can send 3 messages/day.</p></div>
                <Link href="/dashboard/upgrade" className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs font-bold flex-shrink-0 flex items-center gap-1"><Crown className="w-3 h-3" /> Upgrade</Link>
              </div>
            )}

            <div className="relative border-t border-gray-100 bg-white">
              {showEmoji && (
                <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-100 p-3 shadow-lg">
                  <div className="flex flex-wrap gap-1.5">{EMOJIS.map(e => <button key={e} onClick={() => addEmoji(e)} className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition-all">{e}</button>)}</div>
                </div>
              )}
              <div className="flex items-center gap-2 p-4">
                <button onClick={() => setShowEmoji(!showEmoji)} className={"w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all " + (showEmoji ? "bg-rose-100 text-rose-500" : "bg-gray-100 text-gray-400 hover:bg-gray-200")}><Smile className="w-5 h-5" /></button>
                <input ref={inputRef} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-rose-300 focus:border-transparent" placeholder={limitHit ? "Upgrade to send more messages..." : "Type a message..."} value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} onFocus={() => setShowEmoji(false)} disabled={limitHit} />
                <button onClick={sendMessage} disabled={!newMsg.trim() || sending || limitHit} className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:shadow-lg transition-all disabled:opacity-40 flex-shrink-0"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center"><MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" /><h3 className="text-xl font-bold text-gray-400">Select a conversation</h3><p className="text-sm text-gray-400 mt-1">Or match with someone on Discover</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
