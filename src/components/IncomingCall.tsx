"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, PhoneOff, Video, User, Mic, MicOff, VideoOff } from "lucide-react";

// Generate ringtone using Web Audio API
function playRingtone(): { stop: () => void } {
  try {
    const ctx = new AudioContext();
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(ctx.destination);
    let playing = true;

    const ring = () => {
      if (!playing) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 440;
      osc.connect(gainNode);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);

      setTimeout(() => {
        if (!playing) return;
        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.value = 480;
        osc2.connect(gainNode);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.4);
      }, 500);

      setTimeout(() => { if (playing) ring(); }, 2000);
    };

    ring();
    return { stop: () => { playing = false; ctx.close().catch(() => {}); } };
  } catch {
    return { stop: () => {} };
  }
}

// Outgoing call dial tone
function playDialTone(): { stop: () => void } {
  try {
    const ctx = new AudioContext();
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.15;
    gainNode.connect(ctx.destination);
    let playing = true;

    const dial = () => {
      if (!playing) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 425;
      osc.connect(gainNode);
      osc.start();
      osc.stop(ctx.currentTime + 1);
      setTimeout(() => { if (playing) dial(); }, 3000);
    };

    dial();
    return { stop: () => { playing = false; ctx.close().catch(() => {}); } };
  } catch {
    return { stop: () => {} };
  }
}

export default function IncomingCall() {
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [outgoingCall, setOutgoingCall] = useState<any>(null);
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState<"voice"|"video">("voice");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [agoraClient, setAgoraClient] = useState<any>(null);
  const [tracks, setTracks] = useState<{a:any,v:any}>({a:null,v:null});
  const [activeCallId, setActiveCallId] = useState<string|null>(null);
  const [activeCallUser, setActiveCallUser] = useState<any>(null);

  const durationTimer = useRef<any>(null);
  const startTime = useRef<number>(0);
  const ringtone = useRef<{stop:()=>void}|null>(null);
  const dialtone = useRef<{stop:()=>void}|null>(null);
  const outgoingPoll = useRef<any>(null);

  // Poll for incoming calls every 3 seconds
  useEffect(() => {
    const check = async () => {
      if (callActive || outgoingCall) return;
      try {
        const res = await fetch("/api/calls");
        const data = await res.json();
        if (data.incoming && !incomingCall) {
          setIncomingCall(data.incoming);
          setCallType(data.incoming.type || "voice");
          // Start ringtone
          if (!ringtone.current) ringtone.current = playRingtone();
          // Vibrate if supported
          if (navigator.vibrate) navigator.vibrate([500, 300, 500, 300, 500]);
        }
      } catch {}
    };
    check();
    const i = setInterval(check, 3000);
    return () => clearInterval(i);
  }, [callActive, incomingCall, outgoingCall]);

  // Listen for custom "startCall" events from message page
  useEffect(() => {
    const handler = async (e: any) => {
      const { receiverId, receiverName, receiverPhoto, type } = e.detail;
      setCallType(type || "voice");
      setOutgoingCall({ receiverId, receiverName, receiverPhoto });

      // Start dial tone
      dialtone.current = playDialTone();

      // Create the call
      try {
        const res = await fetch("/api/calls", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "call", receiverId, type: type || "voice" })
        });
        const data = await res.json();
        if (data.call) {
          setActiveCallId(data.call.id);
          setActiveCallUser({ name: receiverName, profilePhoto: receiverPhoto });

          // Poll for acceptance
          outgoingPoll.current = setInterval(async () => {
            try {
              const r = await fetch("/api/calls/status?callId=" + data.call.id);
              const d = await r.json();
              if (d.status === "active") {
                // They picked up!
                clearInterval(outgoingPoll.current);
                if (dialtone.current) { dialtone.current.stop(); dialtone.current = null; }
                setOutgoingCall(null);
                connectCall(data.call.id, type || "voice", { name: receiverName, profilePhoto: receiverPhoto });
              } else if (d.status === "rejected" || d.status === "missed" || d.status === "completed") {
                clearInterval(outgoingPoll.current);
                if (dialtone.current) { dialtone.current.stop(); dialtone.current = null; }
                setOutgoingCall(null);
                setActiveCallId(null);
              }
            } catch {}
          }, 2000);
        }
      } catch {
        if (dialtone.current) { dialtone.current.stop(); dialtone.current = null; }
        setOutgoingCall(null);
      }
    };

    window.addEventListener("startCall", handler);
    return () => window.removeEventListener("startCall", handler);
  }, []);

  // Connect to Agora for active call
  const connectCall = async (callId: string, type: string, user: any) => {
    try {
      if (!callActive) {
        setCallActive(true);
        setActiveCallId(callId);
        setActiveCallUser(user);
        setCallType(type as "voice"|"video");
      }
      startTime.current = Date.now();
      durationTimer.current = setInterval(() => setDuration(Math.floor((Date.now() - startTime.current) / 1000)), 1000);

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(4);
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      const channelName = `call_${callId}`;
      const tk = await fetch("/api/agora", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelName, isHost: true }) }).then(r => r.json());

      client.on("user-published", async (u: any, t: any) => {
        await client.subscribe(u, t);
        if (t === "video") {
          const tryPlay = () => { const el = document.getElementById("call-remote-video"); if (el && u.videoTrack) { u.videoTrack.play(el, { fit: "cover" }); return true; } return false; };
          if (!tryPlay()) { let n = 0; const iv = setInterval(() => { n++; if (tryPlay() || n > 20) clearInterval(iv); }, 200); }
        }
        if (t === "audio") u.audioTrack?.play();
      });

      client.on("user-left", () => endCall());

      await client.join(tk.appId, channelName, tk.token, tk.uid);

      // Subscribe to any users who already joined before us
      for (const remoteUser of client.remoteUsers) {
        if (remoteUser.hasVideo) {
          await client.subscribe(remoteUser, "video");
          const tryPlay = () => { const el = document.getElementById("call-remote-video"); if (el && remoteUser.videoTrack) { remoteUser.videoTrack.play(el, { fit: "cover" }); return true; } return false; };
          if (!tryPlay()) { let n = 0; const iv = setInterval(() => { n++; if (tryPlay() || n > 20) clearInterval(iv); }, 200); }
        }
        if (remoteUser.hasAudio) {
          await client.subscribe(remoteUser, "audio");
          remoteUser.audioTrack?.play();
        }
      }

      if (type === "video") {
        const [at, vt] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setTracks({ a: at, v: vt });
        await client.publish([at, vt]);
        // Wait for DOM to be ready
        const playLocal = () => {
          const el = document.getElementById("call-local-video");
          if (el && vt) { vt.play(el, { fit: "cover", mirror: true }); return true; }
          return false;
        };
        if (!playLocal()) {
          let n = 0;
          const iv = setInterval(() => { n++; if (playLocal() || n > 20) clearInterval(iv); }, 200);
        }
      } else {
        const at = await AgoraRTC.createMicrophoneAudioTrack();
        setTracks({ a: at, v: null });
        await client.publish([at]);
      }

      setAgoraClient(client);
    } catch (e) { console.error("Connect call error:", e); endCall(); }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    if (ringtone.current) { ringtone.current.stop(); ringtone.current = null; }
    try {
      const res = await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "accept", callId: incomingCall.id }) });
      const data = await res.json();
      if (data.success) {
        const user = incomingCall.caller;
        const cId = incomingCall.id;
        const cType = callType;
        setIncomingCall(null);
        setCallActive(true);
        setActiveCallUser(user);
        setActiveCallId(cId);
        setCallType(cType);
        // Small delay to let React render the active call UI first
        setTimeout(() => connectCall(cId, cType, user), 300);
      }
    } catch (e) { console.error("Accept call error:", e); }
  };

  const rejectCall = async () => {
    if (ringtone.current) { ringtone.current.stop(); ringtone.current = null; }
    if (!incomingCall) return;
    try { await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject", callId: incomingCall.id }) }); } catch {}
    setIncomingCall(null);
  };

  const cancelOutgoing = async () => {
    if (dialtone.current) { dialtone.current.stop(); dialtone.current = null; }
    if (outgoingPoll.current) clearInterval(outgoingPoll.current);
    if (activeCallId) {
      try { await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel", callId: activeCallId }) }); } catch {}
    }
    setOutgoingCall(null); setActiveCallId(null);
  };

  const endCall = async () => {
    try {
      if (tracks.v) { tracks.v.stop(); tracks.v.close(); }
      if (tracks.a) { tracks.a.stop(); tracks.a.close(); }
      if (agoraClient) await agoraClient.leave();
      if (activeCallId) await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "end", callId: activeCallId, duration }) });
    } catch {}
    if (durationTimer.current) clearInterval(durationTimer.current);
    if (ringtone.current) { ringtone.current.stop(); ringtone.current = null; }
    if (dialtone.current) { dialtone.current.stop(); dialtone.current = null; }
    setAgoraClient(null); setTracks({ a: null, v: null }); setIncomingCall(null);
    setOutgoingCall(null); setCallActive(false); setDuration(0);
    setActiveCallId(null); setActiveCallUser(null); setMuted(false); setCamOff(false);
  };

  const toggleMic = async () => { if (tracks.a) { await tracks.a.setEnabled(muted); setMuted(!muted); } };
  const toggleCam = async () => { if (tracks.v) { await tracks.v.setEnabled(camOff); setCamOff(!camOff); } };
  const formatDur = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  // ===== OUTGOING CALL (ringing other user) =====
  if (outgoingCall) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl text-center border border-gray-700">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center overflow-hidden border-4 border-white/20">
                {outgoingCall.receiverPhoto ? <img src={outgoingCall.receiverPhoto} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-white" />}
              </div>
            </div>
            <h2 className="text-white text-xl font-bold mb-1">{outgoingCall.receiverName || "User"}</h2>
            <div className="flex items-center justify-center gap-2 mb-2">
              {callType === "video" ? <Video className="w-4 h-4 text-gray-400" /> : <Phone className="w-4 h-4 text-gray-400" />}
              <p className="text-gray-400 text-sm">Calling...</p>
            </div>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">Ringing</span>
              <div className="flex gap-1 ml-2">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
              </div>
            </div>
            <button onClick={cancelOutgoing} className="w-16 h-16 mx-auto bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-110">
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <p className="text-red-400 text-xs font-medium mt-3">Cancel</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== INCOMING CALL (ringing) =====
  if (incomingCall && !callActive) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl text-center border border-gray-700">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full animate-ping opacity-30" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center overflow-hidden border-4 border-white/20">
                {incomingCall.caller?.profilePhoto ? <img src={incomingCall.caller.profilePhoto} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-white" />}
              </div>
            </div>
            <h2 className="text-white text-xl font-bold mb-1">{incomingCall.caller?.name || "Someone"}</h2>
            <p className="text-gray-400 text-sm mb-2">
              {incomingCall.caller?.verified && <span className="text-blue-400 mr-1">✓</span>}
              Incoming {callType} call
            </p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">Ringing</span>
            </div>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <button onClick={rejectCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-110">
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
                <span className="text-red-400 text-xs font-medium mt-2 block">Decline</span>
              </div>
              <div className="text-center">
                <button onClick={acceptCall} className="w-16 h-16 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 animate-bounce">
                  {callType === "video" ? <Video className="w-7 h-7 text-white" /> : <Phone className="w-7 h-7 text-white" />}
                </button>
                <span className="text-emerald-400 text-xs font-medium mt-2 block">Accept</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== ACTIVE CALL =====
  if (callActive) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        {callType === "video" ? (
          <div className="flex-1 relative">
            <div id="call-remote-video" className="w-full h-full bg-gray-900" />
            <div id="call-local-video" className="absolute bottom-28 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/30 bg-gray-800 shadow-xl z-10" />
            {/* Top info */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center overflow-hidden">
                  {activeCallUser?.profilePhoto ? <img src={activeCallUser.profilePhoto} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{activeCallUser?.name || "User"}</p>
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /><span className="text-emerald-400 text-xs">{formatDur(duration)}</span></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-pulse" />
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-xl">
                  {activeCallUser?.profilePhoto ? <img src={activeCallUser.profilePhoto} className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-white" />}
                </div>
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">{activeCallUser?.name || "User"}</h2>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-emerald-400 font-mono text-lg">{formatDur(duration)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gray-900/95 backdrop-blur p-6 flex items-center justify-center gap-5">
          <button onClick={toggleMic} className={"w-14 h-14 rounded-full flex items-center justify-center transition-all " + (muted ? "bg-red-500" : "bg-white/10 hover:bg-white/20")}>
            {muted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>
          {callType === "video" && (
            <button onClick={toggleCam} className={"w-14 h-14 rounded-full flex items-center justify-center transition-all " + (camOff ? "bg-red-500" : "bg-white/10 hover:bg-white/20")}>
              {camOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
            </button>
          )}
          <button onClick={endCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-110">
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
