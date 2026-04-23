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

function SelfieScreen({ steps, stream, onDone, onCancel }: { steps: StepDef[]; stream: MediaStream; onDone: (f: string[]) => void; onCancel: () => void }) {
  const vid = useRef<HTMLVideoElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const cnt = useRef<HTMLSpanElement>(null);
  const arrL = useRef<HTMLDivElement>(null);
  const arrR = useRef<HTMLDivElement>(null);
  const dots = useRef<HTMLDivElement>(null);
  const R = 153, C = 2 * Math.PI * R;
  const cur = useRef(0), pct = useRef(0), fin = useRef(false), caps = useRef<string[]>([]);

  function scan(): { cx: number; w: number } | null {
    const v = vid.current, c = cvs.current;
    if (!v || !c || v.videoWidth === 0) return null;
    c.width = 100; c.height = 100;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const s = Math.min(v.videoWidth, v.videoHeight);
    ctx.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, 100, 100);
    const d = ctx.getImageData(0, 0, 100, 100).data;
    let x1 = 100, x2 = 0, n = 0;
    for (let y = 0; y < 100; y += 3) for (let x = 0; x < 100; x += 3) {
      const i = (y * 100 + x) * 4, r = d[i], g = d[i+1], b = d[i+2];
      if (r > 50 && g > 30 && b > 10 && r > g && r > b && r - g > 8 && r > 65) {
        if (x < x1) x1 = x; if (x > x2) x2 = x; n++;
      }
    }
    if (n < 15 || x2 - x1 < 15) return null;
    return { cx: (x1 + x2) / 2 / 100, w: (x2 - x1) / 100 };
  }

  function grab(): string {
    const v = vid.current, c = cvs.current;
    if (!v || !c || v.videoWidth === 0) return "";
    c.width = 480; c.height = 480;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    const s = Math.min(v.videoWidth, v.videoHeight);
    ctx.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, 480, 480);
    return c.toDataURL("image/jpeg", 0.8);
  }

  function ui(i: number) {
    const s = steps[i]; if (!s) return;
    if (title.current) title.current.textContent = s.text;
    if (cnt.current) cnt.current.textContent = (i + 1) + "/" + steps.length;
    if (arrL.current) arrL.current.style.display = s.arrow === "left" ? "flex" : "none";
    if (arrR.current) arrR.current.style.display = s.arrow === "right" ? "flex" : "none";
    if (dots.current) for (let j = 0; j < dots.current.children.length; j++) {
      const el = dots.current.children[j] as HTMLElement;
      el.style.width = j === i ? "24px" : "8px";
      el.style.backgroundColor = j <= i ? "#2563eb" : "#d1d5db";
    }
  }

  useEffect(() => {
    const v = vid.current;
    if (v && stream) { v.srcObject = stream; v.play().catch(() => {}); }
    let tid: ReturnType<typeof setInterval> | null = null;
    const w = setTimeout(() => {
      tid = setInterval(() => {
        if (fin.current) return;
        const i = cur.current;
        if (i >= steps.length) { fin.current = true; if (tid) clearInterval(tid); onDone(caps.current); return; }
        const st = steps[i], face = scan();
        let ok = false;
        if (face) {
          if (st.id === "center") ok = Math.abs(face.cx - 0.5) < 0.2 && face.w > 0.12;
          else if (st.id === "left") ok = face.cx > 0.55;
          else if (st.id === "right") ok = face.cx < 0.45;
          else ok = face.w > 0.1;
        }
        if (hint.current) {
          if (!face) { hint.current.textContent = "Position your face in the circle"; hint.current.style.color = "#ef4444"; }
          else if (!ok) { hint.current.textContent = "Follow the instruction above"; hint.current.style.color = "#f59e0b"; }
          else { hint.current.textContent = "Hold still..."; hint.current.style.color = "#16a34a"; }
        }
        if (ok) pct.current = Math.min(100, pct.current + 3);
        else pct.current = Math.max(0, pct.current - 5);
        if (ring.current) ring.current.style.strokeDashoffset = String(C * (1 - pct.current / 100));
        if (pct.current >= 100) {
          const f = grab(); if (f) caps.current.push(f);
          pct.current = 0;
          if (ring.current) ring.current.style.strokeDashoffset = String(C);
          cur.current = i + 1;
          if (cur.current >= steps.length) { fin.current = true; if (tid) clearInterval(tid); onDone(caps.current); return; }
          ui(cur.current);
        }
      }, 300);
    }, 2000);
    return () => { clearTimeout(w); if (tid) clearInterval(tid); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <canvas ref={cvs} className="hidden" />
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center"><X className="w-6 h-6 text-gray-900" /></button>
        <span ref={cnt} className="text-sm font-medium text-gray-500">1/{steps.length}</span>
        <span className="w-10" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative" style={{ width: 320, height: 320 }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="160" cy="160" r={R} fill="none" stroke="#d1d5db" strokeWidth="7" />
            <circle ref={ring} cx="160" cy="160" r={R} fill="none" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C} style={{ transition: "stroke-dashoffset 0.25s linear" }} />
          </svg>
          <div className="absolute rounded-full overflow-hidden" style={{ top: 7, left: 7, right: 7, bottom: 7 }}>
            <video ref={vid} className="w-full h-full object-cover" playsInline muted autoPlay style={{ transform: "scaleX(-1)" }} />
          </div>
          <div ref={arrL} className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-full items-center justify-center shadow-lg z-10" style={{ display: "none" }}><ArrowLeft className="w-6 h-6 text-white" /></div>
          <div ref={arrR} className="absolute right-[-24px] top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-full items-center justify-center shadow-lg z-10 rotate-180" style={{ display: "none" }}><ArrowLeft className="w-6 h-6 text-white" /></div>
        </div>
        <h2 ref={title} className="text-2xl font-bold text-gray-900 mt-10 text-center">{steps[0]?.text}</h2>
        <p ref={hint} className="text-sm mt-2 font-medium text-gray-400">Detecting face...</p>
      </div>
      <div className="px-6 pb-10">
        <div ref={dots} className="flex items-center justify-center gap-2">
          {steps.map((_, i) => (<div key={i} className="h-2 rounded-full" style={{ width: i === 0 ? 24 : 8, backgroundColor: i === 0 ? "#2563eb" : "#d1d5db", transition: "all 0.3s" }} />))}
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
  const idFR = useRef<HTMLInputElement>(null);
  const idBR = useRef<HTMLInputElement>(null);

  const stopCam = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } };
  useEffect(() => () => stopCam(), []);

  const startCam = async () => {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }, audio: false });
      streamRef.current = s;
      setSteps([...BASE_STEPS, FINAL_STEPS[Math.random() < 0.5 ? 0 : 1]]);
      setFrames([]);
      setPhase("selfie_live");
    } catch { setError("Camera access required."); }
  };

  const onDone = (f: string[]) => { setFrames(f); stopCam(); setPhase("processing"); };
  const onCancel = () => { stopCam(); setPhase("selfie_prep"); };

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

  const upId = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Max 10MB"); return; }
    setError("");
    const r = new FileReader();
    r.onload = ev => { if (side === "front") setIdFront(ev.target?.result as string); else setIdBack(ev.target?.result as string); };
    r.readAsDataURL(file);
  };

  const retry = () => { stopCam(); setPhase("intro"); setError(""); setIdFront(null); setIdBack(null); setIdType(""); setFrames([]); };
  if (!user) return null;

  if (user.verified || user.verificationStatus === "approved") return (
    <div className="max-w-md mx-auto text-center py-16"><div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}><div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-5"><CheckCircle className="w-12 h-12 text-emerald-500" /></div><h2 className={"text-2xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>You are Verified!</h2><p className={"text-sm mb-6 " + (dc ? "text-gray-400" : "text-gray-500")}>Your identity has been confirmed.</p><Link href="/dashboard/profile" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold text-sm">View Profile</Link></div></div>
  );

  if (user.verificationStatus === "pending") return (
    <div className="max-w-md mx-auto text-center py-16"><div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}><div className="w-24 h-24 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-5"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div><h2 className={"text-2xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Under Review</h2><p className={"text-sm mb-6 " + (dc ? "text-gray-400" : "text-gray-500")}>Our team is reviewing. Usually 1-24 hours.</p><Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm">Back to Dashboard</Link></div></div>
  );

  return (
    <div className="max-w-lg mx-auto">
      {phase === "selfie_live" && streamRef.current && <SelfieScreen steps={steps} stream={streamRef.current} onDone={onDone} onCancel={onCancel} />}

      {phase === "intro" && (<div className="py-4"><div className={"rounded-3xl overflow-hidden border " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}><div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-center"><div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-4"><Shield className="w-10 h-10 text-white" /></div><h1 className="text-2xl font-extrabold text-white mb-2">Identity Verification</h1><p className="text-blue-200 text-sm">Get verified and earn the trusted badge</p></div><div className="p-6"><div className={"p-4 rounded-xl mb-6 " + (dc ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-100")}><p className={"text-xs font-medium flex items-center gap-2 " + (dc ? "text-emerald-400" : "text-emerald-700")}><Sparkles className="w-4 h-4" /> Earn 100 bonus coins when verified!</p></div><button onClick={() => setPhase("id_select")} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold">Begin Verification</button></div></div></div>)}

      {phase === "id_select" && (<div className="py-4"><div className={"rounded-3xl border p-6 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}><div className="flex items-center gap-3 mb-6"><button onClick={() => setPhase("intro")} className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button><h2 className={"text-xl font-extrabold " + (dc ? "text-white" : "text-gray-900")}>Select ID Type</h2></div><div className="space-y-2">{ID_TYPES.map(t => (<button key={t.value} onClick={() => { setIdType(t.value); setPhase("id_upload"); }} className={"w-full flex items-center gap-4 p-4 rounded-2xl border text-left " + (dc ? "border-gray-700 hover:border-blue-500" : "border-gray-200 hover:border-blue-300")}><span className="text-3xl">{t.icon}</span><span className={"font-semibold text-sm " + (dc ? "text-white" : "text-gray-900")}>{t.label}</span></button>))}</div></div></div>)}

      {phase === "id_upload" && (<div className="py-4"><div className={"rounded-3xl border p-6 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}><div className="flex items-center gap-3 mb-6"><button onClick={() => setPhase("id_select")} className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button><h2 className={"text-xl font-extrabold " + (dc ? "text-white" : "text-gray-900")}>Upload Your ID</h2></div>{error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}<input ref={idFR} type="file" accept="image/*" capture="environment" onChange={e => upId(e, "front")} className="hidden" /><input ref={idBR} type="file" accept="image/*" capture="environment" onChange={e => upId(e, "back")} className="hidden" /><p className={"text-sm font-semibold mb-2 " + (dc ? "text-gray-300" : "text-gray-700")}>Front of ID *</p>{idFront ? (<div className="relative mb-4"><img src={idFront} className="w-full rounded-2xl border object-cover max-h-48" /><button onClick={() => setIdFront(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button></div>) : (<button onClick={() => idFR.current?.click()} className="w-full py-10 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 mb-4 text-gray-400 hover:border-blue-400"><Upload className="w-8 h-8" /><p className="text-sm font-semibold">Upload front of ID</p></button>)}<p className={"text-sm font-semibold mb-2 " + (dc ? "text-gray-300" : "text-gray-700")}>Back of ID (optional)</p>{idBack ? (<div className="relative mb-4"><img src={idBack} className="w-full rounded-2xl border object-cover max-h-48" /><button onClick={() => setIdBack(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button></div>) : (<button onClick={() => idBR.current?.click()} className="w-full py-8 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 mb-4 text-gray-400 hover:border-blue-400"><Upload className="w-6 h-6" /><p className="text-xs">Upload back of ID</p></button>)}<div className="flex gap-3 mt-4"><button onClick={() => setPhase("id_select")} className={"flex-1 py-3.5 rounded-xl border-2 font-bold text-sm " + (dc ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600")}>Back</button><button onClick={() => { if (!idFront) { setError("Upload front of ID"); return; } setPhase("selfie_prep"); }} className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm">Next: Selfie</button></div></div></div>)}

      {phase === "selfie_prep" && (<div className="py-4"><div className={"rounded-3xl border p-6 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}><div className="flex items-center gap-3 mb-6"><button onClick={() => setPhase("id_upload")} className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button><h2 className={"text-xl font-extrabold " + (dc ? "text-white" : "text-gray-900")}>Live Face Scan</h2></div><div className={"rounded-2xl p-5 mb-6 " + (dc ? "bg-blue-500/10" : "bg-blue-50")}><p className={"text-sm font-bold mb-3 " + (dc ? "text-white" : "text-gray-900")}>You will be asked to:</p><div className="space-y-2">{["Look straight ahead", "Turn to the left", "Turn to the right", "Random: blink or smile"].map((t, i) => (<div key={i} className="flex items-center gap-3"><div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold " + (dc ? "bg-gray-700 text-gray-300" : "bg-white text-gray-600 shadow-sm")}>{i+1}</div><span className={"text-sm " + (dc ? "text-gray-300" : "text-gray-700")}>{t}</span></div>))}</div></div><p className={"text-xs mb-6 " + (dc ? "text-amber-400" : "text-amber-700")}>Blue ring only fills when you follow the instruction. Remove hats and sunglasses. Use good lighting.</p>{error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}<button onClick={startCam} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"><Camera className="w-5 h-5" /> Start Face Scan</button></div></div>)}

      {phase === "processing" && (<div className="text-center py-16"><div className="w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6" /><h2 className={"text-xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Analyzing...</h2><p className={"text-sm " + (dc ? "text-gray-400" : "text-gray-500")}>Verifying your face scan and documents</p></div>)}

      {phase === "success" && (<div className="text-center py-8"><div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}><div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6"><CheckCircle className="w-12 h-12 text-emerald-500" /></div><h2 className={"text-2xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Verification Submitted!</h2><p className={"text-sm mb-6 " + (dc ? "text-gray-400" : "text-gray-500")}>Our team will review within 24 hours.</p><Link href="/dashboard" className="inline-block px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold">Back to Dashboard</Link></div></div>)}

      {phase === "failed" && (<div className="text-center py-8"><div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}><div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6"><XCircle className="w-12 h-12 text-red-500" /></div><h2 className={"text-2xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Verification Failed</h2><p className={"text-sm mb-6 " + (dc ? "text-gray-400" : "text-gray-500")}>{error || "Could not verify."}</p><button onClick={retry} className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold"><RotateCcw className="w-4 h-4" /> Try Again</button></div></div>)}
    </div>
  );
}
