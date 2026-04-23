"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useUser, TierBadge } from "../layout";
import { Send, ArrowLeft, Phone, Video, MoreVertical, Smile, Image as ImageIcon, Mic, Trash2, Shield, Search } from "lucide-react";
import Link from "next/link";

const EMOJIS = ["😀","😂","🥰","😍","😘","🤗","😊","❤️","🔥","💕","✨","💯","👋","🎉","💐","🌹"];

export default function MessagesPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const searchParams = useSearchParams();
  const autoUser = searchParams.get("user");
  const [conversations, setConversations] = useState<any[]>([]);
  const [chatWith, setChatWith] = useState<string|null>(autoUser);
  const [chatUser, setChatUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [showDelete, setShowDelete] = useState<string|null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) { const d = await res.json(); setConversations(d.conversations || []); }
    } catch {} finally { setLoading(false); }
  };

  const loadMessages = async (userId: string) => {
    try {
      const res = await fetch("/api/messages?with=" + userId);
      if (res.ok) { const d = await res.json(); setMessages(d.messages || []); }
    } catch {}
  };

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (autoUser && !chatWith) setChatWith(autoUser);
  }, [autoUser]);

  useEffect(() => {
    if (chatWith) {
      loadMessages(chatWith);
      const conv = conversations.find(c => c.user?.id === chatWith);
      if (conv) setChatUser(conv.user);
      else {
        fetch("/api/users/profile?id=" + chatWith).then(r => r.json()).then(d => { if (d.user) setChatUser(d.user); }).catch(() => {});
      }
      const i = setInterval(() => loadMessages(chatWith), 3000);
      return () => clearInterval(i);
    }
  }, [chatWith]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !chatWith) return;
    setSending(true);
    await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId: chatWith, content: newMsg.trim() }) });
    setNewMsg(""); setSending(false); setShowEmoji(false);
    loadMessages(chatWith);
  };

  const sendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !chatWith) return;
    if (file.size > 5*1024*1024) { alert("Max 5MB"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId: chatWith, content: "[IMG]" + ev.target?.result }) });
      loadMessages(chatWith);
    };
    reader.readAsDataURL(file);
    if (imageRef.current) imageRef.current.value = "";
  };

  const deleteMessage = async (msgId: string, forEveryone: boolean) => {
    await fetch("/api/messages/delete", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ messageId: msgId, deleteFor: forEveryone ? "everyone" : "me" }) });
    setShowDelete(null);
    if (chatWith) loadMessages(chatWith);
  };

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 300000 : false;
  const timeFormat = (d: string) => new Date(d).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  const filtered = searchQ ? conversations.filter(c => c.user?.name?.toLowerCase().includes(searchQ.toLowerCase())) : conversations;

  if (!user) return null;

  // Chat view
  if (chatWith && chatUser) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Chat header */}
        <div className={"flex items-center gap-3 p-4 border-b " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <button onClick={() => { setChatWith(null); setChatUser(null); }} className={"p-2 rounded-lg " + (dc?"hover:bg-gray-700 text-gray-400":"hover:bg-gray-100 text-gray-500")}><ArrowLeft className="w-5 h-5" /></button>
          <Link href={"/dashboard/user?id=" + chatUser.id} className="flex items-center gap-3 flex-1">
            <div className="relative">
              {chatUser.profilePhoto ? <img src={chatUser.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">{chatUser.name?.[0]}</div>}
              {isOnline(chatUser.lastSeen) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>{chatUser.name}</p>
                {chatUser.verified && <Shield className="w-3.5 h-3.5 text-blue-500" />}
              </div>
              <p className={"text-xs " + (isOnline(chatUser.lastSeen)?"text-emerald-500":"text-gray-400")}>{isOnline(chatUser.lastSeen) ? "Online" : "Offline"}</p>
            </div>
          </Link>
          <button onClick={()=>{window.dispatchEvent(new CustomEvent("startCall",{detail:{receiverId:chatUser.id,receiverName:chatUser.name,receiverPhoto:chatUser.profilePhoto,type:"voice"}}))}} className={"p-2.5 rounded-lg " + (dc?"hover:bg-gray-700 text-gray-400":"hover:bg-gray-100 text-gray-500")}><Phone className="w-5 h-5" /></button>
          <button onClick={()=>{window.dispatchEvent(new CustomEvent("startCall",{detail:{receiverId:chatUser.id,receiverName:chatUser.name,receiverPhoto:chatUser.profilePhoto,type:"video"}}))}} className={"p-2.5 rounded-lg " + (dc?"hover:bg-gray-700 text-gray-400":"hover:bg-gray-100 text-gray-500")}><Video className="w-5 h-5" /></button>
        </div>

        {/* Messages */}
        <div className={"flex-1 overflow-y-auto p-4 space-y-3 " + (dc?"bg-gray-900":"bg-gray-50")}>
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>No messages yet. Say hello!</p>
            </div>
          )}
          {messages.map((msg: any) => {
            const isMine = msg.senderId === user.id;
            const isDeleted = msg.content?.startsWith("[DELETED]");
            const isImage = msg.content?.startsWith("[IMG]");
            const content = isDeleted ? "This message was deleted" : isImage ? null : msg.content;
            const imgSrc = isImage ? msg.content.replace("[IMG]", "") : null;

            return (
              <div key={msg.id} className={"flex " + (isMine ? "justify-end" : "justify-start")}>
                <div className="relative group max-w-[75%]">
                  <div className={
                    isDeleted ? "px-4 py-2.5 rounded-2xl text-sm italic " + (dc?"bg-gray-800 text-gray-500":"bg-gray-200 text-gray-400") :
                    isMine ? "px-4 py-2.5 rounded-2xl text-sm bg-gradient-to-r from-rose-500 to-pink-500 text-white" :
                    "px-4 py-2.5 rounded-2xl text-sm " + (dc?"bg-gray-800 text-white":"bg-white text-gray-900 border border-gray-100")
                  }>
                    {imgSrc && <img src={imgSrc} className="rounded-xl max-w-full max-h-60 object-cover mb-1" />}
                    {content && <p>{content}</p>}
                    <p className={"text-[10px] mt-1 " + (isMine?"text-white/60":dc?"text-gray-500":"text-gray-400")}>{timeFormat(msg.createdAt)}</p>
                  </div>

                  {/* Delete option */}
                  {!isDeleted && (
                    <button onClick={() => setShowDelete(showDelete === msg.id ? null : msg.id)} className={"absolute top-1 opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity " + (isMine?"-left-6":"−right-6") + " " + (dc?"text-gray-500 hover:text-white":"text-gray-300 hover:text-gray-600")}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {showDelete === msg.id && (
                    <div className={"absolute top-8 z-10 rounded-xl border shadow-xl p-2 min-w-[160px] " + (isMine?"right-0":"left-0") + " " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200")}>
                      <button onClick={() => deleteMessage(msg.id, false)} className={"w-full text-left px-3 py-2 rounded-lg text-xs font-medium " + (dc?"text-gray-300 hover:bg-gray-700":"text-gray-700 hover:bg-gray-50")}>Delete for me</button>
                      {isMine && <button onClick={() => deleteMessage(msg.id, true)} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50">Delete for everyone</button>}
                      <button onClick={() => setShowDelete(null)} className={"w-full text-left px-3 py-2 rounded-lg text-xs " + (dc?"text-gray-500 hover:bg-gray-700":"text-gray-400 hover:bg-gray-50")}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji panel */}
        {showEmoji && (
          <div className={"flex flex-wrap gap-1 p-3 border-t " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
            {EMOJIS.map(e => <button key={e} onClick={() => setNewMsg(p => p + e)} className="w-9 h-9 text-lg rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center">{e}</button>)}
          </div>
        )}

        {/* Input */}
        <div className={"flex items-center gap-2 p-3 border-t " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <input ref={imageRef} type="file" accept="image/*" onChange={sendImage} className="hidden" />
          <button onClick={() => imageRef.current?.click()} className={"p-2 rounded-lg " + (dc?"text-gray-400 hover:bg-gray-700":"text-gray-500 hover:bg-gray-100")}><ImageIcon className="w-5 h-5" /></button>
          <button onClick={() => setShowEmoji(!showEmoji)} className={"p-2 rounded-lg " + (showEmoji?"text-amber-500":(dc?"text-gray-400 hover:bg-gray-700":"text-gray-500 hover:bg-gray-100"))}><Smile className="w-5 h-5" /></button>
          <input className={"flex-1 px-4 py-2.5 rounded-full border text-sm outline-none " + (dc?"bg-gray-700 border-gray-600 text-white placeholder-gray-500":"bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200")} placeholder="Type a message..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()} />
          <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 hover:shadow-lg"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  // Conversation list
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={"text-2xl font-bold mb-4 " + (dc?"text-white":"text-gray-900")}>Messages</h1>

      <div className="mb-4">
        <div className={"flex items-center gap-2 px-4 py-2.5 rounded-xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200")}>
          <Search className={"w-4 h-4 " + (dc?"text-gray-500":"text-gray-400")} />
          <input className={"flex-1 outline-none text-sm bg-transparent " + (dc?"text-white placeholder-gray-500":"text-gray-900 placeholder-gray-400")} placeholder="Search conversations..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div> :
      filtered.length === 0 ? (
        <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <div className="text-5xl mb-4">💬</div>
          <p className={"font-bold mb-1 " + (dc?"text-white":"text-gray-900")}>No messages yet</p>
          <p className={"text-sm mb-4 " + (dc?"text-gray-500":"text-gray-400")}>Start a conversation with your matches!</p>
          <Link href="/dashboard" className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold">Discover People</Link>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((conv: any) => (
            <button key={conv.user?.id} onClick={() => setChatWith(conv.user?.id)} className={"w-full flex items-center gap-3 p-4 rounded-xl transition-all " + (dc?"hover:bg-gray-800":"hover:bg-gray-50")}>
              <div className="relative flex-shrink-0">
                {conv.user?.profilePhoto ? <img src={conv.user.profilePhoto} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{conv.user?.name?.[0]}</div>}
                {isOnline(conv.user?.lastSeen) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className={"font-bold text-sm truncate " + (dc?"text-white":"text-gray-900")}>{conv.user?.name}</p>
                  <span className={"text-[10px] flex-shrink-0 " + (dc?"text-gray-500":"text-gray-400")}>{conv.lastMessage ? timeFormat(conv.lastMessage.createdAt) : ""}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={"text-xs truncate " + (conv.unreadCount > 0?(dc?"text-white font-medium":"text-gray-900 font-medium"):(dc?"text-gray-500":"text-gray-400"))}>{conv.lastMessage?.content?.startsWith("[IMG]") ? "📷 Photo" : conv.lastMessage?.content?.startsWith("[VOICE]") ? "🎤 Voice" : conv.lastMessage?.content?.substring(0, 40) || "Start chatting"}</p>
                  {conv.unreadCount > 0 && <span className="w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
