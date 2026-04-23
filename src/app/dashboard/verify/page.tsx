"use client";
import { useState, useRef, useEffect } from "react";
import { useUser } from "../layout";
import { Camera, CheckCircle, XCircle, RotateCcw, Shield, Upload, ArrowLeft, X, Sparkles } from "lucide-react";
import Link from "next/link";

type Phase = "intro"|"id_select"|"id_upload"|"selfie_prep"|"selfie_live"|"processing"|"success"|"failed";

const ID_TYPES = [
  { value:"passport", label:"International Passport", icon:"\u{1F6C2}" },
  { value:"national_id", label:"National ID Card", icon:"\u{1FAAA}" },
  { value:"drivers_license", label:"Driver's License", icon:"\u{1F697}" },
  { value:"voters_card", label:"Voter's Card", icon:"\u{1F5F3}" },
  { value:"residence_permit", label:"Residence Permit", icon:"\u{1F3E0}" },
  { value:"military_id", label:"Military ID", icon:"\u{1F396}" },
];

const BASE_STEPS = [
  { id:"center", text:"Look straight ahead", arrow:"none" },
  { id:"left", text:"Turn to the left", arrow:"left" },
  { id:"right", text:"Turn to the right", arrow:"right" },
];
const FINAL_STEPS = [
  { id:"blink", text:"Blink your eyes", arrow:"none" },
  { id:"smile", text:"Smile", arrow:"none" },
];

export default function VerifyPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const timerRef = useRef<any>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("intro");
  const [stepIdx, setStepIdx] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [steps, setSteps] = useState([...BASE_STEPS, FINAL_STEPS[0]]);
  const [frames, setFrames] = useState<string[]>([]);
  const [idType, setIdType] = useState("");
  const [idFront, setIdFront] = useState<string|null>(null);
  const [idBack, setIdBack] = useState<string|null>(null);
  const [error, setError] = useState("");

  const stopCamera = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  useEffect(() => () => stopCamera(), []);

  const captureFrame = (): string => {
    if (!videoRef.current || !canvasRef.current) return "";
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = 480; c.height = 480;
    const ctx = c.getContext("2d");
    if (!ctx || v.videoWidth === 0) return "";
    const s = Math.min(v.videoWidth, v.videoHeight);
    ctx.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, 480, 480);
    return c.toDataURL("image/jpeg", 0.85);
  };

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }, audio: false });
      streamRef.current = stream;
      // Randomize last step
      const finalStep = FINAL_STEPS[Math.random() < 0.5 ? 0 : 1];
      const allSteps = [...BASE_STEPS, finalStep];
      setSteps(allSteps);
      setStepIdx(0);
      setStepProgress(0);
      setFrames([]);
      setPhase("selfie_live");
    } catch {
      setError("Camera access required. Please allow camera permission and try again.");
    }
  };

  // Attach video stream when selfie_live phase renders
  useEffect(() => {
    if (phase !== "selfie_live") return;
    let attempts = 0;
    const attach = () => {
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
      attempts++;
      if (attempts < 10) setTimeout(attach, 300);
    };
    attach();
  }, [phase]);

  // Run timed challenges
  useEffect(() => {
    if (phase !== "selfie_live") return;
    if (stepIdx >= steps.length) return;

    // Wait 2s before starting progress (let user position)
    const delay = stepIdx === 0 ? 2000 : 1000;
    const stepDuration = 3500; // 3.5 seconds per step

    let startTime = 0;
    const timeout = setTimeout(() => {
      startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / stepDuration) * 100);
        setStepProgress(pct);

        if (elapsed >= stepDuration) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Capture frame
          const frame = captureFrame();
          if (frame) setFrames(prev => [...prev, frame]);
          // Next step or finish
          if (stepIdx + 1 >= steps.length) {
            setPhase("processing");
          } else {
            setStepProgress(0);
            setStepIdx(prev => prev + 1);
          }
        }
      }, 50);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [phase, stepIdx, steps.length]);

  // Submit when processing
  useEffect(() => {
    if (phase !== "processing") return;
    stopCamera();
    (async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationPhoto: frames[0] || "",
            idDocument: idFront || "",
            idDocumentBack: idBack || "",
            idType,
            frames: frames.length,
            selfieFrames: frames,
            challenges: steps.map(s => s.id),
          })
        });
        if (res.ok) { setPhase("success"); reload(); }
        else { const d = await res.json(); setPhase("failed"); setError(d.error || "Verification failed"); }
      } catch { setPhase("failed"); setError("Network error"); }
    })();
  }, [phase]);

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>, side: "front"|"back") => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Max 10MB"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = ev => { if (side === "front") setIdFront(ev.target?.result as string); else setIdBack(ev.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const retry = () => { stopCamera(); setPhase("intro"); setError(""); setIdFront(null); setIdBack(null); setIdType(""); setFrames([]); };

  if (!user) return null;

  // Already verified
  if (user.verified || user.verificationStatus === "approved") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}>
        <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-5"><CheckCircle className="w-12 h-12 text-emerald-500"/></div>
        <h2 className={"text-2xl font-extrabold mb-2 "+(dc?"text-white":"text-gray-900")}>You are Verified!</h2>
        <p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>Your identity has been confirmed. You have a verified badge.</p>
        <Link href="/dashboard/profile" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold text-sm">View Profile</Link>
      </div>
    </div>
  );

  // Pending
  if (user.verificationStatus === "pending") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}>
        <div className="w-24 h-24 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-5"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"/></div>
        <h2 className={"text-2xl font-extrabold mb-2 "+(dc?"text-white":"text-gray-900")}>Under Review</h2>
        <p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>Our team is reviewing your verification. This usually takes 1-24 hours.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm">Back to Dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <canvas ref={canvasRef} className="hidden"/>

      {/* ===== INTRO ===== */}
      {phase === "intro" && (
        <div className="py-4">
          <div className={"rounded-3xl overflow-hidden border "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}>
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"/>
              <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-4"><Shield className="w-10 h-10 text-white"/></div>
              <h1 className="text-2xl font-extrabold text-white mb-2">Identity Verification</h1>
              <p className="text-blue-200 text-sm">Get verified and earn the trusted badge</p>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {["ID Document","Live Selfie","Review"].map((s,i)=>(
                  <div key={i} className="flex-1 text-center">
                    <div className={"w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-bold mb-1 "+(dc?"bg-gray-700 text-gray-400":"bg-gray-100 text-gray-500")}>{i+1}</div>
                    <p className={"text-[10px] font-medium "+(dc?"text-gray-500":"text-gray-400")}>{s}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 mb-6">
                {[{i:"\u{1FAAA}",t:"Government ID",d:"Passport, National ID, or Driver's License"},{i:"\u{1F4F8}",t:"Live Video Selfie",d:"Face scan with head turns and expression"},{i:"\u{1F4A1}",t:"Good Lighting",d:"Well-lit area, no hats or sunglasses"}].map((item,i)=>(
                  <div key={i} className={"flex items-center gap-3 p-3.5 rounded-xl "+(dc?"bg-gray-700/50":"bg-gray-50")}>
                    <span className="text-2xl">{item.i}</span>
                    <div><p className={"text-sm font-semibold "+(dc?"text-white":"text-gray-900")}>{item.t}</p><p className={"text-xs "+(dc?"text-gray-400":"text-gray-500")}>{item.d}</p></div>
                  </div>
                ))}
              </div>
              <div className={"p-4 rounded-xl mb-6 "+(dc?"bg-emerald-500/10 border border-emerald-500/20":"bg-emerald-50 border border-emerald-100")}>
                <p className={"text-xs font-medium flex items-center gap-2 "+(dc?"text-emerald-400":"text-emerald-700")}><Sparkles className="w-4 h-4"/> Earn 100 bonus coins when verified!</p>
              </div>
              <button onClick={()=>setPhase("id_select")} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold hover:shadow-xl">Begin Verification</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ID TYPE ===== */}
      {phase === "id_select" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={()=>setPhase("intro")} className={"p-2 rounded-xl "+(dc?"hover:bg-gray-700":"hover:bg-gray-100")}><ArrowLeft className="w-5 h-5"/></button>
              <div><h2 className={"text-xl font-extrabold "+(dc?"text-white":"text-gray-900")}>Select ID Type</h2><p className={"text-xs "+(dc?"text-gray-500":"text-gray-400")}>Step 1 of 3</p></div>
            </div>
            <div className="space-y-2">
              {ID_TYPES.map(t=>(
                <button key={t.value} onClick={()=>{setIdType(t.value);setPhase("id_upload");}} className={"w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all "+(dc?"border-gray-700 hover:border-blue-500 hover:bg-gray-700/50":"border-gray-200 hover:border-blue-300 hover:bg-gray-50")}>
                  <span className="text-3xl">{t.icon}</span>
                  <span className={"font-semibold text-sm "+(dc?"text-white":"text-gray-900")}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ID UPLOAD ===== */}
      {phase === "id_upload" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={()=>setPhase("id_select")} className={"p-2 rounded-xl "+(dc?"hover:bg-gray-700":"hover:bg-gray-100")}><ArrowLeft className="w-5 h-5"/></button>
              <div><h2 className={"text-xl font-extrabold "+(dc?"text-white":"text-gray-900")}>Upload Your ID</h2><p className={"text-xs "+(dc?"text-gray-500":"text-gray-400")}>Step 1 of 3</p></div>
            </div>
            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            <input ref={idFrontRef} type="file" accept="image/*" capture="environment" onChange={e=>handleIdUpload(e,"front")} className="hidden"/>
            <input ref={idBackRef} type="file" accept="image/*" capture="environment" onChange={e=>handleIdUpload(e,"back")} className="hidden"/>

            <p className={"text-sm font-semibold mb-2 "+(dc?"text-gray-300":"text-gray-700")}>Front of ID *</p>
            {idFront ? (
              <div className="relative mb-4">
                <img src={idFront} className={"w-full rounded-2xl border object-cover max-h-48 "+(dc?"border-gray-700":"border-gray-200")}/>
                <button onClick={()=>setIdFront(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg">
                  <X className="w-4 h-4"/>
                </button>
                <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Uploaded</div>
              </div>
            ) : (
              <button onClick={()=>idFrontRef.current?.click()} className={"w-full py-10 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 mb-4 "+(dc?"border-gray-600 hover:border-blue-500 text-gray-400":"border-gray-300 hover:border-blue-400 text-gray-400")}>
                <Upload className="w-8 h-8"/><p className="text-sm font-semibold">Upload front of ID</p><p className="text-xs">Tap to take photo or choose file</p>
              </button>
            )}

            <p className={"text-sm font-semibold mb-2 "+(dc?"text-gray-300":"text-gray-700")}>Back of ID (optional)</p>
            {idBack ? (
              <div className="relative mb-4">
                <img src={idBack} className={"w-full rounded-2xl border object-cover max-h-48 "+(dc?"border-gray-700":"border-gray-200")}/>
                <button onClick={()=>setIdBack(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><X className="w-4 h-4"/></button>
              </div>
            ) : (
              <button onClick={()=>idBackRef.current?.click()} className={"w-full py-8 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 mb-4 "+(dc?"border-gray-600 hover:border-blue-500 text-gray-400":"border-gray-300 hover:border-blue-400 text-gray-400")}>
                <Upload className="w-6 h-6"/><p className="text-xs font-medium">Upload back of ID</p>
              </button>
            )}

            <div className={"p-3 rounded-xl mb-4 "+(dc?"bg-amber-500/10 border border-amber-500/20":"bg-amber-50 border border-amber-200")}>
              <p className={"text-xs "+(dc?"text-amber-300":"text-amber-700")}>Ensure all text is clear. Name on ID must match your ConnectHub profile.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setPhase("id_select")} className={"flex-1 py-3.5 rounded-xl border-2 font-bold text-sm "+(dc?"border-gray-600 text-gray-300":"border-gray-200 text-gray-600")}>Back</button>
              <button onClick={()=>{if(!idFront){setError("Please upload front of your ID");return;}setPhase("selfie_prep");}} className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm">Next: Selfie</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SELFIE PREP ===== */}
      {phase === "selfie_prep" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={()=>setPhase("id_upload")} className={"p-2 rounded-xl "+(dc?"hover:bg-gray-700":"hover:bg-gray-100")}><ArrowLeft className="w-5 h-5"/></button>
              <div><h2 className={"text-xl font-extrabold "+(dc?"text-white":"text-gray-900")}>Live Face Verification</h2><p className={"text-xs "+(dc?"text-gray-500":"text-gray-400")}>Step 2 of 3</p></div>
            </div>
            <div className={"rounded-2xl p-5 mb-6 "+(dc?"bg-blue-500/10 border border-blue-500/20":"bg-blue-50 border border-blue-100")}>
              <h3 className={"font-bold mb-3 text-sm "+(dc?"text-white":"text-gray-900")}>You will be asked to:</h3>
              <div className="space-y-2.5">
                {[{n:1,i:"\u{1F464}",t:"Look straight ahead"},{n:2,i:"\u{1F448}",t:"Turn to the left"},{n:3,i:"\u{1F449}",t:"Turn to the right"},{n:4,i:"\u{1F3B2}",t:"Random challenge (blink or smile)"}].map(c=>(
                  <div key={c.n} className="flex items-center gap-3">
                    <div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold "+(dc?"bg-gray-700 text-gray-300":"bg-white text-gray-600 shadow-sm")}>{c.n}</div>
                    <span className="text-xl">{c.i}</span>
                    <span className={"text-sm "+(dc?"text-gray-300":"text-gray-700")}>{c.t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={"p-4 rounded-xl mb-6 "+(dc?"bg-amber-500/10 border border-amber-500/20":"bg-amber-50 border border-amber-200")}>
              <p className={"text-xs "+(dc?"text-amber-400":"text-amber-700")}>Remove sunglasses, hats, or face coverings. Use good lighting. Follow each instruction for about 3 seconds.</p>
            </div>
            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            <button onClick={startCamera} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-xl">
              <Camera className="w-5 h-5"/> Start Face Scan
            </button>
          </div>
        </div>
      )}

      {/* ===== LIVE SELFIE (Facebook/Meta Style) ===== */}
      {phase === "selfie_live" && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-12 pb-3">
            <button onClick={()=>{stopCamera();setPhase("selfie_prep");}} className="w-10 h-10 flex items-center justify-center">
              <X className="w-6 h-6 text-gray-900"/>
            </button>
            <span className="text-sm font-medium text-gray-500">{stepIdx+1}/{steps.length}</span>
            <span className="text-sm font-medium text-transparent select-none">Help</span>
          </div>

          {/* Center camera area */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Circle */}
            <div className="relative" style={{width:320,height:320}}>
              {/* SVG ring */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320" style={{transform:"rotate(-90deg)"}}>
                <circle cx="160" cy="160" r="153" fill="none" stroke="#d1d5db" strokeWidth="7"/>
                <circle cx="160" cy="160" r="153" fill="none" stroke="#2563eb" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={2*Math.PI*153}
                  strokeDashoffset={2*Math.PI*153*(1-stepProgress/100)}
                  style={{transition:"stroke-dashoffset 0.15s linear"}}/>
              </svg>

              {/* Video */}
              <div className="absolute rounded-full overflow-hidden" style={{top:7,left:7,right:7,bottom:7}}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline muted autoPlay
                  style={{transform:"scaleX(-1)"}}
                />
              </div>

              {/* Direction arrows */}
              {steps[stepIdx]?.arrow === "left" && (
                <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg z-10">
                  <ArrowLeft className="w-6 h-6 text-white"/>
                </div>
              )}
              {steps[stepIdx]?.arrow === "right" && (
                <div className="absolute right-[-24px] top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg z-10 rotate-180">
                  <ArrowLeft className="w-6 h-6 text-white"/>
                </div>
              )}
            </div>

            {/* Instruction */}
            <h2 className="text-2xl font-bold text-gray-900 mt-10 text-center">
              {steps[stepIdx]?.text || "Hold still"}
            </h2>
          </div>

          {/* Bottom dots */}
          <div className="px-6 pb-10">
            <div className="flex items-center justify-center gap-2">
              {steps.map((_,i)=>(
                <div key={i} className={"h-2 rounded-full transition-all duration-300 "+(i<stepIdx?"bg-blue-600 w-2":i===stepIdx?"bg-blue-600 w-6":"bg-gray-300 w-2")}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== PROCESSING ===== */}
      {phase === "processing" && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"/>
          <h2 className={"text-xl font-extrabold mb-2 "+(dc?"text-white":"text-gray-900")}>Analyzing...</h2>
          <p className={"text-sm "+(dc?"text-gray-400":"text-gray-500")}>Verifying your face scan and documents</p>
        </div>
      )}

      {/* ===== SUCCESS ===== */}
      {phase === "success" && (
        <div className="text-center py-8">
          <div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}>
            <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6"><CheckCircle className="w-12 h-12 text-emerald-500"/></div>
            <h2 className={"text-2xl font-extrabold mb-2 "+(dc?"text-white":"text-gray-900")}>Verification Submitted!</h2>
            <p className={"text-sm mb-2 "+(dc?"text-gray-400":"text-gray-500")}>Your selfie and documents have been submitted.</p>
            <div className={"rounded-xl p-4 mb-6 "+(dc?"bg-blue-500/10":"bg-blue-50")}><p className={"text-xs "+(dc?"text-blue-300":"text-blue-700")}>Our team will review within 24 hours. You will be notified when approved.</p></div>
            <Link href="/dashboard" className="inline-block px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold">Back to Dashboard</Link>
          </div>
        </div>
      )}

      {/* ===== FAILED ===== */}
      {phase === "failed" && (
        <div className="text-center py-8">
          <div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-xl")}>
            <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6"><XCircle className="w-12 h-12 text-red-500"/></div>
            <h2 className={"text-2xl font-extrabold mb-2 "+(dc?"text-white":"text-gray-900")}>Verification Failed</h2>
            <p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>{error||"Could not verify your identity."}</p>
            <button onClick={retry} className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold"><RotateCcw className="w-4 h-4"/> Try Again</button>
          </div>
        </div>
      )}
    </div>
  );
}
