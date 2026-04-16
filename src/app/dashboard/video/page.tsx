"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, Users, Radio, X, Heart, Gift, Send, Mic, MicOff, VideoOff, Eye, Sparkles, Crown, UserPlus, ShoppingCart } from "lucide-react";

type Mode = "list" | "setup" | "live";

const GIFTS = [
  { id: "rose", name: "Rose", emoji: "🌹", coins: 10 },
  { id: "heart", name: "Heart", emoji: "💖", coins: 25 },
  { id: "kiss", name: "Kiss", emoji: "💋", coins: 50 },
  { id: "diamond", name: "Diamond", emoji: "💎", coins: 100 },
  { id: "crown", name: "Crown", emoji: "👑", coins: 250 },
  { id: "rocket", name: "Rocket", emoji: "🚀", coins: 500 },
  { id: "ring", name: "Ring", emoji: "💍", coins: 1000 },
  { id: "castle", name: "Castle", emoji: "🏰", coins: 2500 },
];

export default function LiveStreamPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("list");
  const [role, setRole] = useState<"host" | "viewer">("viewer");
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamCategory, setStreamCategory] = useState("chat");
  const [currentStream, setCurrentStream] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState<any[]>([]);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [agoraClient, setAgoraClient] = useState<any>(null);
  const [localTracks, setLocalTracks] = useState<any>({ video: null, audio: null });
  const [error, setError] = useState("");
  const [streamEnded, setStreamEnded] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [myCoins, setMyCoins] = useState(0);
  const [toasts, setToasts] = useState<any[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const [me, setMe] = useState<any>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStreams();
    loadMe();
    const interval = setInterval(() => { if (mode === "list") loadStreams(); }, 10000);
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    if (mode !== "live" || !currentStream) return;
    const interval = setInterval(() => loadMessages(currentStream.id), 2000);
    return () => clearInterval(interval);
  }, [mode, currentStream]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addToast = (type: string, text: string, emoji = "💬") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, text, emoji }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const loadMe = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setMe(data.user);
    } catch {}
    try {
      const res = await fetch("/api/coins");
      const data = await res.json();
      setMyCoins(data.coins || 0);
    } catch {}
  };

  const loadStreams = async () => {
    try {
      const res = await fetch("/api/live");
      const data = await res.json();
      setStreams(data.streams || []);
    } catch {}
    setLoading(false);
  };

  const loadMessages = async (streamId: string) => {
    try {
      const res = await fetch(`/api/live/chat?streamId=${streamId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(prev => {
          const prevIds = new Set(prev.map((m: any) => m.id));
          const newOnes = data.messages.filter((m: any) => !prevIds.has(m.id));
          newOnes.forEach((m: any) => {
            if (m.user?.id !== me?.id && prev.length > 0) {
              // someone else sent a message - silent update
            }
          });
          return data.messages;
        });
      }
    } catch {}
  };

  const getAgoraToken = async (channelName: string, isHost: boolean) => {
    const res = await fetch("/api/agora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelName, isHost })
    });
    return await res.json();
  };

  const startHosting = async () => {
    if (!streamTitle.trim()) { setError("Enter a stream title"); return; }
    setError("");
    try {
      const createRes = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", title: streamTitle })
      });
      const { stream } = await createRes.json();
      setCurrentStream(stream);

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(4);

      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      await client.setClientRole("host");

      const channelName = `stream_${stream.id}`;
      const tokenData = await getAgoraToken(channelName, true);

      await client.join(tokenData.appId, channelName, tokenData.token, tokenData.uid);

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks({ audio: audioTrack, video: videoTrack });

      // Wait for DOM to be ready, then play local video
      setTimeout(() => {
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current, { fit: "cover" });
        } else {
          // Fallback - try by ID
          const el = document.getElementById("local-video-container");
          if (el) videoTrack.play(el, { fit: "cover" });
        }
      }, 100);

      await client.publish([audioTrack, videoTrack]);

      client.on("user-joined", (user: any) => {
        setViewerCount(c => c + 1);
        setViewers(v => [...v, { uid: user.uid, joinedAt: Date.now() }]);
        addToast("join", `Someone joined your stream`, "👋");
      });
      client.on("user-left", (user: any) => {
        setViewerCount(c => Math.max(0, c - 1));
        setViewers(v => v.filter(x => x.uid !== user.uid));
      });

      setAgoraClient(client);
      setRole("host");
      setMode("live");
      loadMessages(stream.id);
      addToast("live", "You are now live!", "🔴");
    } catch (e: any) {
      console.error("Host error:", e);
      setError("Failed to start: " + (e.message || "Unknown error"));
    }
  };

  const joinStream = async (stream: any) => {
    setCurrentStream(stream);
    setError("");
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(4);

      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      await client.setClientRole("audience");

      const channelName = `stream_${stream.id}`;
      const tokenData = await getAgoraToken(channelName, false);

      client.on("user-published", async (user: any, mediaType: any) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          setTimeout(() => {
            if (remoteVideoRef.current) {
              user.videoTrack?.play(remoteVideoRef.current, { fit: "cover" });
            } else {
              const el = document.getElementById("remote-video-container");
              if (el) user.videoTrack?.play(el, { fit: "cover" });
            }
          }, 100);
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", () => {});

      // Host ended stream
      client.on("user-left", (user: any) => {
        // Check if it was the host
        setTimeout(async () => {
          try {
            const res = await fetch("/api/live");
            const data = await res.json();
            const stillLive = data.streams?.find((s: any) => s.id === stream.id);
            if (!stillLive) {
              setStreamEnded(true);
            }
          } catch {}
        }, 500);
      });

      await client.join(tokenData.appId, channelName, tokenData.token, tokenData.uid);

      setAgoraClient(client);
      setRole("viewer");
      setMode("live");
      loadMessages(stream.id);
      addToast("join", `You joined ${stream.host?.name || "the host"}'s stream`, "🎉");
    } catch (e: any) {
      console.error("Join error:", e);
      setError("Failed to join: " + (e.message || "Unknown error"));
    }
  };

  const endStream = async () => {
    try {
      if (localTracks.video) { localTracks.video.stop(); localTracks.video.close(); }
      if (localTracks.audio) { localTracks.audio.stop(); localTracks.audio.close(); }
      if (agoraClient) { await agoraClient.leave(); }
      if (role === "host") {
        await fetch("/api/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "end" })
        });
      }
    } catch {}
    setAgoraClient(null);
    setLocalTracks({ video: null, audio: null });
    setCurrentStream(null);
    setMode("list");
    setViewerCount(0);
    setViewers([]);
    setMessages([]);
    setStreamEnded(false);
    setStreamTitle("");
    loadStreams();
    loadMe();
  };

  const toggleMute = async () => {
    if (localTracks.audio) {
      await localTracks.audio.setEnabled(muted);
      setMuted(!muted);
    }
  };

  const toggleVideo = async () => {
    if (localTracks.video) {
      await localTracks.video.setEnabled(videoOff);
      setVideoOff(!videoOff);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !currentStream) return;
    const content = chatInput.trim();
    setChatInput("");
    try {
      await fetch("/api/live/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId: currentStream.id, content })
      });
      loadMessages(currentStream.id);
    } catch {}
  };

  const sendGift = async (gift: any) => {
    if (myCoins < gift.coins) {
      addToast("warn", "Not enough coins! Go to Coins page.", "💰");
      setShowGifts(false);
      setTimeout(() => router.push("/dashboard/coins"), 1200);
      return;
    }
    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: currentStream.userId,
          giftType: gift.name,
          amount: gift.coins
        })
      });
      const data = await res.json();
      if (data.success) {
        setMyCoins(c => c - gift.coins);
        addToast("gift", `You sent ${gift.emoji} ${gift.name}!`, gift.emoji);
        setShowGifts(false);
        // Send as chat message too
        await fetch("/api/live/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            streamId: currentStream.id,
            content: `🎁 Sent ${gift.emoji} ${gift.name} (${gift.coins} coins)`
          })
        });
        loadMessages(currentStream.id);
      } else {
        addToast("warn", data.error || "Gift failed", "❌");
      }
    } catch {
      addToast("warn", "Gift failed", "❌");
    }
  };

  // ===== STREAM ENDED SCREEN =====
  if (streamEnded) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-5">
            <Radio className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Stream Ended</h2>
          <p className="text-gray-500 text-sm mb-6">The host has ended this live stream. Thanks for watching!</p>
          <button onClick={endStream} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold hover:shadow-lg transition-all">
            Discover More Streams
          </button>
        </div>
      </div>
    );
  }

  // ===== LIST MODE =====
  if (mode === "list") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/30 to-white pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                <Radio className="text-rose-500" /> Live Now
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {streams.length} creator{streams.length !== 1 ? "s" : ""} streaming right now
              </p>
            </div>
            <button
              onClick={() => setMode("setup")}
              className="px-5 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm shadow-lg shadow-rose-200 hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Video className="w-4 h-4" /> Go Live
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : streams.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                <Radio className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Live Streams Yet</h3>
              <p className="text-gray-500 text-sm mb-6">Be the first to go live and connect with viewers!</p>
              <button onClick={() => setMode("setup")} className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm">
                Start Streaming
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map(s => (
                <button key={s.id} onClick={() => joinStream(s)} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                  <div className="aspect-video bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500 relative overflow-hidden">
                    {s.host?.profilePhoto ? (
                      <img src={s.host.profilePhoto} alt="" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">👤</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                    </div>
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {s.viewers || 0}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-gray-900 text-sm truncate">{s.title}</p>
                    <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                      {s.host?.verified && <span className="text-blue-500">✓</span>}
                      {s.host?.name || "Host"}
                      {s.host?.tier === "premium" && <Crown className="w-3 h-3 text-amber-500" />}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== SETUP MODE =====
  if (mode === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-rose-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Go Live</h2>
              <p className="text-gray-500 text-sm mt-1">Broadcast to thousands of viewers</p>
            </div>
            <button onClick={() => setMode("list")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full aspect-video bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative text-center">
              <Radio className="w-16 h-16 text-white mx-auto mb-2" />
              <p className="text-white font-bold text-lg">Ready to Stream</p>
              <p className="text-white/80 text-xs">Your audience is waiting</p>
            </div>
          </div>

          <label className="block text-sm font-semibold text-gray-700 mb-2">Stream Title *</label>
          <input
            value={streamTitle}
            onChange={e => setStreamTitle(e.target.value)}
            placeholder="What's your stream about?"
            maxLength={80}
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 mb-2 transition-all"
          />
          <p className="text-xs text-gray-400 mb-5">{streamTitle.length}/80 characters</p>

          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { id: "chat", label: "Chat", emoji: "💬" },
              { id: "music", label: "Music", emoji: "🎵" },
              { id: "dance", label: "Dance", emoji: "💃" },
              { id: "talk", label: "Talk", emoji: "🎤" },
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setStreamCategory(c.id)}
                className={"p-3 rounded-xl text-center transition-all " + (streamCategory === c.id ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200" : "bg-gray-50 hover:bg-gray-100 text-gray-600")}
              >
                <p className="text-xl mb-1">{c.emoji}</p>
                <p className="text-xs font-medium">{c.label}</p>
              </button>
            ))}
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-200">{error}</div>}

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-xs text-amber-900 font-medium mb-1">📹 Camera & Microphone Required</p>
            <p className="text-xs text-amber-700">Allow camera and mic access when prompted to start streaming.</p>
          </div>

          <button
            onClick={startHosting}
            disabled={!streamTitle.trim()}
            className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full font-bold text-base disabled:opacity-50 hover:shadow-xl hover:shadow-rose-200 transition-all flex items-center justify-center gap-2"
          >
            <Radio className="w-5 h-5" /> Start Streaming
          </button>
        </div>
      </div>
    );
  }

  // ===== LIVE MODE =====
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video Area */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={localVideoRef} className={"w-full h-full bg-gray-900 " + (role === "host" ? "block" : "hidden")} id="local-video-container" style={{minHeight: "100%"}} />
        <div ref={remoteVideoRef} className={"w-full h-full bg-gray-900 " + (role === "viewer" ? "block" : "hidden")} id="remote-video-container" style={{minHeight: "100%"}} />

        {/* Top Gradient + Stream Info */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
                </div>
                <button
                  onClick={() => setShowViewers(true)}
                  className="bg-black/40 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-black/60 transition-colors"
                >
                  <Eye className="w-3 h-3" /> {viewerCount}
                </button>
              </div>
              <p className="text-white font-bold text-lg drop-shadow-lg line-clamp-1">
                {currentStream?.title || streamTitle}
              </p>
              {role === "viewer" && currentStream?.host && (
                <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5 drop-shadow">
                  {currentStream.host.verified && <span className="text-blue-400">✓</span>}
                  {currentStream.host.name || "Host"}
                </p>
              )}
            </div>
            <button onClick={endStream} className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-3">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notifications */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 space-y-2 pointer-events-none z-30 w-[90%] max-w-md">
          {toasts.map(t => (
            <div key={t.id} className="bg-gradient-to-r from-rose-500/95 to-pink-500/95 backdrop-blur-lg text-white text-sm px-5 py-3 rounded-full flex items-center justify-center gap-2 shadow-2xl shadow-rose-500/50 animate-in slide-in-from-top">
              <span className="text-lg">{t.emoji}</span>
              <span className="font-semibold">{t.text}</span>
            </div>
          ))}
        </div>

        {/* Chat Messages Overlay */}
        <div className="absolute left-4 right-4 bottom-28 max-h-[40vh] overflow-y-auto scrollbar-hide pointer-events-none">
          <div className="space-y-2">
            {messages.slice(-15).map((m: any) => (
              <div key={m.id} className="flex items-start gap-2 pointer-events-auto">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                  {m.user?.profilePhoto ? <img src={m.user.profilePhoto} alt="" className="w-full h-full object-cover" /> : (m.user?.name?.[0] || "?")}
                </div>
                <div className="bg-black/50 backdrop-blur-md rounded-2xl px-3 py-1.5 max-w-[75%]">
                  <p className="text-white text-xs font-semibold">{m.user?.name || "User"}</p>
                  <p className="text-white/90 text-sm break-words">{m.content}</p>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
        </div>

        {error && (
          <div className="absolute top-24 left-4 right-4 bg-red-500 text-white p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-black p-3 pb-5">
        {/* Chat input + actions (for EVERYONE including host) */}
        <div className="flex items-center gap-2 mb-3">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendChat()}
            placeholder="Say something..."
            className="flex-1 px-4 py-3 bg-white/10 text-white placeholder:text-white/40 rounded-full outline-none text-sm border border-white/10 focus:border-white/30"
          />
          <button onClick={sendChat} className="w-11 h-11 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full flex items-center justify-center flex-shrink-0 hover:shadow-lg">
            <Send className="w-4 h-4" />
          </button>
          {role === "viewer" && (
            <button onClick={() => setShowGifts(true)} className="w-11 h-11 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 hover:shadow-lg">
              <Gift className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Host-only controls */}
        {role === "host" && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={toggleMute} className={"w-11 h-11 rounded-full flex items-center justify-center transition-colors " + (muted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20")}>
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button onClick={toggleVideo} className={"w-11 h-11 rounded-full flex items-center justify-center transition-colors " + (videoOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20")}>
              {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
            <button onClick={() => setShowViewers(true)} className="w-11 h-11 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <Users className="w-5 h-5" />
            </button>
            <button onClick={endStream} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-sm">
              End Stream
            </button>
          </div>
        )}
      </div>

      {/* Gift Modal */}
      {showGifts && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowGifts(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-500" /> Send a Gift
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">80% goes to the host</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="text-amber-600">🪙</span>
                  <span className="font-bold text-amber-900 text-sm">{myCoins}</span>
                </div>
                <button onClick={() => setShowGifts(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {GIFTS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => sendGift(g)}
                    disabled={myCoins < g.coins}
                    className={"aspect-square rounded-2xl flex flex-col items-center justify-center transition-all " + (myCoins < g.coins ? "bg-gray-50 opacity-50" : "bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 hover:scale-105 border border-amber-100")}
                  >
                    <span className="text-3xl mb-1">{g.emoji}</span>
                    <span className="text-[10px] font-bold text-gray-700">{g.name}</span>
                    <span className="text-[10px] text-amber-600 font-semibold">🪙 {g.coins}</span>
                  </button>
                ))}
              </div>
              <Link href="/dashboard/coins" onClick={() => setShowGifts(false)} className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg">
                <ShoppingCart className="w-4 h-4" /> Buy More Coins
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Viewers Modal (host can invite) */}
      {showViewers && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowViewers(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" /> Viewers ({viewerCount})
              </h3>
              <button onClick={() => setShowViewers(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {viewers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No viewers yet</p>
                  <p className="text-gray-400 text-xs mt-1">Share your stream to get viewers!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {viewers.map((v: any, i: number) => (
                    <div key={v.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold">
                          V
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Viewer #{i + 1}</p>
                          <p className="text-xs text-gray-500">Watching now</p>
                        </div>
                      </div>
                      {role === "host" && (
                        <button
                          onClick={() => addToast("invite", "Invite sent (feature coming soon)", "👋")}
                          className="px-3 py-1.5 bg-rose-100 text-rose-600 rounded-full text-xs font-bold flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" /> Invite
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
