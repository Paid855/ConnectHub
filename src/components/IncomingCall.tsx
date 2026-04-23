"use client";
import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, X, User } from "lucide-react";

export default function IncomingCall() {
  const [call, setCall] = useState<any>(null);
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState<"voice"|"video">("voice");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [agoraClient, setAgoraClient] = useState<any>(null);
  const [tracks, setTracks] = useState<{a:any,v:any}>({a:null,v:null});
  const durationTimer = useRef<any>(null);
  const startTime = useRef<number>(0);

  // Poll for incoming calls every 3 seconds
  useEffect(() => {
    const check = async () => {
      if (callActive) return;
      try {
        const res = await fetch("/api/calls");
        const data = await res.json();
        if (data.incoming && !call) {
          setCall(data.incoming);
          setCallType(data.incoming.type || "voice");
        }
      } catch {}
    };
    check();
    const i = setInterval(check, 3000);
    return () => clearInterval(i);
  }, [callActive, call]);

  const acceptCall = async () => {
    if (!call) return;
    try {
      const res = await fetch("/api/calls", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", callId: call.id })
      });
      const data = await res.json();
      if (data.success) {
        setCallActive(true);
        startTime.current = Date.now();
        durationTimer.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);

        // Connect with Agora
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        AgoraRTC.setLogLevel(4);
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        const channelName = `call_${call.id}`;
        const tk = await fetch("/api/agora", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelName, isHost: true }) }).then(r => r.json());

        client.on("user-published", async (user: any, type: any) => {
          await client.subscribe(user, type);
          if (type === "video") {
            const el = document.getElementById("remote-call-video");
            if (el) user.videoTrack?.play(el, { fit: "cover" });
          }
          if (type === "audio") user.audioTrack?.play();
        });

        await client.join(tk.appId, channelName, tk.token, tk.uid);

        if (callType === "video") {
          const [at, vt] = await AgoraRTC.createMicrophoneAndCameraTracks();
          setTracks({ a: at, v: vt });
          await client.publish([at, vt]);
          requestAnimationFrame(() => {
            const el = document.getElementById("local-call-video");
            if (el) vt.play(el, { fit: "cover", mirror: true });
          });
        } else {
          const at = await AgoraRTC.createMicrophoneAudioTrack();
          setTracks({ a: at, v: null });
          await client.publish([at]);
        }

        setAgoraClient(client);
      }
    } catch (e) { console.error("Accept call error:", e); }
  };

  const rejectCall = async () => {
    if (!call) return;
    try {
      await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject", callId: call.id }) });
    } catch {}
    setCall(null);
  };

  const endCall = async () => {
    try {
      if (tracks.v) { tracks.v.stop(); tracks.v.close(); }
      if (tracks.a) { tracks.a.stop(); tracks.a.close(); }
      if (agoraClient) await agoraClient.leave();
      if (call) await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "end", callId: call.id, duration }) });
    } catch {}
    if (durationTimer.current) clearInterval(durationTimer.current);
    setAgoraClient(null); setTracks({ a: null, v: null }); setCall(null);
    setCallActive(false); setDuration(0);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Nothing to show
  if (!call) return null;

  // === RINGING (not yet accepted) ===
  if (!callActive) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-lg flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl text-center border border-gray-700">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full animate-ping opacity-30" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center overflow-hidden border-4 border-white/20">
                {call.caller?.profilePhoto ? (
                  <img src={call.caller.profilePhoto} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
            </div>
            <h2 className="text-white text-xl font-bold mb-1">{call.caller?.name || "Someone"}</h2>
            <p className="text-gray-400 text-sm mb-2">
              {call.caller?.verified && <span className="text-blue-400 mr-1">✓</span>}
              Incoming {callType} call...
            </p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">Ringing</span>
            </div>
            <div className="flex items-center justify-center gap-8">
              <button onClick={rejectCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-110">
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <button onClick={acceptCall} className="w-16 h-16 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 animate-bounce">
                {callType === "video" ? <Video className="w-7 h-7 text-white" /> : <Phone className="w-7 h-7 text-white" />}
              </button>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <span className="text-red-400 text-xs font-medium">Decline</span>
              <span className="text-emerald-400 text-xs font-medium">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === ACTIVE CALL ===
  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Video area */}
      {callType === "video" ? (
        <div className="flex-1 relative">
          <div id="remote-call-video" className="w-full h-full bg-gray-900" />
          <div id="local-call-video" className="absolute bottom-24 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/30 bg-gray-800 shadow-xl" />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-center">
            <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center overflow-hidden border-4 border-white/20 mb-6">
              {call.caller?.profilePhoto ? <img src={call.caller.profilePhoto} className="w-full h-full object-cover" /> : <User className="w-14 h-14 text-white" />}
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">{call.caller?.name || "User"}</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-emerald-400 text-sm font-medium">{formatDuration(duration)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-900/95 backdrop-blur p-6 flex items-center justify-center gap-6">
        <button onClick={() => { if (tracks.a) { tracks.a.setEnabled(muted); setMuted(!muted); } }} className={"w-14 h-14 rounded-full flex items-center justify-center transition-all " + (muted ? "bg-red-500" : "bg-white/10 hover:bg-white/20")}>
          <Phone className={"w-6 h-6 text-white " + (muted ? "line-through" : "")} />
        </button>
        <button onClick={endCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-110">
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );
}
