"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Camera, RotateCcw, Maximize, Minimize, Users, MessageCircle, Search, Shield, Heart } from "lucide-react";
import Link from "next/link";

export default function VideoPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [tab, setTab] = useState<"call"|"live">("call");
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/friends").then(r => r.json()).then(d => {
      const list = (d.friends || []).map((f: any) => f.user).filter(Boolean);
      setFriends(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={"text-2xl font-bold mb-5 " + (dc ? "text-white" : "text-gray-900")}>Video</h1>

      <div className={"flex gap-1 mb-5 rounded-xl p-1 " + (dc ? "bg-gray-800" : "bg-gray-100")}>
        <button onClick={() => setTab("call")} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all " + (tab === "call" ? (dc ? "bg-gray-700 text-white" : "bg-white text-gray-900 shadow-sm") : (dc ? "text-gray-500" : "text-gray-500"))}><Video className="w-4 h-4" /> Video Call</button>
        <button onClick={() => setTab("live")} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all " + (tab === "live" ? (dc ? "bg-gray-700 text-white" : "bg-white text-gray-900 shadow-sm") : (dc ? "text-gray-500" : "text-gray-500"))}><Camera className="w-4 h-4" /> Go Live</button>
      </div>

      {tab === "call" ? <VideoCallTab friends={friends} user={user} dc={dc} loading={loading} /> : <LiveStreamTab user={user} dc={dc} />}
    </div>
  );
}

function VideoCallTab({ friends, user, dc, loading }: any) {
  const [callState, setCallState] = useState<"idle" | "calling" | "connected">("idle");
  const [callUser, setCallUser] = useState<any>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const startCall = async (friend: any) => {
    setCallUser(friend);
    setCallState("calling");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      // Simulate connection after 2 seconds
      setTimeout(() => setCallState("connected"), 2000);
    } catch (e) {
      alert("Camera/microphone permission needed for video calls");
      setCallState("idle");
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setCallState("idle");
    setCallUser(null);
    setMuted(false);
    setVideoOff(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMuted(!muted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setVideoOff(!videoOff);
    }
  };

  const isOnline = (d: string | null) => d ? Date.now() - new Date(d).getTime() < 5 * 60 * 1000 : false;

  if (callState !== "idle") {
    return (
      <div className="relative">
        {/* Remote video (full screen) */}
        <div className={"rounded-2xl overflow-hidden relative " + (dc ? "bg-gray-900" : "bg-gray-900")} style={{ height: "70vh", maxHeight: "600px" }}>
          {callState === "calling" ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {callUser?.profilePhoto ? <img src={callUser.profilePhoto} className="w-28 h-28 rounded-full object-cover mb-4 animate-pulse" /> : <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-4xl font-bold mb-4 animate-pulse">{callUser?.name?.[0]}</div>}
              <p className="text-white text-xl font-bold">{callUser?.name}</p>
              <p className="text-gray-400 text-sm mt-2">Calling...</p>
              <div className="flex gap-1 mt-4">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          ) : (
            <>
              <video ref={remoteVideoRef} className="w-full h-full object-cover" playsInline />
              {/* Placeholder for remote video */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {callUser?.profilePhoto ? <img src={callUser.profilePhoto} className="w-28 h-28 rounded-full object-cover mb-4" /> : <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-4xl font-bold mb-4">{callUser?.name?.[0]}</div>}
                <p className="text-white text-xl font-bold">{callUser?.name}</p>
                <p className="text-emerald-400 text-sm mt-1">Connected</p>
              </div>
            </>
          )}

          {/* Local video (small overlay) */}
          <div className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
            <video ref={localVideoRef} className="w-full h-full object-cover" muted playsInline />
            {videoOff && <div className="absolute inset-0 bg-gray-800 flex items-center justify-center"><VideoOff className="w-6 h-6 text-gray-400" /></div>}
          </div>

          {/* Call timer */}
          {callState === "connected" && <CallTimer />}
        </div>

        {/* Controls */}
        <div className={"flex items-center justify-center gap-4 py-6 " + (dc ? "bg-gray-800" : "bg-white")}>
          <button onClick={toggleMute} className={"w-12 h-12 rounded-full flex items-center justify-center transition-all " + (muted ? "bg-red-500 text-white" : (dc ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-700"))}>{muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
          <button onClick={toggleVideo} className={"w-12 h-12 rounded-full flex items-center justify-center transition-all " + (videoOff ? "bg-red-500 text-white" : (dc ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-700"))}>{videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}</button>
          <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg"><PhoneOff className="w-7 h-7" /></button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={"rounded-2xl border p-6 mb-5 text-center " + (dc ? "bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/20" : "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200")}>
        <Video className={"w-10 h-10 mx-auto mb-3 " + (dc ? "text-rose-400" : "text-rose-500")} />
        <h3 className={"font-bold mb-1 " + (dc ? "text-white" : "text-gray-900")}>Video Call Your Friends</h3>
        <p className={"text-sm " + (dc ? "text-gray-400" : "text-gray-500")}>Face-to-face conversations with your matches</p>
      </div>

      {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div> :
        friends.length === 0 ? (
          <div className={"text-center py-12 rounded-2xl border " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
            <Users className={"w-12 h-12 mx-auto mb-3 " + (dc ? "text-gray-600" : "text-gray-300")} />
            <p className={"font-bold mb-1 " + (dc ? "text-white" : "text-gray-900")}>No friends to call</p>
            <p className={"text-sm mb-4 " + (dc ? "text-gray-500" : "text-gray-400")}>Add friends first to start video calling</p>
            <Link href="/dashboard" className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold">Discover People</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f: any) => (
              <div key={f.id} className={"flex items-center gap-3 p-4 rounded-xl border " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
                <div className="relative">
                  {f.profilePhoto ? <img src={f.profilePhoto} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{f.name?.[0]}</div>}
                  {isOnline(f.lastSeen) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><p className={"font-bold text-sm " + (dc ? "text-white" : "text-gray-900")}>{f.name}</p>{f.verified && <Shield className="w-3.5 h-3.5 text-blue-500" />}</div>
                  <p className={"text-xs " + (isOnline(f.lastSeen) ? "text-emerald-500" : "text-gray-400")}>{isOnline(f.lastSeen) ? "Online" : "Offline"}</p>
                </div>
                <button onClick={() => startCall(f)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg"><Video className="w-4 h-4" /> Call</button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

function LiveStreamTab({ user, dc }: any) {
  const [streams, setStreams] = useState<any[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [chat, setChat] = useState<any[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const [title, setTitle] = useState("");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/live").then(r => r.json()).then(d => { setStreams(d.streams || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const startStream = async () => {
    if (!title.trim()) { alert("Enter a stream title"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", title: title.trim() }) });
      setStreaming(true);
      setViewers(0);
      // Simulate viewers
      const vi = setInterval(() => setViewers(v => v + Math.floor(Math.random() * 3)), 10000);
      return () => clearInterval(vi);
    } catch (e) {
      alert("Camera permission needed to go live");
    }
  };

  const endStream = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "end" }) }).catch(() => {});
    setStreaming(false);
    setTitle("");
  };

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    setChat(p => [...p, { id: Date.now(), user: user.name, text: chatMsg.trim(), time: "now" }]);
    setChatMsg("");
  };

  const isOnline = (d: string | null) => d ? Date.now() - new Date(d).getTime() < 5 * 60 * 1000 : false;

  if (streaming) {
    return (
      <div>
        <div className="rounded-2xl overflow-hidden relative bg-black" style={{ height: "55vh", maxHeight: "500px" }}>
          <video ref={localVideoRef} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1"><div className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE</span>
            <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1"><Users className="w-3 h-3" /> {viewers}</span>
          </div>
        </div>

        {/* Chat overlay */}
        <div className={"rounded-2xl border mt-3 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <div className="p-3 max-h-48 overflow-y-auto space-y-2">
            {chat.length === 0 ? <p className={"text-sm text-center py-4 " + (dc ? "text-gray-500" : "text-gray-400")}>No messages yet</p> :
              chat.map(c => (
                <div key={c.id} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-rose-500">{c.user}:</span>
                  <span className={"text-xs " + (dc ? "text-gray-300" : "text-gray-600")}>{c.text}</span>
                </div>
              ))
            }
          </div>
          <div className={"flex gap-2 p-3 border-t " + (dc ? "border-gray-700" : "border-gray-100")}>
            <input className={"flex-1 px-3 py-2 rounded-xl border text-sm outline-none " + (dc ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200")} placeholder="Say something..." value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} />
            <button onClick={sendChat} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold">Send</button>
          </div>
        </div>

        <button onClick={endStream} className="w-full mt-4 py-3 bg-red-500 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-red-600">
          <PhoneOff className="w-5 h-5" /> End Stream
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Start stream section */}
      <div className={"rounded-2xl border p-6 mb-5 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm")}>
        <h3 className={"font-bold mb-1 " + (dc ? "text-white" : "text-gray-900")}>Start Your Live Stream</h3>
        <p className={"text-sm mb-4 " + (dc ? "text-gray-400" : "text-gray-500")}>Go live and earn coins from gifts! You keep 80% of all gifts received.</p>
        <input className={"w-full px-4 py-3 rounded-xl border mb-3 outline-none text-sm " + (dc ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-300")} placeholder="Give your stream a title..." value={title} onChange={e => setTitle(e.target.value)} />
        <button onClick={startStream} className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:shadow-lg"><Camera className="w-5 h-5" /> Go Live</button>
      </div>

      {/* Earnings info */}
      <div className={"rounded-2xl border p-5 mb-5 " + (dc ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20" : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200")}>
        <h3 className={"font-bold mb-2 " + (dc ? "text-white" : "text-gray-900")}>💰 Earn Money Streaming</h3>
        <div className="space-y-2">
          <div className={"flex justify-between items-center p-2 rounded-lg " + (dc ? "bg-gray-800/50" : "bg-white/80")}>
            <span className={"text-sm " + (dc ? "text-gray-300" : "text-gray-700")}>🌹 Rose (10 coins)</span>
            <span className={"text-sm font-bold " + (dc ? "text-emerald-400" : "text-emerald-600")}>You earn 8 coins</span>
          </div>
          <div className={"flex justify-between items-center p-2 rounded-lg " + (dc ? "bg-gray-800/50" : "bg-white/80")}>
            <span className={"text-sm " + (dc ? "text-gray-300" : "text-gray-700")}>💎 Diamond (100 coins)</span>
            <span className={"text-sm font-bold " + (dc ? "text-emerald-400" : "text-emerald-600")}>You earn 80 coins</span>
          </div>
          <div className={"flex justify-between items-center p-2 rounded-lg " + (dc ? "bg-gray-800/50" : "bg-white/80")}>
            <span className={"text-sm " + (dc ? "text-gray-300" : "text-gray-700")}>👑 Crown (500 coins)</span>
            <span className={"text-sm font-bold " + (dc ? "text-emerald-400" : "text-emerald-600")}>You earn 400 coins</span>
          </div>
        </div>
      </div>

      {/* Active streams */}
      <h3 className={"font-bold mb-3 " + (dc ? "text-white" : "text-gray-900")}>Active Streams</h3>
      {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div> :
        streams.length === 0 ? (
          <div className={"text-center py-12 rounded-2xl border " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
            <Camera className={"w-12 h-12 mx-auto mb-3 " + (dc ? "text-gray-600" : "text-gray-300")} />
            <p className={"font-bold mb-1 " + (dc ? "text-white" : "text-gray-900")}>No live streams right now</p>
            <p className={"text-sm " + (dc ? "text-gray-500" : "text-gray-400")}>Be the first to go live!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {streams.map((s: any) => (
              <Link key={s.id} href={"/dashboard/video?watch=" + s.id} className={"rounded-xl border overflow-hidden " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
                <div className="relative h-36 bg-gradient-to-br from-rose-400 to-purple-400">
                  {s.host?.profilePhoto && <img src={s.host.profilePhoto} className="w-full h-full object-cover" />}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">LIVE</span>
                    <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {s.viewers || 0}</span>
                  </div>
                </div>
                <div className="p-2">
                  <p className={"text-xs font-bold truncate " + (dc ? "text-white" : "text-gray-900")}>{s.title || "Live Stream"}</p>
                  <p className={"text-[10px] " + (dc ? "text-gray-500" : "text-gray-400")}>{s.host?.name}</p>
                </div>
              </Link>
            ))}
          </div>
        )
      }
    </div>
  );
}

function CallTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { const i = setInterval(() => setSeconds(s => s + 1), 1000); return () => clearInterval(i); }, []);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-1.5 rounded-full font-mono">{m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}</div>;
}
