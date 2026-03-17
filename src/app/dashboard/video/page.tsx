"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useUser } from "../layout";
import { Video, Shield, Lock, Sparkles, Users, Eye, Radio, X, MessageCircle, Heart, AlertCircle, Crown, Gem, Globe, ArrowLeft, Mic, MicOff } from "lucide-react";
import Link from "next/link";

const RULES = [
  "No nudity or sexually explicit content",
  "No hate speech, bullying, or harassment",
  "No violence or harmful activities",
  "No illegal content or activities",
  "Must be 18+ to go live",
  "No spam or misleading content",
  "Respect other users at all times",
  "Violations result in permanent ban"
];

type StreamUser = { id:string; name:string; profilePhoto:string|null; tier:string; country:string|null; };
type LiveStreamData = { id:string; userId:string; title:string|null; isLive:boolean; viewerCount:number; createdAt:string; user:StreamUser; };

export default function VideoPage() {
  const { user } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const [isLive, setIsLive] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveTitle, setLiveTitle] = useState("");
  const [streamId, setStreamId] = useState<string|null>(null);
  const [micOn, setMicOn] = useState(true);
  const [activeStreams, setActiveStreams] = useState<LiveStreamData[]>([]);
  const [watching, setWatching] = useState<LiveStreamData|null>(null);
  const [view, setView] = useState<"home"|"live"|"watch">("home");
  const pollRef = useRef<NodeJS.Timeout|null>(null);

  const isVerified = user?.tier === "verified" || user?.tier === "premium" || user?.tier === "gold";

  // Load active streams
  const loadStreams = async () => {
    const res = await fetch("/api/live");
    if (res.ok) { const d = await res.json(); setActiveStreams((d.streams||[]).filter((s:any) => s.userId !== user?.id)); }
  };

  useEffect(() => {
    loadStreams();
    const interval = setInterval(loadStreams, 5000);
    return () => { clearInterval(interval); if (pollRef.current) clearInterval(pollRef.current); };
  }, [user]);

  const startLive = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      streamRef.current = stream;

      // Important: wait for ref to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("autoplay", "true");
          videoRef.current.muted = true;
          videoRef.current.play().catch(console.error);
        }
      }, 100);

      // Register stream in database
      const res = await fetch("/api/live", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", title: liveTitle || "Live Stream" })
      });
      const data = await res.json();
      if (data.stream) setStreamId(data.stream.id);

      setIsLive(true);
      setView("live");
      setViewerCount(0);

      // Poll for real viewer count
      pollRef.current = setInterval(async () => {
        const r = await fetch("/api/live");
        if (r.ok) {
          const d = await r.json();
          const myStream = (d.streams || []).find((s: any) => s.userId === user?.id);
          if (myStream) setViewerCount(myStream.viewerCount);
        }
      }, 3000);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Camera access required. Please allow camera and microphone permissions.");
    }
  }, [liveTitle, user]);

  const stopLive = useCallback(async () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "end" }) });
    setIsLive(false);
    setViewerCount(0);
    setStreamId(null);
    setView("home");
  }, []);

  const joinStream = async (stream: LiveStreamData) => {
    await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "join", streamId: stream.id }) });
    setWatching(stream);
    setView("watch");
  };

  const leaveStream = async () => {
    if (watching) {
      await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leave", streamId: watching.id }) });
    }
    setWatching(null);
    setView("home");
  };

  if (!user) return null;

  // NOT VERIFIED
  if (!isVerified) return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Video</h1><p className="text-sm text-gray-500">Go live or video call your matches</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-5 border border-white/30"><Video className="w-10 h-10 text-white" /></div>
          <h2 className="text-3xl font-bold text-white mb-2">Video Features</h2>
          <p className="text-lg text-white/80">Go live and connect face-to-face</p>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-amber-500" /></div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Required</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">Video features are only available for verified members.</p>
          <Link href="/dashboard/verify" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg"><Shield className="w-5 h-5" /> Get Verified</Link>
        </div>
      </div>

      {/* Still show active streams to watch */}
      {activeStreams.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Radio className="w-5 h-5 text-red-500" /> Live Now</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeStreams.map(s => (
              <button key={s.id} onClick={() => joinStream(s)} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="relative">{s.user?.profilePhoto ? <img src={s.user.profilePhoto} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{s.user?.name?.[0]}</div>}<div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" /></div>
                  <div className="flex-1 min-w-0"><p className="font-bold text-gray-900 text-sm truncate">{s.user?.name}</p><p className="text-xs text-gray-500 truncate">{s.title||"Live Stream"}</p><div className="flex items-center gap-2 mt-1"><span className="flex items-center gap-1 text-[11px] text-red-500 font-semibold"><Radio className="w-3 h-3" /> LIVE</span><span className="text-[11px] text-gray-400 flex items-center gap-1"><Eye className="w-3 h-3" /> {s.viewerCount}</span></div></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // WATCHING SOMEONE'S STREAM
  if (view === "watch" && watching) return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
        <div className="relative h-[500px] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          {/* Streamer info */}
          <div className="text-center">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-red-500/50 ring-offset-4 ring-offset-gray-900">
              {watching.user?.profilePhoto ? <img src={watching.user.profilePhoto} className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold">{watching.user?.name?.[0]}</div>}
            </div>
            <h3 className="text-white text-xl font-bold">{watching.user?.name}</h3>
            <p className="text-white/60 text-sm mb-2">{watching.title || "Live Stream"}</p>
            <div className="flex items-center justify-center gap-3">
              <span className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold"><Radio className="w-3 h-3 animate-pulse" /> LIVE</span>
              <span className="flex items-center gap-1 text-white/60 text-xs"><Eye className="w-3.5 h-3.5" /> {watching.viewerCount} watching</span>
            </div>
            <p className="text-white/30 text-xs mt-4">Live video streaming will show here when WebRTC is connected</p>
          </div>

          {/* Top bar */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold"><Radio className="w-4 h-4 animate-pulse" /> LIVE</span>
              <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm"><Eye className="w-4 h-4" /> {watching.viewerCount}</span>
            </div>
            <button onClick={leaveStream} className="flex items-center gap-2 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-red-600"><X className="w-4 h-4" /> Leave</button>
          </div>
        </div>

        <div className="p-4 bg-gray-900 flex items-center gap-3">
          <input className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-rose-500" placeholder="Send a message..." />
          <button className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white hover:bg-rose-600"><Heart className="w-5 h-5" /></button>
        </div>
      </div>

      <button onClick={leaveStream} className="mt-4 flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium"><ArrowLeft className="w-4 h-4" /> Back to Video</button>
    </div>
  );

  // MY LIVE STREAM
  if (view === "live" && isLive) return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4"><h1 className="text-2xl font-bold text-gray-900">You're Live!</h1></div>
      <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
        <div className="relative">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-[500px] object-cover bg-gray-900" style={{ transform: "scaleX(-1)" }} />

          <div className="absolute top-4 left-4 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg"><Radio className="w-4 h-4 animate-pulse" /> LIVE</div>
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm"><Eye className="w-4 h-4" /> {viewerCount} watching</div>
          </div>

          {liveTitle && <div className="absolute bottom-16 left-4 right-16 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-xl"><p className="text-sm font-semibold">{liveTitle}</p></div>}

          <button onClick={stopLive} className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-red-600 shadow-lg"><X className="w-4 h-4" /> End Live</button>

          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
            {user.profilePhoto ? <img src={user.profilePhoto} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-rose-400 flex items-center justify-center text-white text-xs font-bold">{user.name[0]}</div>}
            <span className="text-white text-sm font-semibold">{user.name}</span>
          </div>

          <div className="absolute bottom-4 left-4 flex gap-2">
            <button onClick={() => setMicOn(!micOn)} className={"w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm " + (micOn ? "bg-white/20 text-white" : "bg-red-500 text-white")}>{micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}</button>
          </div>
        </div>

        <div className="p-4 bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-800 rounded-full px-4 py-2.5">
              <MessageCircle className="w-4 h-4 text-gray-400" />
              <input className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full" placeholder="Chat with viewers..." />
            </div>
            <button className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white hover:bg-rose-600"><Heart className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );

  // HOME VIEW
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Video</h1><p className="text-sm text-gray-500">Go live or watch streams</p></div>

      {/* Active Streams */}
      {activeStreams.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Radio className="w-5 h-5 text-red-500 animate-pulse" /> Live Now ({activeStreams.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeStreams.map(s => (
              <button key={s.id} onClick={() => joinStream(s)} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all text-left group">
                <div className="relative h-36 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500">
                  {s.user?.profilePhoto && <img src={s.user.profilePhoto} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-[11px] font-bold"><Radio className="w-3 h-3 animate-pulse" /> LIVE</span>
                    <span className="flex items-center gap-1 bg-black/50 text-white px-2 py-0.5 rounded-full text-[11px]"><Eye className="w-3 h-3" /> {s.viewerCount}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-sm truncate">{s.user?.name}</p>
                    <p className="text-white/70 text-xs truncate">{s.title || "Live Stream"}</p>
                  </div>
                </div>
                <div className="p-3 flex items-center gap-2">
                  {s.user?.profilePhoto ? <img src={s.user.profilePhoto} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">{s.user?.name?.[0]}</div>}
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{s.user?.name}</p><p className="text-xs text-gray-500">{s.user?.country || "ConnectHub"}</p></div>
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">Watch</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Go Live Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/30"><Radio className="w-8 h-8 text-white" /></div>
          <h2 className="text-2xl font-bold text-white mb-1">Go Live</h2>
          <p className="text-white/80 text-sm">Share moments with the ConnectHub community</p>
        </div>
        <div className="p-6">
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Live Stream Title</label>
            <input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm" placeholder="What's your live about?" value={liveTitle} onChange={e => setLiveTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: Video, title: "HD Video", desc: "Crystal clear", color: "text-blue-500", bg: "bg-blue-50" },
              { icon: Users, title: "Live Chat", desc: "Real-time", color: "text-purple-500", bg: "bg-purple-50" },
              { icon: Heart, title: "Reactions", desc: "From viewers", color: "text-rose-500", bg: "bg-rose-50" },
            ].map((f, i) => (
              <div key={i} className={"rounded-xl p-3 text-center " + f.bg}><f.icon className={"w-5 h-5 mx-auto mb-1 " + f.color} /><p className="text-xs font-bold text-gray-900">{f.title}</p><p className="text-[10px] text-gray-500">{f.desc}</p></div>
            ))}
          </div>

          {!acceptedRules ? (
            <button onClick={() => setShowRules(true)} className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"><Radio className="w-5 h-5" /> Review Rules & Go Live</button>
          ) : (
            <button onClick={startLive} className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"><Radio className="w-5 h-5 animate-pulse" /> Start Live Stream</button>
          )}
        </div>
      </div>

      {/* Video Calls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Video className="w-5 h-5 text-blue-500" /> Video Calls</h3>
        <p className="text-sm text-gray-500 mb-4">Start a video call with your matches directly from the Messages page.</p>
        <Link href="/dashboard/messages" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 border border-blue-200"><MessageCircle className="w-4 h-4" /> Go to Messages</Link>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRules(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div>
              <div><h3 className="font-bold text-gray-900">Community Guidelines</h3><p className="text-xs text-gray-500">You must follow these rules while live</p></div>
            </div>
            <div className="space-y-3 mb-6">
              {RULES.map((rule, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-gray-700">{rule}</p>
                </div>
              ))}
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-xs text-red-700"><strong>Warning:</strong> Violating these rules will result in your live being terminated and your account permanently banned.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRules(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-full font-semibold text-gray-600">Cancel</button>
              <button onClick={() => { setAcceptedRules(true); setShowRules(false); }} className="flex-[2] py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full font-semibold hover:shadow-lg">I Accept — Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
