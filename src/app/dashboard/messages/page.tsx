"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useUser, TierBadge } from "../layout";
import { Send, ArrowLeft, X as XIcon, Phone, Video, MoreVertical, Smile, Image as ImageIcon, Mic, Trash2, Shield, Search, Check, CheckCheck } from "lucide-react";
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
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState<string|null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recording, setRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showConvMenu, setShowConvMenu] = useState<string|null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorder = useRef<MediaRecorder|null>(null);
  const typingTimeout = useRef<NodeJS.Timeout|null>(null);
  const lastTypingSent = useRef(0);

  if (!user) return null;

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setConversations(data.conversations || []);
      setLoading(false);
    } catch { setLoading(false); }
  };

  const loadMessages = async (userId: string) => {
    try {
      const res = await fetch("/api/messages?with=" + userId);
      const data = await res.json();
      const prev = messages.length;
      setMessages(data.messages || []);
      setChatUser(data.otherUser || null);
      if ((data.messages || []).length > prev) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
  };

  // Mark messages as read when opening a chat
  const markAsRead = useCallback(async (senderId: string) => {
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId }),
      });
    } catch {}
  }, []);

  // Send typing indicator
  const sendTypingSignal = useCallback(async () => {
    if (!chatWith) return;
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    try {
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: chatWith }),
      });
    } catch {}
  }, [chatWith]);

  // Check if other user is typing
  const checkTyping = useCallback(async () => {
    if (!chatWith) return;
    try {
      const res = await fetch("/api/messages/typing?from=" + chatWith);
      const data = await res.json();
      setIsTyping(data.typing || false);
    } catch {}
  }, [chatWith]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 8000);
    const handleRefresh = () => loadConversations();
    window.addEventListener("connecthub:refresh", handleRefresh);
    return () => { clearInterval(interval); window.removeEventListener("connecthub:refresh", handleRefresh); };
  }, []);

  useEffect(() => {
    if (chatWith) {
      loadMessages(chatWith);
      markAsRead(chatWith);
      const msgInterval = setInterval(() => {
        loadMessages(chatWith);
        markAsRead(chatWith);
      }, 3000);
      const typingInterval = setInterval(checkTyping, 2000);
      return () => { clearInterval(msgInterval); clearInterval(typingInterval); };
    }
  }, [chatWith]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleInputChange = (value: string) => {
    setNewMsg(value);
    if (value.trim()) sendTypingSignal();
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !chatWith) return;
    const msg = newMsg.trim();
    setNewMsg("");
    await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: chatWith, content: msg }) });
    loadMessages(chatWith);
    loadConversations();
  };

  const sendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatWith) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: chatWith, content: "[IMG]" + ev.target?.result }) });
      loadMessages(chatWith);
      loadConversations();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const deleteMessage = async (msgId: string, forEveryone: boolean) => {
    await fetch("/api/messages/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: msgId, deleteFor: forEveryone ? "everyone" : "me" }) });
    setShowMenu(null);
    loadMessages(chatWith!);
  };

  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout|null>(null);
  const recordingStream = useRef<MediaStream|null>(null);

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStream.current = stream;
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        recordingStream.current = null;
        if (recordingTimer.current) clearInterval(recordingTimer.current);
        setRecordingTime(0);
        // Only send if not cancelled
        if (chunks.length > 0 && mr.state !== "inactive") return;
        const blob = new Blob(chunks, { type: "audio/webm" });
        if (blob.size < 1000) { setRecording(false); return; }
        const reader = new FileReader();
        reader.onload = async (ev) => {
          if (chatWith) {
            await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: chatWith, content: "[VOICE]" + ev.target?.result }) });
            loadMessages(chatWith);
            loadConversations();
          }
        };
        reader.readAsDataURL(blob);
        setRecording(false);
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
      setRecordingTime(0);
      recordingTimer.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch { alert("Microphone access required to send voice messages"); }
  };

  const stopVoice = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
    setRecording(false);
  };

  const cancelVoice = () => {
    if (recordingStream.current) {
      recordingStream.current.getTracks().forEach(t => t.stop());
      recordingStream.current = null;
    }
    if (mediaRecorder.current) {
      try { mediaRecorder.current.stop(); } catch {}
      mediaRecorder.current = null;
    }
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setRecordingTime(0);
    setRecording(false);
  };

  const formatRecordTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  };

  const clearChat = async (userId: string) => {
    if (!confirm("Clear all messages with this person?")) return;
    await fetch("/api/messages/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clearWith: userId }) });
    setShowConvMenu(null);
    loadConversations();
    if (chatWith === userId) setMessages([]);
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m";
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations.filter(c =>
    c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chat view
  if (chatWith) {
    return (
      <div className={"flex flex-col h-[calc(100vh-5rem)] " + (dc ? "bg-gray-900" : "bg-white")}>
        {/* Chat header */}
        <div className={"flex items-center gap-3 px-4 py-3 border-b " + (dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white")}>
          <button onClick={() => { setChatWith(null); setChatUser(null); setMessages([]); setIsTyping(false); loadConversations(); }} className={"p-2 rounded-lg " + (dc ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500")}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          {chatUser && (
            <Link href={"/dashboard/profile/" + chatUser.id} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <img src={chatUser.profilePhoto || "/default-avatar.png"} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-rose-100" />
                <div className={"absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 " + (dc ? "border-gray-800" : "border-white") + (chatUser.isOnline ? " bg-emerald-400" : " bg-gray-300")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={"font-semibold text-sm truncate flex items-center gap-1.5 " + (dc ? "text-white" : "text-gray-900")}>
                  {chatUser.name} {chatUser.verified && <Shield className="w-3.5 h-3.5 text-blue-500 fill-blue-500 flex-shrink-0" />}
                </p>
                {isTyping ? (
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                    typing
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-1 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-1 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </p>
                ) : (
                  <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>
                    {chatUser.isOnline ? "Online" : chatUser.lastSeen ? formatTime(chatUser.lastSeen) + " ago" : "Offline"}
                  </p>
                )}
              </div>
            </Link>
          )}
          <button onClick={() => { window.dispatchEvent(new CustomEvent("startCall", { detail: { receiverId: chatUser.id, receiverName: chatUser.name, receiverPhoto: chatUser.profilePhoto, type: "voice" } })); }} className={"p-2.5 rounded-lg " + (dc ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500")}><Phone className="w-5 h-5" /></button>
          <button onClick={() => { window.dispatchEvent(new CustomEvent("startCall", { detail: { receiverId: chatUser.id, receiverName: chatUser.name, receiverPhoto: chatUser.profilePhoto, type: "video" } })); }} className={"p-2.5 rounded-lg " + (dc ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500")}><Video className="w-5 h-5" /></button>
        </div>

        {/* Messages area */}
        <div className={"flex-1 overflow-y-auto px-4 py-4 space-y-1 " + (dc ? "bg-gray-900" : "bg-gradient-to-b from-rose-50/30 to-white")}>
          {messages.map((msg: any, i: number) => {
            const isMine = msg.senderId === user.id;
            const isDeleted = msg.content?.startsWith("[DELETED]");
            const isImage = msg.content?.startsWith("[IMG]");
            const isVoice = msg.content?.startsWith("[VOICE]");
            const content = isDeleted ? "This message was deleted" : isImage || isVoice ? null : msg.content;
            const imgSrc = isImage ? msg.content.replace("[IMG]", "") : null;
            const voiceSrc = isVoice ? msg.content.replace("[VOICE]", "") : null;
            const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1]?.createdAt).toDateString();

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className={"text-[10px] font-medium px-3 py-1 rounded-full " + (dc ? "bg-gray-800 text-gray-500" : "bg-gray-100 text-gray-400")}>
                      {new Date(msg.createdAt).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
                <div className={"flex " + (isMine ? "justify-end" : "justify-start")} onClick={() => !isDeleted && setShowMenu(showMenu === msg.id ? null : msg.id)}>
                  <div className={"relative max-w-[75%] rounded-2xl px-3.5 py-2 " + (isDeleted ? (dc ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-200") : isMine ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white" : (dc ? "bg-gray-800 text-white" : "bg-white text-gray-800 shadow-sm border border-gray-100"))}>
                    {isDeleted && <p className={"text-xs italic " + (dc ? "text-gray-500" : "text-gray-400")}>🚫 This message was deleted</p>}
                    {content && <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{content}</p>}
                    {imgSrc && <img src={imgSrc} alt="" className="max-w-full rounded-xl max-h-60 object-cover" />}
                    {voiceSrc && (
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <button onClick={(e) => { e.stopPropagation(); const a = document.getElementById("voice-" + msg.id) as HTMLAudioElement; a?.paused ? a?.play() : a?.pause(); }} className={"w-8 h-8 rounded-full flex items-center justify-center " + (isMine ? "bg-white/20" : (dc ? "bg-gray-700" : "bg-rose-100"))}>
                          <Mic className={"w-4 h-4 " + (isMine ? "text-white" : "text-rose-500")} />
                        </button>
                        <div className="flex-1 flex items-center gap-0.5">{[...Array(12)].map((_, i) => <div key={i} className={"w-1 rounded-full " + (isMine ? "bg-white/40" : (dc ? "bg-gray-600" : "bg-rose-200"))} style={{ height: Math.random() * 16 + 4 }} />)}</div>
                        <audio id={"voice-" + msg.id} src={voiceSrc} />
                      </div>
                    )}
                    {!isDeleted && (
                      <div className={"flex items-center gap-1 mt-0.5 " + (isMine ? "justify-end" : "justify-start")}>
                        <span className={"text-[10px] " + (isMine ? "text-white/60" : (dc ? "text-gray-600" : "text-gray-400"))}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMine && (
                          msg.read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-white/50" />
                          )
                        )}
                      </div>
                    )}

                    {/* Message actions menu */}
                    {showMenu === msg.id && !isDeleted && (
                      <div className={"absolute z-20 " + (isMine ? "right-0" : "left-0") + " top-full mt-1 rounded-xl shadow-xl border overflow-hidden min-w-[160px] " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                        <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id, false); }} className={"w-full flex items-center gap-2 px-4 py-2.5 text-sm " + (dc ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-50")}>
                          <Trash2 className="w-3.5 h-3.5" /> Delete for me
                        </button>
                        {isMine && (
                          <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id, true); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50">
                            <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator bubble */}
          {isTyping && (
            <div className="flex justify-start">
              <div className={"rounded-2xl px-4 py-3 " + (dc ? "bg-gray-800" : "bg-white shadow-sm border border-gray-100")}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.6s" }} />
                  <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.6s" }} />
                  <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.6s" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className={"px-4 py-3 border-t " + (dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white")}>
          {showEmoji && (
            <div className={"flex flex-wrap gap-1 mb-3 p-2 rounded-xl " + (dc ? "bg-gray-700" : "bg-gray-50")}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => { setNewMsg(prev => prev + e); setShowEmoji(false); }} className="text-xl p-1.5 hover:bg-white/50 rounded-lg transition-colors">{e}</button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEmoji(!showEmoji)} className={"p-2 rounded-lg transition-colors " + (dc ? "text-gray-400 hover:text-rose-400 hover:bg-gray-700" : "text-gray-400 hover:text-rose-500 hover:bg-rose-50")}>
              <Smile className="w-5 h-5" />
            </button>
            <label className={"p-2 rounded-lg cursor-pointer transition-colors " + (dc ? "text-gray-400 hover:text-rose-400 hover:bg-gray-700" : "text-gray-400 hover:text-rose-500 hover:bg-rose-50")}>
              <ImageIcon className="w-5 h-5" />
              <input type="file" accept="image/*" className="hidden" onChange={sendImage} />
            </label>
            <input
              value={newMsg}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Type a message..."
              className={"flex-1 py-2.5 px-4 rounded-xl text-sm outline-none transition-colors " + (dc ? "bg-gray-700 text-white placeholder-gray-500 focus:ring-1 focus:ring-rose-500" : "bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-1 focus:ring-rose-300 focus:bg-white")}
            />
            {recording ? (
              <button onClick={stopVoice} className="p-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-95 animate-pulse">
                <Send className="w-5 h-5" />
              </button>
            ) : newMsg.trim() ? (
              <button onClick={sendMessage} className="p-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-95">
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={startVoice}
                className={"p-2.5 rounded-xl transition-all " + (dc ? "text-gray-400 hover:text-rose-400 hover:bg-gray-700" : "text-gray-400 hover:text-rose-500 hover:bg-rose-50")}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
          {recording && (
            <div className={"flex items-center justify-between mt-2 px-2 py-2 rounded-xl " + (dc ? "bg-gray-700" : "bg-rose-50")}>
              <button onClick={cancelVoice} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
                ✕ Cancel
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className={"text-xs font-bold tabular-nums " + (dc ? "text-rose-400" : "text-rose-600")}>{formatRecordTime(recordingTime)}</span>
              </div>
              <button onClick={stopVoice} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 rounded-lg hover:shadow-md transition-all">
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Conversation list view
  return (
    <div className={"h-[calc(100vh-5rem)] flex flex-col " + (dc ? "bg-gray-900" : "bg-white")}>
      <div className={"px-4 pt-4 pb-2 " + (dc ? "bg-gray-800" : "bg-white")}>
        <h1 className={"text-xl font-bold mb-3 " + (dc ? "text-white" : "text-gray-900")}>Messages</h1>
        <div className={"flex items-center gap-2 px-3 py-2 rounded-xl " + (dc ? "bg-gray-700" : "bg-gray-50")}>
          <Search className={"w-4 h-4 " + (dc ? "text-gray-500" : "text-gray-400")} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className={"flex-1 bg-transparent text-sm outline-none " + (dc ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400")}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 px-6">
            <div className={"w-16 h-16 rounded-full flex items-center justify-center mb-4 " + (dc ? "bg-gray-800" : "bg-rose-50")}>
              <Send className={"w-7 h-7 " + (dc ? "text-gray-600" : "text-rose-300")} />
            </div>
            <p className={"font-semibold " + (dc ? "text-gray-400" : "text-gray-500")}>No conversations yet</p>
            <p className={"text-sm mt-1 " + (dc ? "text-gray-600" : "text-gray-400")}>Start matching to begin chatting!</p>
          </div>
        ) : (
          filteredConversations.map((conv: any) => (
            <div key={conv.user.id} className={"relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors " + (dc ? "hover:bg-gray-800" : "hover:bg-rose-50/50") + (conv.unreadCount > 0 ? (dc ? " bg-gray-800/50" : " bg-rose-50/30") : "")}>
              <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setChatWith(conv.user.id)}>
                <div className="relative flex-shrink-0">
                  <img src={conv.user.profilePhoto || "/default-avatar.png"} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-rose-100" />
                  <div className={"absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 " + (dc ? "border-gray-900" : "border-white") + (conv.user.isOnline ? " bg-emerald-400" : " bg-gray-300")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={"text-sm font-semibold truncate flex items-center gap-1.5 " + (dc ? "text-white" : "text-gray-900")}>
                      {conv.user.name} {conv.user.verified && <Shield className="w-3 h-3 text-blue-500 fill-blue-500 flex-shrink-0" />}
                    </p>
                    <span className={"text-[10px] flex-shrink-0 " + (dc ? "text-gray-600" : "text-gray-400")}>{formatTime(conv.lastMessage?.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={"text-xs truncate flex-1 mr-2 " + (conv.unreadCount > 0 ? (dc ? "text-white font-medium" : "text-gray-900 font-medium") : (dc ? "text-gray-500" : "text-gray-400"))}>
                      {conv.lastMessage?.senderId === user.id && (
                        <span className="inline-flex items-center mr-1">
                          {conv.lastMessage?.read ? <CheckCheck className="w-3 h-3 text-sky-400 inline" /> : <Check className="w-3 h-3 text-gray-400 inline" />}
                        </span>
                      )}
                      {conv.lastMessage?.content?.startsWith("[DELETED]") ? "🚫 Message deleted" : conv.lastMessage?.content?.startsWith("[IMG]") ? "📷 Photo" : conv.lastMessage?.content?.startsWith("[VOICE]") ? "🎤 Voice message" : conv.lastMessage?.content?.substring(0, 40) || "Start chatting"}
                    </p>
                    {conv.unreadCount > 0 && <span className="w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>}
                  </div>
                </div>
              </div>

              {/* Conversation menu */}
              <button onClick={(e) => { e.stopPropagation(); setShowConvMenu(showConvMenu === conv.user.id ? null : conv.user.id); }} className={"p-1.5 rounded-lg " + (dc ? "text-gray-600 hover:bg-gray-700" : "text-gray-300 hover:bg-gray-100")}>
                <MoreVertical className="w-4 h-4" />
              </button>
              {showConvMenu === conv.user.id && (
                <div className={"absolute right-4 top-12 z-20 rounded-xl shadow-xl border overflow-hidden min-w-[150px] " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                  <Link href={"/dashboard/profile/" + conv.user.id} className={"flex items-center gap-2 px-4 py-2.5 text-sm " + (dc ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-50")} onClick={() => setShowConvMenu(null)}>View Profile</Link>
                  <button onClick={() => clearChat(conv.user.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50">Clear Chat</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
