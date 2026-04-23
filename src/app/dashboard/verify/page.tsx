"use client";
import { useState, useRef, useEffect } from "react";
import { useUser } from "../layout";
import { Camera, CheckCircle, XCircle, RotateCcw, Shield, Upload, ArrowLeft, X, Sparkles } from "lucide-react";
import Link from "next/link";

type Phase = "intro" | "id_select" | "id_upload" | "selfie_prep" | "selfie_live" | "processing" | "success" | "failed";

interface StepDef { id: string; text: string; arrow: "none" | "left" | "right"; }

const ID_TYPES = [
  { value: "passport", label: "International Passport", icon: "\u{1F6C2}" },
  { value: "national_id", label: "National ID Card", icon: "\u{1FAAA}" },
  { value: "drivers_license", label: "Driver License", icon: "\u{1F697}" },
  { value: "voters_card", label: "Voter Card", icon: "\u{1F5F3}" },
  { value: "residence_permit", label: "Residence Permit", icon: "\u{1F3E0}" },
  { value: "military_id", label: "Military ID", icon: "\u{1F396}" },
];

const BASE_STEPS: StepDef[] = [
  { id: "center", text: "Look straight ahead", arrow: "none" },
  { id: "left", text: "Turn to the left", arrow: "left" },
  { id: "right", text: "Turn to the right", arrow: "right" },
];
const FINAL_STEPS: StepDef[] = [
  { id: "blink", text: "Blink your eyes", arrow: "none" },
  { id: "smile", text: "Smile", arrow: "none" },
];

function SelfieScreen({ steps, stream, onComplete, onCancel }: { steps: StepDef[]; stream: MediaStream; onComplete: (f: string[]) => void; onCancel: () => void; }) {
  const videoEl = useRef<HTMLVideoElement>(null);
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const ringEl = useRef<SVGCircleElement>(null);
  const titleEl = useRef<HTMLHeadingElement>(null);
  const feedbackEl = useRef<HTMLParagraphElement>(null);
  const counterEl = useRef<HTMLSpanElement>(null);
  const arrowLEl = useRef<HTMLDivElement>(null);
  const arrowREl = useRef<HTMLDivElement>(null);
  const dotsEl = useRef<HTMLDivElement>(null);
  const R = 153;
  const C = 2 * Math.PI * R;
  const cur = useRef(0);
  const pct = useRef(0);
  const isDone = useRef(false);
  const captured = useRef<string[]>([]);

  function detectFace(): { cx: number; cy: number; w: number } | null {
    const v = videoEl.current, cv = canvasEl.current;
    if (!v || !cv || v.videoWidth === 0) return null;
    cv.width = 120; cv.height = 120;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const sz = Math.min(v.videoWidth, v.videoHeight);
    ctx.drawImage(v, (v.videoWidth - sz) / 2, (v.videoHeight - sz) / 2, sz, sz, 0, 0, 120, 120);
    const img = ctx.getImageData(0, 0, 120, 120);
    const d = img.data;
    let mnX = 120, mxX = 0, mnY = 120, mxY = 0, n = 0;
    for (let y = 0; y < 120; y += 2) for (let x = 0; x < 120; x += 2) {
      const i = (y * 120 + x) * 4, r = d[i], g = d[i+1], b = d[i+2];
      if (r > 55 && g > 35 && b > 15 && r > g && r > b && r-g > 10 && r-b > 10 && r > 70) {
        if (x < mnX) mnX = x; if (x > mxX) mxX = x; if (y < mnY) mnY = y; if (y > mxY) mxY = y; n++;
      }
    }
    if (n < 20 || mxX-mnX < 20 || mxY-mnY < 20) return null;
    return { cx: (mnX+mxX)/2/120, cy: (mnY+mxY)/2/120, w: (mxX-mnX)/120 };
  }

  function grabFrame(): string {
    const v = videoEl.current, cv = canvasEl.current;
    if (!v || !cv || v.videoWidth === 0) return "";
    cv.width = 480; cv.height = 480;
    const ctx = cv.getContext("2d");
    if (!ctx) return "";
    const sz = Math.min(v.videoWidth, v.videoHeight);
    ctx.drawImage(v, (v.videoWidth-sz)/2, (v.videoHeight-sz)/2, sz, sz, 0, 0, 480, 480);
    return cv.toDataURL("image/jpeg", 0.85);
  }

  function setDots(idx: number) {
    if (!dotsEl.current) return;
    for (let i = 0; i < dotsEl.current.children.length; i++) {
      const el = dotsEl.current.children[i] as HTMLElement;
      el.style.width = (i < idx ? "8px" : i === idx ? "24px" : "8px");
      el.style.backgroundColor = (i <= idx ? "#2563eb" : "#d1d5db");
    }
  }

  function goStep(idx: number) {
    const s = steps[idx]; if (!s) return;
    if (titleEl.current) titleEl.current.textContent = s.text;
    if (counterEl.current) counterEl.current.textContent = (idx+1)+"/"+steps.length;
    if (arrowLEl.current) arrowLEl.current.style.display = s.arrow === "left" ? "flex" : "none";
    if (arrowREl.current) arrowREl.current.style.display = s.arrow === "right" ? "flex" : "none";
    setDots(idx);
  }

  useEffect(() => {
    const v = videoEl.current;
    if (v && stream) { v.srcObject = stream; v.play().catch(() => {}); }
    let loopId: ReturnType<typeof setInterval> | null = null;
    const warmup = setTimeout(() => {
      loopId = setInterval(() => {
        if (isDone.current) return;
        const idx = cur.current;
        if (idx >= steps.length) { isDone.current = true; if (loopId) clearInterval(loopId); onComplete(captured.current); return; }
        const step = steps[idx];
        const face = detectFace();
        let ok = false;
        if (face) {
          if (step.id === "center") ok = Math.abs(face.cx-0.5) < 0.18 && Math.abs(face.cy-0.45) < 0.2 && face.w > 0.15;
          else if (step.id === "left") ok = face.cx > 0.56;
          else if (step.id === "right") ok = face.cx < 0.44;
          else ok = face.w > 0.12 && Math.abs(face.cx-0.5) < 0.25;
        }
        if (feedbackEl.current) {
          if (!face) { feedbackEl.current.textContent = "Position your face in the circle"; feedbackEl.current.style.color = "#ef4444"; }
          else if (!ok) { feedbackEl.current.textContent = "Follow the instruction above"; feedbackEl.current.style.color = "#f59e0b"; }
          else { feedbackEl.current.textContent = "Hold still..."; feedbackEl.current.style.color = "#16a34a"; }
        }
        if (ok) pct.current = Math.min(100, pct.current + 3.5);
        else pct.current = Math.max(0, pct.current - 4);
        if (ringEl.current) ringEl.current.style.strokeDashoffset = String(C * (1 - pct.current / 100));
        if (pct.current >= 100) {
          const fr = grabFrame(); if (fr) captured.current.push(fr);
          pct.current = 0;
          if (ringEl.current) ringEl.current.style.strokeDashoffset = String(C);
          cur.current = idx + 1;
          if (cur.current >= steps.length) { isDone.current = true; if (loopId) clearInterval(loopId); onComplete(captured.current); return; }
          goStep(cur.current);
        }
      }, 250);
    }, 2000);
    return () => { clearTimeout(warmup); if (loopId) clearInterval(loopId); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col" style={{ touchAction: "none" }}>
      <canvas ref={canvasEl} className="hidden" />
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center"><X className="w-6 h-6 text-gray-900" /></button>
        <span ref={counterEl} className="text-sm font-medium text-gray-500">1/{steps.length}</span>
        <span className="w-10" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative" style={{ width: 320, height: 320 }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="160" cy="160" r={R} fill="none" stroke="#d1d5db" strokeWidth="7" />
            <circle ref={ringEl} cx="160" cy="160" r={R} fill="none" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C} style={{ transition: "stroke-dashoffset 0.2s linear" }} />
          </svg>
          <div className="absolute rounded-full overflow-hidden" style={{ top: 7, left: 7, right: 7, bottom: 7 }}>
            <video ref={videoEl} className="w-full h-full object-cover" playsInline muted autoPlay style={{ transform: "scaleX(-1)" }} />
          </div>
          <div ref={arrowLEl} className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-full items-center justify-center shadow-lg z-10" style={{ display: "none" }}><ArrowLeft className="w-6 h-6 text-white" /></div>
          <div ref={arrowREl} className="absolute right-[-24px] top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-full items-center justify-center shadow-lg z-10 rotate-180" style={{ display: "none" }}><ArrowLeft className="w-6 h-6 text-white" /></div>
        </div>
        <h2 ref={titleEl} className="text-2xl font-bold text-gray-900 mt-10 text-center">{steps[0]?.text}</h2>
        <p ref={feedbackEl} className="text-sm mt-2 font-medium text-gray-400">Detecting face...</p>
      </div>
      <div className="px-6 pb-10">
        <div ref={dotsEl} className="flex items-center justify-center gap-2">
          {steps.map((_, i) => (<div key={i} className="h-2 rounded-full" style={{ width: i === 0 ? 24 : 8, backgroundColor: i === 0 ? "#2563eb" : "#d1d5db", transition: "all 0.3s ease" }} />))}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [steps, setSteps] = useState<StepDef[]>([...BASE_STEPS, FINAL_STEPS[0]]);
  const [frames, setFrames] = useState<string[]>([]);
  const [idType, setIdType] = useState("");
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [error, setError] = useState("");
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } };
  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }, audio: false });
      streamRef.current = s;
      setSteps([...BASE_STEPS, FINAL_STEPS[Math.random() < 0.5 ? 0 : 1]]);
      setFrames([]);
      setPhase("selfie_live");
    } catch { setError("Camera access required."); }
  };

  const onSelfieComplete = (f: string[]) => { setFrames(f); stopCamera(); setPhase("processing"); };
  const onSelfieCancel = () => { stopCamera(); setPhase("selfie_prep"); };

  useEffect(() => {
    if (phase !== "processing") return;
    let dead = false;
    (async () => {
      await new Promise(r => setTimeout(r, 600));
      if (dead) return;
      try {
        const res = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verificationPhoto: frames[0] || "", idDocument: idFront || "", idDocumentBack: idBack || "", idType, frames: frames.length, selfieFrames: frames, challenges: steps.map(s => s.id) }) });
        if (dead) return;
        const d = await res.json();
        if (res.ok) { setPhase("success"); reload(); } else { setPhase("failed"); setError(d.error || "Verification failed."); }
      } catch { if (!dead) { setPhase("failed"); setError("Connection error. Check internet."); } }
    })();
    return () => { dead = true; };
  }, [phase]);

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>, side: "front"|"back") => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10*1024*1024) { setError("Max 10MB"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = ev => { if (side === "front") setIdFront(ev.target?.result as string); else setIdBack(ev.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const retry = () => { stopCamera(); setPhase("intro"); setError(""); setIdFront(null); setIdBack(null); setIdType(""); setFrames([]); };

  if (!user) return null;
  if (user.verified || user.verificationStatus === "approved") return (<div className="max-w-md mx-auto text-center py-16"><div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}><div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-5"><CheckCircle className="w-12 h-12 text-emerald-500" /></div><h2 className={"text-2xl font-extrabold mb-2 "+(dc?"text-white":"text-gray-900")}>You are Verified!</h2><p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>Your identity has been confirmed.</p><Link href="/dashboard/profile" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold text-sm">View Profile</Link></div></div>);
  if (user.verificationStatus === "pending") return (<div className="max-w-md mx-auto text-center py-16"><div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}><div className="w-24 h-24 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-5"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div><h2 className={"text-2xl font-extrabold mb-2 "+(dc?"text-white":"text-gray-900")}>Under Review</h2><p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>Our team is reviewing. Usually 1-24 hours.</p><Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm">Back to Dashboard</Link></div></div>);

  return (
    <div className="max-w-lg mx-auto">
      {phase === "selfie_live" && streamRef.current && <SelfieScreen steps={steps} stream={streamRef.current} onComplete={onSelfieComplete} onCancel={onSelfieCancel} />}

      {phase === "intro" && (<div className="py-4"><div className={"rounded-3xl overflow-hidden border "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}><div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-center"><div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-4"><Shield className="w-10 h-10 text-white" /></div><h1 className="text-2xl font-extrabold text-white mb-2">Identity Verification</h1><p className="text-blue-200 text-sm">Get verified and earn the trusted badge</p></div><div className="p-6"><div className="space-y-3 mb-6">{[{i:"\u{1FAAA}",t:"Government ID",d:"Passport, National ID, or Driver License"},{i:"\u{1F4F8}",t:"Live Video Selfie",d:"Face scan with head turns and expression"},{i:"\u{1F4A1}",t:"Good Lighting",d:"Well-lit area, no hats or sunglasses"}].map((item,idx) => (<div key={idx} className={"flex items-center gap-3 p-3.5 rounded-xl "+(dc?"bg-gray-700/50":"bg-gray-50")}><span className="text-2xl">{item.i}</span><div><p className={"text-sm font-semibold "+(dc?"text-white":"text-gray-900")}>{item.t}</p><p className={"text-xs "+(dc?"text-gray-400":"text-gray-500")}>{item.d}</p></div></div>))}</div><div className={"p-4 rounded-xl mb-6 "+(dc?"bg-emerald-500/10 border border-emerald-500/20":"bg-emerald-50 border border-emerald-100")}><p className={"text-xs font-medium flex items-center gap-2 "+(dc?"text-emerald-400":"text-emerald-700")}><Sparkles className="w-4 h-4" /> Earn 100 bonus coins when verified!</p></div><button onClick={() => setPhase("id_select")} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold">Begin Verification</button></div></div></div>)}

      {phase === "id_select" && (<div className="py-4"><div className={"rounded-3xl border p-6 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}><div className="flex items-center gap-3 mb-6"><button onClick={() => setPhase("intro")} className={"p-2 rounded-xl "+(dc?"hover:bg-gray-700":"hover:bg-gray-100")}><ArrowLeft className="w-5 h-5" /></button><div><h2 className={"text-xl font-extrabold "+(dc?"text-white":"text-gray-900")}>Select ID Type</h2><p className={"text-xs "+(dc?"text-gray-500":"text-gray-400")}>Step 1 of 3</p></div></div><div className="space-y-2">{ID_TYPES.map(t => (<button key={t.value} onClick={() => { setIdType(t.value); setPhase("id_upload"); }} className={"w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all "+(dc?"border-gray-700 hover:border-blue-500 hover:bg-gray-700/50":"border-gray-200 hover:border-blue-300 hover:bg-gray-50")}><span className="text-3xl">{t.icon}</span><span className={"font-semibold text-sm "+(dc?"text-white":"text-gray-900")}>{t.label}</span></button>))}</div></div></div>)}

      {phase === "id_upload" && (<div className="py-4"><div className={"rounded-3xl border p-6 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}><div className="flex items-center gap-3 mb-6"><button onClick={() => setPhase("id_select")} className={"p-2 rounded-xl "+(dc?"hover:bg-gray-700":"hover:bg-gray-100")}><ArrowLeft className="w-5 h-5" /></button><div><h2 className={"text-xl font-extrabold "+(dc?"text-white":"text-gray-900")}>Upload Your ID</h2><p className={"text-xs "+(dc?"text-gray-500":"text-gray-400")}>Step 1 of 3</p></div></div>{error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}<input ref={idFrontRef} type="file" accept="image/*" capture="environment" onChange={e => handleIdUpload(e,"front")} className="hidden" /><input ref={idBackRef} type="file" accept="image/*" capture="environment" onChange={e => handleIdUpload(e,"back")} className="hidden" /><p className={"text-sm font-semibold mb-2 "+(dc?"text-gray-300":"text-gray-700")}>Front of ID *</p>{idFront ? (<div className="relative mb-4"><img src={idFront} className={"w-full rounded-2xl border object-cover max-h-48 "+(dc?"border-gray-700":"border-gray-200")} /><button onClick={() => setIdFront(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><X className="w-4 h-4" /></button><div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Uploaded</div></div>) : (<button onClick={() => idFrontRef.current?.click()} className={"w-full py-10 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 mb-4 "+(dc?"border-gray-600 hover:border-blue-500 text-gray-400":"border-gray-300 hover:border-blue-400 text-gray-400")}><Upload className="w-8 h-8" /><p className="text-sm font-semibold">Upload front of ID</p></button>)}<p className={"text-sm font-semibold mb-2 "+(dc?"text-gray-300":"text-gray-700")}>Back of ID (optional)</p>{idBack ? (<div className="relative mb-4"><img src={idBack} className={"w-full rounded-2xl border object-cover max-h-48 "+(dc?"border-gray-700":"border-gray-200")} /><button onClick={() => setIdBack(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><X className="w-4 h-4" /></button></div>) : (<button onClick={() => idBackRef.current?.click()} className={"w-full py-8 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 mb-4 "+(dc?"border-gray-600 hover:border-blue-500 text-gray-400":"border-gray-300 hover:border-blue-400 text-gray-400")}><Upload className="w-6 h-6" /><p className="text-xs font-medium">Upload back of ID</p></button>)}<div className="flex gap-3 mt-4"><button onClick={() => setPhase("id_select")} className={"flex-1 py-3.5 rounded-xl border-2 font-bold text-sm "+(dc?"border-gray-600 text-gray-300":"border-gray-200 text-gray-600")}>Back</button><button onClick={() => { if (!idFront) { setError("Upload front of ID"); return; } setPhase("selfie_prep"); }} className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm">Next: Selfie</button></div></div></div>)}

      {phase === "selfie_prep" && (<div className="py-4"><div className={"rounded-3xl border p-6 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}><div className="flex items-center gap-3 mb-6"><button onClick={() => setPhase("id_upload")} className={"p-2 rounded-xl "+(dc?"hover:bg-gray-700":"hover:bg-gray-100")}><ArrowLeft className="w-5 h-5" /></button><div><h2 className={"text-xl font-extrabold "+(dc?"text-white":"text-gray-900")}>Live Face Verification</h2><p className={"text-xs "+(dc?"text-gray-500":"text-gray-400")}>Step 2 of 3</p></div></div><div className={"rounded-2xl p-5 mb-6 "+(dc?"bg-blue-500/10 border border-blue-500/20":"bg-blue-50 border border-blue-100")}><h3 className={"font-bold mb-3 text-sm "+(dc?"text-white":"text-gray-900")}>You will be asked to:</h3><div className="space-y-2.5">{[{n:1,i:"\u{1F464}",t:"Look straight ahead"},{n:2,i:"\u{1F448}",t:"Turn to the left"},{n:3,i:"\u{1F449}",t:"Turn to the right"},{n:4,i:"\u{1F3B2}",t:"Random challenge (blink or smile)"}].map(c => (<div key={c.n} className="flex items-center gap-3"><div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold "+(dc?"bg-gray-700 text-gray-300":"bg-white text-gray-600 shadow-sm")}>{c.n}</div><span className="text-xl">{c.i}</span><span className={"text-sm "+(dc?"text-gray-300":"text-gray-700")}>{c.t}</span></div>))}</div></div><div className={"p-4 rounded-xl mb-6 "+(dc?"bg-amber-500/10 border border-amber-500/20":"bg-amber-50 border border-amber-200")}><p className={"text-xs "+(dc?"text-amber-400":"text-amber-700")}>Remove sunglasses, hats, face coverings. Use good lighting. Blue ring fills only when you follow the instruction.</p></div>{error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}<button onClick={startCamera} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"><Camera className="w-5 h-5" /> Start Face Scan</button></div></div>)}

      {phase === "processing" && (<div className="text-center py-16"><div className="w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6" /><h2 className={"text-xl font-extrabold mb-2 "+(dc?"text-white":"text-gray-900")}>Analyzing...</h2><p className={"text-sm "+(dc?"text-gray-400":"text-gray-500")}>Verifying your face scan and documents</p></div>)}

      {phase === "success" && (<div className="text-center py-8"><div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}><div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6"><CheckCircle className="w-12 h-12 text-emerald-500" /></div><h2 className={"text-2xl font-extrabold mb-2 "+(dc?"text-white":"text-gray-900")}>Verification Submitted!</h2><p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>Our team will review within 24 hours.</p><Link href="/dashboard" className="inline-block px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold">Back to Dashboard</Link></div></div>)}

      {phase === "failed" && (<div className="text-center py-8"><div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}><div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6"><XCircle className="w-12 h-12 text-red-500" /></div><h2 className={"text-2xl font-extrabold mb-2 "+(dc?"text-white":"text-gray-900")}>Verification Failed</h2><p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>{error || "Could not verify."}</p><button onClick={retry} className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold"><RotateCcw className="w-4 h-4" /> Try Again</button></div></div>)}
    </div>
  );
}
