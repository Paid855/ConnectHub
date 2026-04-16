"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, Users, Radio, X, Heart, Gift, Send, Mic, MicOff, VideoOff, Eye } from "lucide-react";

type Mode = "list" | "host" | "viewer";

export default function LiveStreamPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("list");
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamTitle, setStreamTitle] = useState("");
  const [currentStream, setCurrentStream] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [agoraClient, setAgoraClient] = useState<any>(null);
  const [localTracks, setLocalTracks] = useState<any>({ video: null, audio: null });
  const [error, setError] = useState("");

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStreams();
    const interval = setInterval(() => { if (mode === "list") loadStreams(); }, 10000);
    return () => clearInterval(interval);
  }, [mode]);

  const loadStreams = async () => {
    try {
      const res = await fetch("/api/live");
      const data = await res.json();
      setStreams(data.streams || []);
    } catch {}
    setLoading(false);
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
      // Create stream in DB
      const createRes = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", title: streamTitle })
      });
      const { stream } = await createRes.json();
      setCurrentStream(stream);

      // Load Agora SDK
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(4);

      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      await client.setClientRole("host");

      const channelName = `stream_${stream.id}`;
      const tokenData = await getAgoraToken(channelName, true);

      await client.join(tokenData.appId, channelName, tokenData.token || null, tokenData.uid);

      // Create camera and mic tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks({ audio: audioTrack, video: videoTrack });

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // Publish to channel
      await client.publish([audioTrack, videoTrack]);

      // Listen for viewer count
      client.on("user-joined", () => setViewerCount(c => c + 1));
      client.on("user-left", () => setViewerCount(c => Math.max(0, c - 1)));

      setAgoraClient(client);
      setMode("host");
      loadChatMessages(stream.id);
    } catch (e: any) {
      console.error("Host error:", e);
      setError("Failed to start stream: " + (e.message || "Unknown error"));
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

      // Listen for host publishing
      client.on("user-published", async (user: any, mediaType: any) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video" && remoteVideoRef.current) {
          user.videoTrack?.play(remoteVideoRef.current);
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", () => {});

      await client.join(tokenData.appId, channelName, tokenData.token || null, tokenData.uid);

      setAgoraClient(client);
      setMode("viewer");
      loadChatMessages(stream.id);
    } catch (e: any) {
      console.error("Join error:", e);
      setError("Failed to join stream: " + (e.message || "Unknown error"));
    }
  };

  const endStream = async () => {
    try {
      if (localTracks.video) { localTracks.video.stop(); localTracks.video.close(); }
      if (localTracks.audio) { localTracks.audio.stop(); localTracks.audio.close(); }
      if (agoraClient) { await agoraClient.leave(); }
      if (mode === "host") {
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
    setChatMessages([]);
    loadStreams();
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

  const loadChatMessages = async (streamId: string) => {
    try {
      const res = await fetch(`/api/live/chat?streamId=${streamId}`);
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch {}
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !currentStream) return;
    try {
      await fetch("/api/live/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId: currentStream.id, message: chatInput })
      });
      setChatInput("");
      loadChatMessages(currentStream.id);
    } catch {}
  };

  // LIST VIEW
  if (mode === "list") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/30 to-white pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                <Radio className="text-rose-500" /> Live Now
              </h1>
              <p className="text-gray-500 text-sm mt-1">{streams.length} creator{streams.length !== 1 ? "s" : ""} streaming right now</p>
            </div>
            <button
              onClick={() => setMode("host")}
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
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <div className="w-20 h-20 mx-auto bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Radio className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Live Streams Yet</h3>
              <p className="text-gray-500 text-sm mb-6">Be the first to go live and connect with viewers!</p>
              <button onClick={() => setMode("host")} className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm">Start Streaming</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map(s => (
                <button
                  key={s.id}
                  onClick={() => joinStream(s)}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                >
                  <div className="aspect-video bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500 relative overflow-hidden">
                    {s.host?.profilePhoto ? (
                      <img src={s.host.profilePhoto} alt="" className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">👤</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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

  // HOST SETUP (before streaming starts)
  if (mode === "host" && !currentStream) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/30 to-white pb-24 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Go Live</h2>
            <button onClick={() => setMode("list")} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
          </div>
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-200">
            <Radio className="w-10 h-10 text-white" />
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stream Title</label>
          <input
            value={streamTitle}
            onChange={e => setStreamTitle(e.target.value)}
            placeholder="What's your stream about?"
            maxLength={80}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-300 mb-2"
          />
          <p className="text-xs text-gray-400 mb-6">{streamTitle.length}/80</p>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-200">{error}</div>}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-amber-800">📹 We will request camera and microphone access. Make sure to allow it.</p>
          </div>
          <button
            onClick={startHosting}
            disabled={!streamTitle.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm disabled:opacity-50 hover:shadow-lg transition-all"
          >
            🔴 Start Streaming Now
          </button>
        </div>
      </div>
    );
  }

  // HOST or VIEWER (active stream)
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video area */}
      <div className="flex-1 relative overflow-hidden">
        {mode === "host" ? (
          <div ref={localVideoRef} className="w-full h-full bg-gray-900" />
        ) : (
          <div ref={remoteVideoRef} className="w-full h-full bg-gray-900" />
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
            </div>
            <div className="bg-black/40 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Eye className="w-3 h-3" /> {viewerCount}
            </div>
          </div>
          <button onClick={endStream} className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-24 left-4 right-4">
          <p className="text-white font-bold text-lg drop-shadow-lg">{currentStream?.title || streamTitle}</p>
        </div>

        {error && (
          <div className="absolute top-20 left-4 right-4 bg-red-500 text-white p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Host controls */}
      {mode === "host" && (
        <div className="bg-black p-4 flex items-center justify-center gap-3">
          <button
            onClick={toggleMute}
            className={"w-14 h-14 rounded-full flex items-center justify-center transition-colors " + (muted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20")}
          >
            {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button
            onClick={toggleVideo}
            className={"w-14 h-14 rounded-full flex items-center justify-center transition-colors " + (videoOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20")}
          >
            {videoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
          <button
            onClick={endStream}
            className="px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-sm"
          >
            End Stream
          </button>
        </div>
      )}

      {/* Viewer controls */}
      {mode === "viewer" && (
        <div className="bg-black p-4 flex items-center gap-2">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendChat()}
            placeholder="Say something..."
            className="flex-1 px-4 py-3 bg-white/10 text-white placeholder:text-white/40 rounded-full outline-none text-sm border border-white/10 focus:border-white/30"
          />
          <button onClick={sendChat} className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full flex items-center justify-center">
            <Send className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
