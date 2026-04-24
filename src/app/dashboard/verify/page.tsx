"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "../layout";
import {
  Camera, CheckCircle, XCircle, RotateCcw, Shield,
  Upload, ArrowLeft, X, Sparkles, ChevronRight
} from "lucide-react";
import Link from "next/link";

type Phase = "intro" | "ids" | "idu" | "prep" | "cam" | "review" | "wait" | "ok" | "fail";

const IDS = [
  { v: "passport", l: "International Passport", i: "\u{1F6C2}" },
  { v: "national_id", l: "National ID Card", i: "\u{1FAAA}" },
  { v: "drivers_license", l: "Driver License", i: "\u{1F697}" },
  { v: "voters_card", l: "Voter Card", i: "\u{1F5F3}" },
  { v: "residence_permit", l: "Residence Permit", i: "\u{1F3E0}" },
  { v: "military_id", l: "Military ID", i: "\u{1F396}" },
];

const POSES = [
  { id: "front", label: "Look straight at camera", icon: "\u{1F642}" },
  { id: "left", label: "Turn your head to the LEFT", icon: "\u{1F448}" },
  { id: "right", label: "Turn your head to the RIGHT", icon: "\u{1F449}" },
];

function CameraScreen({
  onDone,
  onCancel,
}: {
  onDone: (photos: string[]) => void;
  onCancel: () => void;
}) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const canRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        if (!mounted) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (vidRef.current) {
          vidRef.current.srcObject = s;
          vidRef.current.play().catch(() => {});
        }
      } catch {
        onCancel();
      }
    })();
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const capture = useCallback(() => {
    const v = vidRef.current;
    const c = canRef.current;
    if (!v || !c || v.videoWidth === 0) return;

    // 3-2-1 countdown then capture
    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);

        // Flash effect
        setFlash(true);
        setTimeout(() => setFlash(false), 200);

        // Capture
        c.width = 320;
        c.height = 320;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const sz = Math.min(v.videoWidth, v.videoHeight);
        ctx.drawImage(v, (v.videoWidth - sz) / 2, (v.videoHeight - sz) / 2, sz, sz, 0, 0, 320, 320);
        const dataUrl = c.toDataURL("image/jpeg", 0.6);

        const newPhotos = [...photos, dataUrl];
        setPhotos(newPhotos);

        if (step + 1 >= POSES.length) {
          // All poses done - stop camera and return
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
          onDone(newPhotos);
        } else {
          setStep(step + 1);
        }
      }
    }, 800);
  }, [step, photos, onDone]);

  const pose = POSES[step];

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col">
      <canvas ref={canRef} className="hidden" />

      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3 bg-gray-950">
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center">
          <X className="w-6 h-6 text-white" />
        </button>
        <span className="text-sm font-medium text-gray-400">
          Step {step + 1} of {POSES.length}
        </span>
        <span className="w-10" />
      </div>

      {/* Instruction */}
      <div className="text-center px-6 py-4 bg-gray-950">
        <span className="text-4xl">{pose?.icon}</span>
        <h2 className="text-xl font-bold text-white mt-2">{pose?.label}</h2>
        <p className="text-gray-400 text-sm mt-1">Position yourself, then tap the capture button</p>
      </div>

      {/* Camera view */}
      <div className="flex-1 flex items-center justify-center bg-gray-950 px-6">
        <div className="relative w-[280px] h-[280px]">
          {/* Circle border */}
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 z-10" />

          {/* Progress dots */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {POSES.map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: i < step ? "#22c55e" : i === step ? "#3b82f6" : "#4b5563",
                }}
              />
            ))}
          </div>

          {/* Video */}
          <div className="w-full h-full rounded-full overflow-hidden">
            <video
              ref={vidRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
              style={{ transform: "scaleX(-1)" }}
            />
          </div>

          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-30">
              <span className="text-6xl font-bold text-white">{countdown}</span>
            </div>
          )}
        </div>
      </div>

      {/* Capture button */}
      <div className="pb-10 pt-6 flex justify-center bg-gray-950">
        <button
          onClick={capture}
          disabled={countdown !== null}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50"
        >
          <div className="w-14 h-14 rounded-full bg-white" />
        </button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const [phase, setPhase] = useState<Phase>("intro");
  const [photos, setPhotos] = useState<string[]>([]);
  const [idType, setIdType] = useState("");
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);

  const handleDone = (p: string[]) => {
    setPhotos(p);
    setPhase("review");
  };

  const handleCancel = () => {
    setPhase("prep");
  };

  const submit = async () => {
    setPhase("wait");
    setErr("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationPhoto: photos[0] || "",
          idDocument: idFront || "",
          idDocumentBack: idBack || "",
          idType,
          frames: photos.length,
          challenges: POSES.map((p) => p.id),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhase("ok");
        reload();
      } else {
        setPhase("fail");
        setErr(data.error || "Verification failed.");
      }
    } catch {
      setPhase("fail");
      setErr("Connection error. Please try again.");
    }
  };

  const uploadId = (e: React.ChangeEvent<HTMLInputElement>, side: "f" | "b") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setErr("Max 10MB"); return; }
    setErr("");
    const img = new Image();
    img.onload = () => {
      const MAX = 600;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const cvs = document.createElement("canvas");
      cvs.width = w;
      cvs.height = h;
      const ctx = cvs.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = cvs.toDataURL("image/jpeg", 0.5);
      if (side === "f") setIdFront(compressed);
      else setIdBack(compressed);
    };
    img.src = URL.createObjectURL(file);
  };

  const retry = () => {
    setPhase("intro");
    setErr("");
    setIdFront(null);
    setIdBack(null);
    setIdType("");
    setPhotos([]);
  };

  if (!user) return null;

  if (user.verified || user.verificationStatus === "approved") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className={"text-2xl font-bold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Verified!</h2>
        <p className={"text-sm mb-6 " + (dc ? "text-gray-400" : "text-gray-500")}>Your identity is confirmed.</p>
        <Link href="/dashboard/profile" className="px-6 py-3 bg-emerald-500 text-white rounded-full font-bold text-sm inline-block">View Profile</Link>
      </div>
    </div>
  );

  if (user.verificationStatus === "pending") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className={"text-2xl font-bold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Under Review</h2>
        <p className={"text-sm mb-6 " + (dc ? "text-gray-400" : "text-gray-500")}>Our team is reviewing. Usually 1-24 hours.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-rose-500 text-white rounded-full font-bold text-sm inline-block">Dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      {/* Camera overlay */}
      {phase === "cam" && (
        <CameraScreen onDone={handleDone} onCancel={handleCancel} />
      )}

      {/* Intro */}
      {phase === "intro" && (
        <div className="py-4">
          <div className={"rounded-3xl overflow-hidden border " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-center">
              <Shield className="w-12 h-12 text-white mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-white">Verify Your Identity</h1>
              <p className="text-blue-200 text-sm mt-1">Get the trusted badge on your profile</p>
            </div>
            <div className="p-6 space-y-4">
              <div className={"p-4 rounded-xl " + (dc ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-100")}>
                <p className={"text-xs font-medium flex items-center gap-2 " + (dc ? "text-emerald-400" : "text-emerald-700")}>
                  <Sparkles className="w-4 h-4" /> Earn 100 bonus coins when verified!
                </p>
              </div>

              <div className={"rounded-xl p-4 space-y-3 " + (dc ? "bg-gray-700/50" : "bg-gray-50")}>
                <p className={"text-sm font-semibold " + (dc ? "text-white" : "text-gray-900")}>How it works:</p>
                {["Upload your government ID", "Take 3 selfie photos (front, left, right)", "Admin reviews and approves"].map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold " + (dc ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700")}>{i + 1}</div>
                    <span className={"text-sm " + (dc ? "text-gray-300" : "text-gray-600")}>{t}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => setPhase("ids")} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                Begin Verification <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID type */}
      {phase === "ids" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setPhase("intro")} className="p-2"><ArrowLeft className="w-5 h-5" /></button>
              <h2 className={"text-xl font-bold " + (dc ? "text-white" : "text-gray-900")}>Select ID Type</h2>
            </div>
            <div className="space-y-2">
              {IDS.map((t) => (
                <button key={t.v} onClick={() => { setIdType(t.v); setPhase("idu"); }} className={"w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-colors " + (dc ? "border-gray-700 hover:border-blue-500 hover:bg-gray-700" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50")}>
                  <span className="text-2xl">{t.i}</span>
                  <span className={"font-semibold text-sm " + (dc ? "text-white" : "text-gray-900")}>{t.l}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ID upload */}
      {phase === "idu" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setPhase("ids")} className="p-2"><ArrowLeft className="w-5 h-5" /></button>
              <h2 className={"text-xl font-bold " + (dc ? "text-white" : "text-gray-900")}>Upload ID</h2>
            </div>
            {err && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{err}</div>}
            <input ref={ref1} type="file" accept="image/*" capture="environment" onChange={(e) => uploadId(e, "f")} className="hidden" />
            <input ref={ref2} type="file" accept="image/*" capture="environment" onChange={(e) => uploadId(e, "b")} className="hidden" />

            <p className={"text-sm font-semibold mb-2 " + (dc ? "text-gray-300" : "text-gray-700")}>Front of ID *</p>
            {idFront ? (
              <div className="relative mb-4">
                <img src={idFront} className="w-full rounded-2xl border object-cover max-h-48" alt="front" />
                <button onClick={() => setIdFront(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => ref1.current?.click()} className={"w-full py-10 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 mb-4 transition-colors " + (dc ? "border-gray-600 text-gray-400 hover:border-blue-500" : "text-gray-400 hover:border-blue-400")}>
                <Upload className="w-8 h-8" />
                <p className="text-sm font-semibold">Tap to upload front</p>
              </button>
            )}

            <p className={"text-sm font-semibold mb-2 " + (dc ? "text-gray-300" : "text-gray-700")}>Back of ID (optional)</p>
            {idBack ? (
              <div className="relative mb-4">
                <img src={idBack} className="w-full rounded-2xl border object-cover max-h-48" alt="back" />
                <button onClick={() => setIdBack(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => ref2.current?.click()} className={"w-full py-8 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 mb-4 " + (dc ? "border-gray-600 text-gray-500" : "text-gray-400")}>
                <Upload className="w-6 h-6" />
                <p className="text-xs">Upload back</p>
              </button>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setPhase("ids")} className={"flex-1 py-3 rounded-xl border-2 font-bold text-sm " + (dc ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600")}>Back</button>
              <button onClick={() => { if (!idFront) { setErr("Please upload front of ID"); return; } setPhase("prep"); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">
                Next: Selfie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selfie prep */}
      {phase === "prep" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setPhase("idu")} className="p-2"><ArrowLeft className="w-5 h-5" /></button>
              <h2 className={"text-xl font-bold " + (dc ? "text-white" : "text-gray-900")}>Selfie Verification</h2>
            </div>

            <div className={"rounded-2xl p-5 mb-6 " + (dc ? "bg-blue-500/10" : "bg-blue-50")}>
              <p className={"text-sm font-bold mb-3 " + (dc ? "text-white" : "text-gray-900")}>You will take 3 photos:</p>
              <div className="space-y-3">
                {POSES.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <span className={"text-sm " + (dc ? "text-gray-300" : "text-gray-700")}>{p.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={"rounded-xl p-4 mb-6 " + (dc ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-100")}>
              <p className={"text-xs " + (dc ? "text-amber-400" : "text-amber-700")}>
                A 3-second countdown starts when you tap the capture button. Make sure your face is clearly visible. Remove hats and sunglasses.
              </p>
            </div>

            {err && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{err}</div>}

            <button
              onClick={() => { setPhotos([]); setPhase("cam"); }}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" /> Open Camera
            </button>
          </div>
        </div>
      )}

      {/* Review photos */}
      {phase === "review" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <h2 className={"text-xl font-bold mb-4 " + (dc ? "text-white" : "text-gray-900")}>Review Your Photos</h2>
            <p className={"text-sm mb-4 " + (dc ? "text-gray-400" : "text-gray-500")}>Make sure your face is clear in each photo.</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {photos.map((p, i) => (
                <div key={i} className="text-center">
                  <img src={p} className="w-full aspect-square rounded-xl border object-cover" alt={POSES[i]?.label} />
                  <p className={"text-xs mt-1 " + (dc ? "text-gray-400" : "text-gray-500")}>{POSES[i]?.id}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setPhotos([]); setPhase("cam"); }}
                className={"flex-1 py-3 rounded-xl border-2 font-bold text-sm " + (dc ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600")}
              >
                <RotateCcw className="w-4 h-4 inline mr-1" /> Retake
              </button>
              <button
                onClick={submit}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm"
              >
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting */}
      {phase === "wait" && (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6" />
          <h2 className={"text-xl font-bold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Submitting...</h2>
          <p className={"text-sm " + (dc ? "text-gray-400" : "text-gray-500")}>Uploading your verification</p>
        </div>
      )}

      {/* Success */}
      {phase === "ok" && (
        <div className="text-center py-8">
          <div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className={"text-2xl font-bold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Submitted!</h2>
            <p className={"text-sm mb-6 " + (dc ? "text-gray-400" : "text-gray-500")}>Admin will review your selfie and ID within 24 hours.</p>
            <Link href="/dashboard" className="px-8 py-3 bg-emerald-500 text-white rounded-full font-bold inline-block">Dashboard</Link>
          </div>
        </div>
      )}

      {/* Failed */}
      {phase === "fail" && (
        <div className="text-center py-8">
          <div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className={"text-2xl font-bold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Failed</h2>
            <p className={"text-sm mb-6 " + (dc ? "text-gray-400" : "text-gray-500")}>{err || "Something went wrong."}</p>
            <button onClick={retry} className="px-8 py-3 bg-rose-500 text-white rounded-full font-bold inline-flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
