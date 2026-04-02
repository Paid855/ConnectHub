"use client";
import { useState, useRef, useEffect } from "react";
import { useUser } from "../layout";
import { Camera, CheckCircle, XCircle, RotateCcw, Shield, Upload, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { id:1, instruction:"Look straight at the camera", icon:"👀", duration:3000 },
  { id:2, instruction:"Slowly turn your head to the left", icon:"👈", duration:3000 },
  { id:3, instruction:"Slowly turn your head to the right", icon:"👉", duration:3000 },
  { id:4, instruction:"Blink your eyes slowly", icon:"😑", duration:3000 },
];

export default function VerifyPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"intro"|"id_upload"|"tips"|"camera"|"processing"|"success"|"failed">("intro");
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [idPhoto, setIdPhoto] = useState<string|null>(null);
  const [idType, setIdType] = useState("national_id");
  const [error, setError] = useState("");

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return "";
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 320; canvas.height = 320;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10*1024*1024) { setError("ID photo must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => { setIdPhoto(ev.target?.result as string); setError(""); };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user", width:{ideal:640}, height:{ideal:640} }, audio:false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(()=>{}); }
      setPhase("camera");
      setCurrentStep(0); setProgress(0); setCapturedFrames([]);
      setTimeout(() => runVerification(), 1500);
    } catch { setError("Camera access required. Please allow camera permission in your browser settings and try again."); }
  };

  const runVerification = () => {
    let step = 0;
    const frames: string[] = [];
    const doStep = () => {
      if (step >= STEPS.length) { setPhase("processing"); submitVerification(frames); return; }
      setCurrentStep(step);
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 100;
        setProgress(((step * 3000 + elapsed) / (STEPS.length * 3000)) * 100);
        if (elapsed >= STEPS[step].duration) {
          clearInterval(interval);
          const frame = captureFrame();
          if (frame) frames.push(frame);
          step++; doStep();
        }
      }, 100);
    };
    doStep();
  };

  const submitVerification = async (frames: string[]) => {
    setCapturedFrames(frames);
    try {
      const res = await fetch("/api/auth/verify", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ verificationPhoto: frames[0] || "", idDocument: idPhoto || "", idType, frames: frames.length, selfieFrames: frames })
      });
      if (res.ok) { setPhase("success"); reload(); }
      else { const d = await res.json(); setPhase("failed"); setError(d.error || "Verification failed"); }
    } catch { setPhase("failed"); setError("Network error. Please try again."); }
    stopCamera();
  };

  const stopCamera = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; } };
  const retry = () => { setPhase("intro"); setCurrentStep(0); setProgress(0); setError(""); setIdPhoto(null); };
  useEffect(() => { return () => stopCamera(); }, []);

  if (!user) return null;
  if (user.verified || user.verificationStatus === "approved") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
        <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-10 h-10 text-emerald-500"/></div>
        <h2 className={"text-2xl font-bold mb-2 "+(dc?"text-white":"text-gray-900")}>You are Verified!</h2>
        <p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>Your identity has been verified. You have a verified badge on your profile.</p>
        <Link href="/dashboard/profile" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold text-sm">View Profile</Link>
      </div>
    </div>
  );
  if (user.verificationStatus === "pending") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
        <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4"><Shield className="w-10 h-10 text-amber-500"/></div>
        <h2 className={"text-2xl font-bold mb-2 "+(dc?"text-white":"text-gray-900")}>Verification Pending</h2>
        <p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>Our team is reviewing your verification. You will receive a notification once approved.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm">Back to Home</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <canvas ref={canvasRef} className="hidden"/>

      {/* INTRO */}
      {phase === "intro" && (
        <div className="text-center py-4">
          <div className={"rounded-3xl border overflow-hidden "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8">
              <Shield className="w-14 h-14 text-white mx-auto mb-4"/>
              <h1 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h1>
              <p className="text-blue-100 text-sm">Get a verified badge and earn 100 coins</p>
            </div>
            <div className="p-6">
              <h3 className={"font-bold mb-4 text-left "+(dc?"text-white":"text-gray-900")}>What you will need:</h3>
              <div className="space-y-3 mb-6">
                <div className={"flex items-center gap-3 p-3 rounded-xl "+(dc?"bg-gray-700":"bg-gray-50")}>
                  <FileText className={"w-6 h-6 "+(dc?"text-blue-400":"text-blue-500")}/>
                  <div className="text-left"><p className={"text-sm font-medium "+(dc?"text-white":"text-gray-900")}>Valid Government ID</p><p className={"text-xs "+(dc?"text-gray-400":"text-gray-500")}>Passport, National ID, or Driver License</p></div>
                </div>
                <div className={"flex items-center gap-3 p-3 rounded-xl "+(dc?"bg-gray-700":"bg-gray-50")}>
                  <Camera className={"w-6 h-6 "+(dc?"text-blue-400":"text-blue-500")}/>
                  <div className="text-left"><p className={"text-sm font-medium "+(dc?"text-white":"text-gray-900")}>Live Video Selfie</p><p className={"text-xs "+(dc?"text-gray-400":"text-gray-500")}>Short video turning your head in different directions</p></div>
                </div>
              </div>
              <div className={"p-4 rounded-xl mb-6 "+(dc?"bg-blue-500/10 border border-blue-500/20":"bg-blue-50 border border-blue-100")}>
                <p className={"text-xs font-medium "+(dc?"text-blue-300":"text-blue-700")}>Your ID information must match your ConnectHub profile. All documents are securely stored and only viewed by our verification team.</p>
              </div>
              <button onClick={()=>setPhase("id_upload")} className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-lg">Start Verification</button>
            </div>
          </div>
        </div>
      )}

      {/* ID UPLOAD */}
      {phase === "id_upload" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
            <h2 className={"text-xl font-bold mb-2 "+(dc?"text-white":"text-gray-900")}>Step 1: Upload Your ID</h2>
            <p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>Take a clear photo of your government-issued ID</p>

            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

            <div className="mb-4">
              <label className={"text-sm font-medium mb-2 block "+(dc?"text-gray-300":"text-gray-700")}>ID Type</label>
              <select value={idType} onChange={e=>setIdType(e.target.value)} className={"w-full px-4 py-3 rounded-xl border text-sm "+(dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")}>
                <option value="national_id">National ID Card</option>
                <option value="passport">International Passport</option>
                <option value="drivers_license">Driver License</option>
                <option value="voters_card">Voter ID Card</option>
                <option value="residence_permit">Residence Permit</option>
              </select>
            </div>

            <input ref={idInputRef} type="file" accept="image/*" capture="environment" onChange={handleIdUpload} className="hidden"/>

            {idPhoto ? (
              <div className="relative mb-4">
                <img src={idPhoto} className="w-full rounded-xl border object-cover max-h-48"/>
                <button onClick={()=>{setIdPhoto(null);if(idInputRef.current)idInputRef.current.value="";}} className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-lg">×</button>
              </div>
            ) : (
              <button onClick={()=>idInputRef.current?.click()} className={"w-full py-12 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 mb-4 "+(dc?"border-gray-600 text-gray-400 hover:border-blue-500":"border-gray-300 text-gray-400 hover:border-blue-400")}>
                <Upload className="w-10 h-10"/>
                <p className="text-sm font-medium">Tap to upload or take photo</p>
                <p className="text-xs">PNG, JPG up to 10MB</p>
              </button>
            )}

            <div className={"p-3 rounded-xl mb-4 "+(dc?"bg-amber-500/10":"bg-amber-50")}>
              <p className={"text-xs "+(dc?"text-amber-300":"text-amber-700")}>Make sure all text on your ID is clearly visible and not blurry. The name on your ID should match your ConnectHub profile name.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={()=>setPhase("intro")} className={"flex-1 py-3 rounded-xl border font-bold text-sm "+(dc?"border-gray-600 text-gray-300":"border-gray-200 text-gray-600")}>Back</button>
              <button onClick={()=>{if(!idPhoto){setError("Please upload your ID");return;}setPhase("tips");}} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-40">Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* TIPS before selfie */}
      {phase === "tips" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
            <h2 className={"text-xl font-bold mb-2 "+(dc?"text-white":"text-gray-900")}>Step 2: Live Video Selfie</h2>
            <p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>We need a short video of you turning your head in different directions</p>

            <div className={"rounded-2xl p-5 mb-6 "+(dc?"bg-gray-700":"bg-blue-50")}>
              <h3 className={"font-bold mb-3 text-sm "+(dc?"text-white":"text-gray-900")}>Tips for a good selfie:</h3>
              <div className="space-y-3">
                {[
                  {icon:"💡",text:"Use a well-lit area — avoid dark rooms or strong backlighting"},
                  {icon:"📱",text:"Hold your phone at eye level, about arm length away"},
                  {icon:"👓",text:"Remove sunglasses, hats, or anything covering your face"},
                  {icon:"🎯",text:"Follow the on-screen instructions — look straight, turn left, right, and blink"},
                  {icon:"😊",text:"Keep a neutral expression and stay still during each step"},
                ].map((tip,i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-lg">{tip.icon}</span>
                    <p className={"text-xs "+(dc?"text-gray-300":"text-gray-600")}>{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <p className={"text-xs font-medium "+(dc?"text-gray-400":"text-gray-500")}>You will be asked to:</p>
              {STEPS.map(s => (
                <div key={s.id} className={"flex items-center gap-3 p-2.5 rounded-xl "+(dc?"bg-gray-700":"bg-gray-50")}>
                  <span className="text-xl">{s.icon}</span>
                  <span className={"text-sm "+(dc?"text-gray-300":"text-gray-700")}>{s.instruction}</span>
                </div>
              ))}
            </div>

            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

            <div className="flex gap-3">
              <button onClick={()=>setPhase("id_upload")} className={"flex-1 py-3 rounded-xl border font-bold text-sm "+(dc?"border-gray-600 text-gray-300":"border-gray-200 text-gray-600")}>Back</button>
              <button onClick={startCamera} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Camera className="w-4 h-4"/>Start Camera</button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA — Live verification */}
      {phase === "camera" && (
        <div className="text-center py-4">
          <div className="relative mx-auto" style={{width:280,height:280}}>
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-blue-500">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{transform:"scaleX(-1)"}}/>
            </div>
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 280 280">
              <circle cx="140" cy="140" r="136" fill="none" stroke={dc?"#374151":"#e5e7eb"} strokeWidth="4"/>
              <circle cx="140" cy="140" r="136" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeDasharray={2*Math.PI*136} strokeDashoffset={2*Math.PI*136*(1-progress/100)} className="transition-all duration-300"/>
            </svg>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold">Step {currentStep+1} of {STEPS.length}</div>
          </div>
          <div className={"mt-8 p-4 rounded-xl "+(dc?"bg-gray-800":"bg-blue-50")}>
            <span className="text-3xl block mb-2">{STEPS[currentStep]?.icon}</span>
            <p className={"text-lg font-bold "+(dc?"text-white":"text-gray-900")}>{STEPS[currentStep]?.instruction}</p>
            <p className={"text-xs mt-1 "+(dc?"text-gray-400":"text-gray-500")}>Hold still for 3 seconds...</p>
          </div>
          <div className={"w-full h-2 rounded-full mt-4 overflow-hidden "+(dc?"bg-gray-700":"bg-gray-200")}>
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300" style={{width:progress+"%"}}/>
          </div>
        </div>
      )}

      {/* PROCESSING */}
      {phase === "processing" && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-6"/>
          <h2 className={"text-xl font-bold mb-2 "+(dc?"text-white":"text-gray-900")}>Verifying...</h2>
          <p className={"text-sm "+(dc?"text-gray-400":"text-gray-500")}>Analyzing your selfie and documents</p>
        </div>
      )}

      {/* SUCCESS */}
      {phase === "success" && (
        <div className="text-center py-8">
          <div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
            <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6"><CheckCircle className="w-12 h-12 text-emerald-500"/></div>
            <h2 className={"text-2xl font-bold mb-2 "+(dc?"text-white":"text-gray-900")}>Verification Submitted!</h2>
            <p className={"text-sm mb-6 "+(dc?"text-gray-400":"text-gray-500")}>Your ID and selfie have been submitted. Our team will review and verify your identity within 24 hours. You will receive a notification when approved.</p>
            <Link href="/dashboard" className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold text-sm">Back to Dashboard</Link>
          </div>
        </div>
      )}

      {/* FAILED */}
      {phase === "failed" && (
        <div className="text-center py-8">
          <div className={"rounded-3xl border p-8 "+(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
            <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6"><XCircle className="w-12 h-12 text-red-500"/></div>
            <h2 className={"text-2xl font-bold mb-2 "+(dc?"text-white":"text-gray-900")}>Verification Failed</h2>
            <p className={"text-sm mb-2 "+(dc?"text-gray-400":"text-gray-500")}>{error || "We could not verify your identity."}</p>
            <p className={"text-xs mb-6 "+(dc?"text-gray-500":"text-gray-400")}>Tips: Use good lighting, remove glasses, hold phone steady, and make sure your ID is clear.</p>
            <button onClick={retry} className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm"><RotateCcw className="w-4 h-4"/>Try Again</button>
          </div>
        </div>
      )}
    </div>
  );
}
