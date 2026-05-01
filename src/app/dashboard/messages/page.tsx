"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useUser, TierBadge } from "../layout";
import { Send, ArrowLeft, Play, Pause, Square, X as XIcon, Phone, Video, MoreVertical, Smile, Image as ImageIcon, Mic, Trash2, Shield, Search, Check, CheckCheck, Lock } from "lucide-react";
import Link from "next/link";

const EMOJIS = ["😀","😂","🥰","😍","😘","🤗","😊","❤️","🔥","💕","✨","💯","👋","🎉","💐","🌹"];
const REACTION_EMOJIS = ["❤️","😂","👍","😮","😢","🔥"];

function dataURItoBlob(dataURI: string): { blob: Blob; url: string } | null {
  try {
    const parts = dataURI.split(",");
    if (parts.length < 2) return null;
    const header = parts[0] || "";
    const data = parts[1] || "";
    if (data.length === 0) return null;
    // Extract mime type — handle "data:audio/mp4;codecs=opus;base64" format
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : "audio/webm";
    const binary = atob(data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    const blob = new Blob([array], { type: mime });
    return { blob, url: URL.createObjectURL(blob) };
  } catch (e) {
    console.log("[Voice] Failed to convert data URI:", e);
    return null;
  }
}

function VoicePlayer({ src, msgId, isMine, dark }: { src: string; msgId: string; isMine: boolean; dark: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Convert data URI to Blob URL on mount — much more reliable than data URIs
  useEffect(() => {
    if (src && src.length > 50) {
      const result = dataURItoBlob(src);
      if (result) {
        setBlobUrl(result.url);
      } else {
        setError(true);
      }
    } else {
      setError(true);
    }
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (error) return;
    const audio = audioRef.current;
    if (audio === null) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      // Stop all other playing audio
      document.querySelectorAll("audio").forEach((a: HTMLAudioElement) => {
        if (a !== audio) { a.pause(); a.currentTime = 0; }
      });
      const p = audio.play();
      if (p) p.then(() => setPlaying(true)).catch(() => {
        // Mobile fallback — load then play
        audio.load();
        setTimeout(() => {
          audio.play().then(() => setPlaying(true)).catch(() => setError(true));
        }, 300);
      });
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio === null) return;
    const onMeta = () => { setLoaded(true); if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration); };
    const onTime = () => { setCurrentTime(audio.currentTime || 0); if (audio.duration && isFinite(audio.duration) && duration === 0) setDuration(audio.duration); };
    const onEnd = () => { setPlaying(false); setCurrentTime(0); };
    const onPause = () => setPlaying(false);
    const onErr = () => { setError(true); setPlaying(false); };
    const onCan = () => { setLoaded(true); if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration); };
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("canplaythrough", onCan);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onErr);
    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("canplaythrough", onCan);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onErr);
    };
  }, [blobUrl]);

  const fmtTime = (s: number) => {
    if (s === undefined || isNaN(s) || s <= 0) return "0:00";
    return Math.floor(s / 60) + ":" + (Math.floor(s % 60) < 10 ? "0" : "") + Math.floor(s % 60);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className={"flex items-center gap-2 min-w-[140px] text-xs " + (isMine ? "text-white/50" : (dark ? "text-gray-500" : "text-gray-400"))} onClick={e => e.stopPropagation()}>
        <Mic className="w-4 h-4" /> Voice message
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 min-w-[180px] max-w-[260px]" onClick={e => e.stopPropagation()}>
      <button onClickCapture={togglePlay} className={"w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 " + (isMine ? "bg-white/20 hover:bg-white/30" : (dark ? "bg-gray-700 hover:bg-gray-600" : "bg-rose-100 hover:bg-rose-200"))}>
        {playing ? <Pause className={"w-4 h-4 " + (isMine ? "text-white" : "text-rose-500")} /> : <Play className={"w-4 h-4 ml-0.5 " + (isMine ? "text-white" : "text-rose-500")} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={"w-full h-1.5 rounded-full overflow-hidden " + (isMine ? "bg-white/20" : (dark ? "bg-gray-600" : "bg-rose-200/50"))}>
          <div className={"h-full rounded-full transition-all duration-200 " + (isMine ? "bg-white/70" : "bg-rose-500")} style={{ width: progress + "%" }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className={"text-[10px] " + (isMine ? "text-white/50" : (dark ? "text-gray-500" : "text-gray-400"))}>{fmtTime(currentTime)}</span>
          <span className={"text-[10px] " + (isMine ? "text-white/50" : (dark ? "text-gray-500" : "text-gray-400"))}>{duration > 0 ? fmtTime(duration) : (loaded ? "0:00" : "...")}</span>
        </div>
      </div>
      {blobUrl && <audio ref={audioRef} src={blobUrl} preload="auto" playsInline />}
    </div>
  );
}

export default function MessagesPage() {
  const { user, dark, reload: reloadUser } = useUser();
  const dc = dark;
  const searchParams = useSearchParams();
  const autoUser = searchParams.get("user") || searchParams.get("chat");
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
  const [mediaViewer, setMediaViewer] = useState<{src: string; type: "image"|"video"}|null>(null);
  const [reactions, setReactions] = useState<Record<string, {emoji:string;count:number;mine:boolean}[]>>({});
  const [showReactions, setShowReactions] = useState<string|null>(null);
  const [showGif, setShowGif] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [gifts, setGifts] = useState<any[]>([]);
  const [sendingGift, setSendingGift] = useState<string|null>(null);

  useEffect(() => {
    fetch("/api/messages/gift").then(r => r.json()).then(d => setGifts(d.gifts || [])).catch(() => {});
  }, []);

  const sendGift = async (giftId: string) => {
    if (!chatWith || sendingGift) return;
    setSendingGift(giftId);
    try {
      const res = await fetch("/api/messages/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: chatWith, giftId })
      });
      const data = await res.json();
      if (res.ok) {
        setShowGiftPicker(false);
        loadMessages(chatWith);
        loadConversations();
        reloadUser();
      } else {
        alert(data.error || "Could not send gift");
      }
    } catch {} finally { setSendingGift(null); }
  };
  const [gifQuery, setGifQuery] = useState("");
  const [gifs, setGifs] = useState<string[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);
  const justSentMsg = useRef(false);
  const notifSound = useRef<HTMLAudioElement|null>(null);

  // Detect when user scrolls up to read old messages
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 150;
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [chatWith]);

  useEffect(() => {
    notifSound.current = new Audio("/sounds/notify.wav");
    notifSound.current.volume = 0.4;
  }, []);
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

  const prevMsgCount = useRef(0);
  const loadMessages = async (userId: string) => {
    try {
      const res = await fetch("/api/messages?with=" + userId);
      const data = await res.json();
      const prev = messages.length;
      setMessages(data.messages || []);
      setChatUser(data.otherUser || null);
      if ((data.messages || []).length > prev && !userScrolledUp.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
  };

  // Load reactions for visible messages
  const loadReactions = async (msgs: any[]) => {
    if (!msgs.length) return;
    const ids = msgs.map((m:any) => m.id).join(",");
    try {
      const res = await fetch("/api/messages/react?ids=" + ids);
      if (res.ok) { const d = await res.json(); setReactions(d.reactions || {}); }
    } catch {}
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    await fetch("/api/messages/react", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ messageId, emoji }) });
    setShowReactions(null);
    loadReactions(messages);
  };

  // GIF search
  const searchGifs = async (q: string) => {
    setGifLoading(true);
    try {
      const res = await fetch("https://api.giphy.com/v1/gifs/" + (q ? "search" : "trending") + "?api_key=dc6zaTOxFJmzC&q=" + encodeURIComponent(q) + "&limit=20&rating=pg");
      const d = await res.json();
      setGifs((d.data || []).map((g:any) => g.images?.fixed_height?.url || g.images?.original?.url).filter(Boolean));
    } catch { setGifs([]); }
    setGifLoading(false);
  };

  const sendGif = async (url: string) => {
    if (!chatWith) return;
    setShowGif(false); setGifQuery(""); setGifs([]);
    await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId: chatWith, content: "[GIF]" + url }) });
    loadMessages(chatWith); loadConversations();
  };

  // Mark messages as read when opening a chat
  const markAsRead = useCallback(async (senderId: string) => {
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId }),
      });
      // Refresh unread count in sidebar
      if (typeof reloadUser === "function") reloadUser();
    } catch {}
  }, [reloadUser]);

  // Send typing indicator
  const sendTypingSignal = useCallback(async () => {
    if (!chatWith) return;
    const now = Date.now();
    if (now - lastTypingSent.current < 1000) return;
    lastTypingSent.current = now;
    try {
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: chatWith }),
      });
    } catch {}
  }, [chatWith]);

  const [canSeeRead, setCanSeeRead] = useState(false);
  useEffect(() => { fetch("/api/messages/read").then(r=>r.json()).then(d=>setCanSeeRead(d.canSeeReadReceipts||false)).catch(()=>{}); }, []);

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

  // Clean up typing interval on unmount or chat change
  useEffect(() => {
    return () => { if (typingInterval.current) clearInterval(typingInterval.current); };
  }, [chatWith]);

  useEffect(() => {
    if (chatWith) {
      loadMessages(chatWith);
      markAsRead(chatWith);
      const msgInterval = setInterval(() => {
        loadMessages(chatWith);
        markAsRead(chatWith);
      }, 3000);
      const typingInterval = setInterval(checkTyping, 3000);
      return () => { clearInterval(msgInterval); clearInterval(typingInterval); };
    }
  }, [chatWith]);

  // Load reactions when messages change
  useEffect(() => { if (messages.length) loadReactions(messages); }, [messages.length]);

  useEffect(() => {
    // Only auto-scroll if user just sent a message OR it's the first load
    if (justSentMsg.current || !userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      justSentMsg.current = false;
    }
  }, [messages]);

  const typingInterval = useRef<NodeJS.Timeout|null>(null);

  const handleInputChange = (value: string) => {
    setNewMsg(value);
    if (value.trim()) {
      sendTypingSignal();
      // Keep sending typing signals every 1.5s while text exists
      if (typingInterval.current) clearInterval(typingInterval.current);
      typingInterval.current = setInterval(() => {
        if (newMsg.trim()) sendTypingSignal();
        else if (typingInterval.current) clearInterval(typingInterval.current);
      }, 1500);
    } else {
      // Clear typing when input is empty
      if (typingInterval.current) { clearInterval(typingInterval.current); typingInterval.current = null; }
    }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !chatWith) return;
    const msg = newMsg.trim();
    setNewMsg("");
    if (typingInterval.current) { clearInterval(typingInterval.current); typingInterval.current = null; }
    await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: chatWith, content: msg }) });
    loadMessages(chatWith);
    loadConversations();
  };

  const [uploadingMedia, setUploadingMedia] = useState(false);

  const sendMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !chatWith) return;
    setUploadingMedia(true);

    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i];
      if (!file) continue;

      const isVideo = file.type.startsWith("video/");
      const maxSize = isVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert((isVideo ? "Video" : "Image") + " too large. Max " + (isVideo ? "25MB" : "10MB"));
        continue;
      }

      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });

        // Upload to Cloudinary first
        const uploadRes = await fetch("/api/messages/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: dataUrl, type: isVideo ? "video" : "image" })
        });
        const uploadData = await uploadRes.json();

        if (uploadRes.ok && uploadData.url) {
          const prefix = isVideo ? "[VID]" : "[IMG]";
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ receiverId: chatWith, content: prefix + uploadData.url })
          });
          justSentMsg.current = true;
          loadMessages(chatWith);
          loadConversations();
        } else {
          alert(uploadData.error || "Failed to upload media");
        }
      } catch {
        alert("Failed to upload. Check your connection.");
      }
    }
    setUploadingMedia(false);
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
  const voiceCancelled = useRef(false);

  const startVoice = async () => {
    try {
      voiceCancelled.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStream.current = stream;
      // Pick best supported format — prefer mp4 for iOS compatibility
      const mimeType = [
        "audio/mp4",
        "audio/aac",
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ].find(t => MediaRecorder.isTypeSupported(t)) || "";
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        recordingStream.current = null;
        if (recordingTimer.current) clearInterval(recordingTimer.current);
        setRecordingTime(0);
        setRecording(false);
        // Don't send if cancelled
        if (voiceCancelled.current) { voiceCancelled.current = false; return; }
        if (chunks.length === 0) { console.log("[Voice] No chunks recorded"); return; }
        const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        console.log("[Voice] Blob size:", blob.size, "chunks:", chunks.length, "type:", blob.type);
        if (blob.size < 2000) { console.log("[Voice] Recording too short, discarding"); return; }
        const reader = new FileReader();
        reader.onload = async (ev) => {
          if (chatWith && ev.target?.result) {
            await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: chatWith, content: "[VOICE]" + ev.target.result }) });
            loadMessages(chatWith);
            loadConversations();
          }
        };
        reader.readAsDataURL(blob);
      };
      mr.start(100); // Collect data every 100ms for better chunks
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
  };

  const cancelVoice = () => {
    voiceCancelled.current = true;
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      try { mediaRecorder.current.stop(); } catch {}
    }
    if (recordingStream.current) {
      recordingStream.current.getTracks().forEach(t => t.stop());
      recordingStream.current = null;
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

  // Media viewer modal
  // Media viewer is rendered as stable JSX below, not as a component function



  const ICEBREAKERS = [
    "What's something on your bucket list? ✈️",
    "If you could have dinner with anyone, who would it be? 🍽️",
    "What's the best trip you've ever taken? 🌍",
    "What's your go-to comfort food? 🍕",
    "Morning person or night owl? 🌅",
    "What song is stuck in your head right now? 🎵",
    "What's your hidden talent? ✨",
    "Best movie you've watched recently? 🎬",
    "What's your idea of a perfect date? 💕",
    "If you won the lottery, what's the first thing you'd do? 💰",
  ];
  const [randomBreakers] = useState(() => ICEBREAKERS.sort(() => Math.random() - 0.5).slice(0, 3));

  // Chat view
  if (chatWith) {
    return (
      <div className={"flex flex-col h-[calc(100vh-5rem)] " + (dc ? "bg-gray-900" : "bg-white")}>
        {mediaViewer && (
          <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center">
            <div className="absolute inset-0" onClick={() => setMediaViewer(null)} />
            <div className="absolute top-4 right-4 flex gap-3 z-20">
              <a href={mediaViewer.src} download={"connecthub_media." + (mediaViewer.type === "image" ? "jpg" : "mp4")} className="bg-white/15 backdrop-blur-md hover:bg-white/25 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all border border-white/10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Download
              </a>
              <button onClick={() => setMediaViewer(null)} className="bg-white/15 backdrop-blur-md hover:bg-white/25 text-white p-2.5 rounded-xl transition-all border border-white/10">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="relative z-10 max-w-[95vw] max-h-[85vh] flex items-center justify-center">
              {mediaViewer.type === "image" ? (
                <img src={mediaViewer.src} alt="" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" onClick={() => setMediaViewer(null)} />
              ) : (
                <video key={"stable-vid-" + mediaViewer.src} src={mediaViewer.src} controls playsInline className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" />
              )}
            </div>
            <p className="text-white/40 text-xs mt-4 relative z-10" onClick={() => setMediaViewer(null)}>Tap outside to close</p>
          </div>
        )}
        {/* Chat header */}
        <div className={"flex items-center gap-3 px-4 py-3 border-b " + (dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white")}>
          <button onClick={() => { setChatWith(null); setChatUser(null); setMessages([]); setIsTyping(false); loadConversations(); }} className={"p-2 rounded-lg " + (dc ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500")}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          {chatUser && (
            <Link href={"/dashboard/user?id=" + chatUser.id} className="flex items-center gap-3 flex-1 min-w-0">
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
        <div ref={chatContainerRef} className={"flex-1 overflow-y-auto px-4 py-4 space-y-1 " + (dc ? "bg-gray-900" : "bg-gradient-to-b from-rose-50/30 to-white")}>
          {messages.length === 0 && chatUser && (
            <div className={"text-center py-8 px-4"}>
              <div className="mb-4">
                {chatUser.profilePhoto ? (
                  <img src={chatUser.profilePhoto} className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-rose-100" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold mx-auto">{chatUser.name?.[0]}</div>
                )}
              </div>
              <p className={"text-sm font-bold mb-1 " + (dc ? "text-white" : "text-gray-900")}>Start a conversation with {chatUser.name?.split(" ")[0]}</p>
              <p className={"text-xs mb-5 " + (dc ? "text-gray-500" : "text-gray-400")}>Break the ice with a fun question!</p>
              <div className="space-y-2 max-w-sm mx-auto">
                {randomBreakers.map((q: string, i: number) => (
                  <button key={i} onClick={() => { setMsg(q); }} className={"w-full text-left px-4 py-3 rounded-2xl text-sm transition-all border " + (dc ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-rose-500/30" : "bg-white border-gray-100 text-gray-700 hover:bg-rose-50 hover:border-rose-200 shadow-sm")}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg: any, i: number) => {
            const isMine = msg.senderId === user.id;
            const isDeleted = msg.content?.startsWith("[DELETED]");
            const isImage = msg.content?.startsWith("[IMG]");
            const isVoice = msg.content?.startsWith("[VOICE]");
            const isVid = msg.content?.startsWith("[VID]");
            const isGif = msg.content?.startsWith("[GIF]");
            const content = isDeleted ? "This message was deleted" : isImage || isVoice || isGif || isVid ? null : msg.content;
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
                <div className={"flex " + (isMine ? "justify-end" : "justify-start")} onClick={() => { if (!isDeleted) { setShowMenu(showMenu === msg.id ? null : msg.id); if (showReactions && showReactions !== msg.id) setShowReactions(null); } }}>
                  <div className={"relative max-w-[75%] rounded-2xl px-3.5 py-2 " + (isDeleted ? (dc ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-200") : isMine ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white" : (dc ? "bg-gray-800 text-white" : "bg-white text-gray-800 shadow-sm border border-gray-100"))}>
                    {isDeleted && <p className={"text-xs italic " + (dc ? "text-gray-500" : "text-gray-400")}>🚫 This message was deleted</p>}
                    {content && <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{content}</p>}
                    {imgSrc && (
                      <div className="relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); setMediaViewer({ src: imgSrc, type: "image" }); }}>
                        <img src={imgSrc} alt="" className="max-w-full rounded-xl max-h-60 object-cover hover:brightness-90 transition-all" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/50 backdrop-blur-sm rounded-full p-2"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg></div>
                        </div>
                      </div>
                    )}
                    {msg.content?.startsWith("[GIFT]") && (() => {
                      const parts = msg.content.replace("[GIFT]", "").split("|");
                      const emoji = parts[0] || "🎁";
                      const name = parts[1] || "Gift";
                      const cost = parts[2] || "0";
                      return (
                        <div className={"rounded-2xl p-4 text-center min-w-[140px] " + (isMine ? "bg-white/10" : (dc ? "bg-amber-500/10" : "bg-amber-50"))}>
                          <span className="text-4xl block mb-1 animate-bounce">{emoji}</span>
                          <p className={"text-xs font-bold " + (isMine ? "text-white" : (dc ? "text-amber-400" : "text-amber-700"))}>{name}</p>
                          <p className={"text-[10px] " + (isMine ? "text-white/60" : (dc ? "text-amber-500/60" : "text-amber-500"))}>{cost} coins</p>
                        </div>
                      );
                    })()}
                    {isVid && (
                      <div className="relative rounded-2xl overflow-hidden max-w-[260px]">
                        <video
                          key={"vid-" + msg.id}
                          src={msg.content.replace("[VID]", "")}
                          controls
                          playsInline
                          preload="metadata"
                          loop={false}
                          className="w-full rounded-2xl max-h-[300px]"
                          style={{background:"#000"}}
                        />
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <button onClick={(e) => { e.stopPropagation(); setMediaViewer({ src: msg.content.replace("[VID]", ""), type: "video" }); }} className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white text-xs backdrop-blur-sm hover:bg-black/70 transition-all">⛶</button>
                          {isMine && <button onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === msg.id ? null : msg.id); }} className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white text-xs backdrop-blur-sm hover:bg-black/70 transition-all">⋮</button>}
                        </div>
                      </div>
                    )}
                    {msg.content?.startsWith("[GIF]") && (
                      <img src={msg.content.replace("[GIF]", "")} alt="GIF" className="max-w-[220px] rounded-xl cursor-pointer hover:brightness-90 transition-all" loading="lazy" onClick={(e) => { e.stopPropagation(); setMediaViewer({ src: msg.content.replace("[GIF]", ""), type: "image" }); }} />
                    )}
                    {voiceSrc && (
                      <VoicePlayer src={voiceSrc} msgId={msg.id} isMine={isMine} dark={dc} />
                    )}
                    {!isDeleted && (
                      <div className={"flex items-center gap-1 mt-0.5 " + (isMine ? "justify-end" : "justify-start")}>
                        <span className={"text-[10px] " + (isMine ? "text-white/60" : (dc ? "text-gray-600" : "text-gray-400"))}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMine && (
                          msg.read ? (
                            canSeeRead ? <CheckCheck className="w-3.5 h-3.5 text-sky-300" /> : <CheckCheck className="w-3.5 h-3.5 text-white/50" />
                          ) : (
                            chatUser?.isOnline ? <CheckCheck className="w-3.5 h-3.5 text-white/50" /> : <Check className="w-3.5 h-3.5 text-white/50" />
                          )
                        )}
                      </div>
                    )}

                    {/* Message actions menu */}
                    {/* Reactions display */}
                    {reactions[msg.id]?.length > 0 && (
                      <div className={"flex flex-wrap gap-1 mt-1 " + (isMine ? "justify-end" : "justify-start")}>
                        {reactions[msg.id].map((r,ri) => (
                          <button key={ri} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, r.emoji); }} className={"inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs transition-all " + (r.mine ? (dc ? "bg-rose-500/20 border border-rose-500/30" : "bg-rose-100 border border-rose-200") : (dc ? "bg-gray-700 border border-gray-600" : "bg-gray-100 border border-gray-200"))}>
                            <span>{r.emoji}</span>
                            {r.count > 1 && <span className={r.mine ? "text-rose-500 font-bold" : (dc ? "text-gray-400" : "text-gray-500")}>{r.count}</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Reaction picker */}
                    {showReactions === msg.id && (
                      <div className={"absolute z-30 " + (isMine ? "right-0" : "left-0") + " bottom-full mb-1 flex gap-1 px-2 py-1.5 rounded-full shadow-xl border " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                        {REACTION_EMOJIS.map(e => (
                          <button key={e} onClick={(e2) => { e2.stopPropagation(); toggleReaction(msg.id, e); }} className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform rounded-full hover:bg-gray-100">{e}</button>
                        ))}
                      </div>
                    )}

                    {showMenu === msg.id && !isDeleted && (
                      <div className={"absolute z-20 " + (isMine ? "right-0" : "left-0") + " top-full mt-1 rounded-xl shadow-xl border overflow-hidden min-w-[160px] " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                        <button onClick={(e) => { e.stopPropagation(); setShowMenu(null); setShowReactions(msg.id); }} className={"w-full flex items-center gap-2 px-4 py-2.5 text-sm " + (dc ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-50")}>
                          😊 React
                        </button>
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
          {uploadingMedia && (
            <div className={"flex items-center gap-3 px-5 py-3 " + (dc ? "text-gray-400" : "text-gray-500")}>
              <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Uploading media...</span>
            </div>
          )}
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
          <div ref={bottomRef} style={{height:1}} />
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
          {showGif && (
            <div className={"mb-3 rounded-xl overflow-hidden border " + (dc ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}>
              <div className="p-2">
                <input value={gifQuery} onChange={e => { setGifQuery(e.target.value); searchGifs(e.target.value); }} placeholder="Search GIFs..." className={"w-full px-3 py-2 rounded-lg text-sm outline-none " + (dc ? "bg-gray-600 text-white placeholder-gray-400" : "bg-gray-50 text-gray-800 placeholder-gray-400")} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-1 p-2 max-h-52 overflow-y-auto">
                {gifLoading ? (
                  <div className="col-span-2 flex justify-center py-6"><div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : gifs.length === 0 ? (
                  <div className={"col-span-2 text-center py-6 text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>No GIFs found</div>
                ) : gifs.map((url, i) => (
                  <button key={i} onClick={() => sendGif(url)} className="rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                    <img src={url} alt="GIF" className="w-full h-24 object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
              <div className={"px-3 py-1.5 text-center border-t " + (dc ? "border-gray-600" : "border-gray-100")}>
                <span className={"text-[9px] font-medium " + (dc ? "text-gray-500" : "text-gray-400")}>Powered by GIPHY</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEmoji(!showEmoji)} className={"p-2 rounded-lg transition-colors " + (dc ? "text-gray-400 hover:text-rose-400 hover:bg-gray-700" : "text-gray-400 hover:text-rose-500 hover:bg-rose-50")}>
              <Smile className="w-5 h-5" />
            </button>
            <button onClick={() => { setShowGif(!showGif); if (!showGif && !gifs.length) searchGifs(""); }} className={"p-2 rounded-lg transition-colors text-xs font-bold " + (showGif ? (dc ? "bg-purple-500/20 text-purple-400" : "bg-purple-50 text-purple-500") : (dc ? "text-gray-400 hover:text-purple-400 hover:bg-gray-700" : "text-gray-400 hover:text-purple-500 hover:bg-purple-50"))}>
              GIF
            </button>
            <label className={"p-2 rounded-lg cursor-pointer transition-colors " + (uploadingMedia ? "opacity-50 pointer-events-none " : "") + (dc ? "text-gray-400 hover:text-rose-400 hover:bg-gray-700" : "text-gray-400 hover:text-rose-500 hover:bg-rose-50")}>
              {uploadingMedia ? <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" /> : <ImageIcon className="w-5 h-5" title="Send photos or videos" />}
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={sendMedia} disabled={uploadingMedia} />
            </label>
            <input
              value={newMsg}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Type a message..."
              className={"flex-1 py-2.5 px-4 rounded-xl text-sm outline-none transition-colors " + (dc ? "bg-gray-700 text-white placeholder-gray-500 focus:ring-1 focus:ring-rose-500" : "bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-1 focus:ring-rose-300 focus:bg-white")}
            />
            {!recording && newMsg.trim() && (
              <button onClick={sendMessage} className="p-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-95">
                <Send className="w-5 h-5" />
              </button>
            )}
            {!recording && !newMsg.trim() && (
              <>
                <button onClick={() => setShowGiftPicker(!showGiftPicker)} className={"p-2.5 rounded-xl transition-all " + (dc ? "text-gray-400 hover:text-amber-400 hover:bg-gray-700" : "text-gray-400 hover:text-amber-500 hover:bg-amber-50")}>
                  <span className="text-lg">🎁</span>
                </button>
                <button
                  onClick={startVoice}
                  className={"p-2.5 rounded-xl transition-all " + (dc ? "text-gray-400 hover:text-rose-400 hover:bg-gray-700" : "text-gray-400 hover:text-rose-500 hover:bg-rose-50")}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Gift Picker */}
          {showGiftPicker && (
            <div className={"rounded-2xl border p-4 mt-2 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-lg")}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={"text-sm font-bold " + (dc ? "text-white" : "text-gray-900")}>🎁 Send a Gift</h4>
                <button onClick={() => setShowGiftPicker(false)} className={"text-gray-400 hover:text-gray-300"}>
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {gifts.map(g => (
                  <button key={g.id} onClick={() => sendGift(g.id)} disabled={sendingGift === g.id} className={"flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all " + (sendingGift === g.id ? "opacity-50" : "") + " " + (dc ? "hover:bg-gray-700 bg-gray-750" : "hover:bg-gray-50 bg-gray-50/50") + " border " + (dc ? "border-gray-700" : "border-gray-100")}>
                    <span className="text-2xl">{g.emoji}</span>
                    <span className={"text-[9px] font-bold " + (dc ? "text-gray-400" : "text-gray-500")}>{g.name}</span>
                    <span className={"text-[9px] font-bold flex items-center gap-0.5 " + (dc ? "text-amber-400" : "text-amber-600")}>{g.cost} 🪙</span>
                  </button>
                ))}
              </div>
              <p className={"text-[10px] text-center mt-2 " + (dc ? "text-gray-500" : "text-gray-400")}>Gifts are sent as messages. Receiver gets 70% of coin value!</p>
            </div>
          )}

          {/* WhatsApp-style recording bar */}
          {recording && (
            <div className={"flex items-center gap-3 px-3 py-3 rounded-2xl mt-2 " + (dc ? "bg-gray-700" : "bg-gray-100")}>
              <button onClick={cancelVoice} className={"p-2.5 rounded-full transition-all hover:scale-110 " + (dc ? "text-gray-400 hover:text-red-400 hover:bg-gray-600" : "text-gray-400 hover:text-red-500 hover:bg-red-50")}>
                <Trash2 className="w-5 h-5" />
              </button>
              <div className="flex-1 flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <span className={"text-sm font-bold tabular-nums " + (dc ? "text-white" : "text-gray-900")}>{formatRecordTime(recordingTime)}</span>
                <div className="flex-1 flex items-center gap-[3px]">
                  {Array.from({length: 30}).map((_, i) => (
                    <div key={i} className={"w-[3px] rounded-full transition-all duration-150 " + (dc ? "bg-rose-400" : "bg-rose-500")} style={{height: Math.max(4, Math.min(20, (Math.sin(i * 0.5 + recordingTime * 2) + 1) * 10 + Math.random() * 4)) + "px", opacity: i < (recordingTime % 30) ? 1 : 0.3}} />
                  ))}
                </div>
              </div>
              <button onClick={stopVoice} className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full hover:shadow-lg hover:shadow-emerald-200/50 transition-all hover:scale-110 active:scale-95">
                <Send className="w-5 h-5" />
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
                          {canSeeRead && conv.lastMessage?.read ? <CheckCheck className="w-3 h-3 text-sky-400 inline" /> : conv.lastMessage?.read || conv.user?.isOnline ? <CheckCheck className="w-3 h-3 text-gray-400 inline" /> : <Check className="w-3 h-3 text-gray-400 inline" />}
                        </span>
                      )}
                      {conv.lastMessage?.content?.startsWith("[DELETED]") ? "🚫 Message deleted" : conv.lastMessage?.content?.startsWith("[IMG]") ? "📷 Photo" : conv.lastMessage?.content?.startsWith("[VID]") ? "📹 Video" : conv.lastMessage?.content?.startsWith("[VOICE]") ? "🎤 Voice message" : conv.lastMessage?.content?.startsWith("[GIF]") ? "GIF 🎞️" : conv.lastMessage?.content?.startsWith("[GIFT]") ? "🎁 Gift" : conv.lastMessage?.content?.substring(0, 40) || "Start chatting"}
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
                  <Link href={"/dashboard/user?id=" + conv.user.id} className={"flex items-center gap-2 px-4 py-2.5 text-sm " + (dc ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-50")} onClick={() => setShowConvMenu(null)}>View Profile</Link>
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
