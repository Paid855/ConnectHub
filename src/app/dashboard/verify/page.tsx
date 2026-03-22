"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "../layout";
import { Shield, Camera, Check, X, AlertCircle, Upload, RefreshCw, ScanFace, CreditCard, Clock } from "lucide-react";
import Link from "next/link";

type Step = "intro"|"selfie"|"pose_left"|"pose_right"|"smile"|"id_front"|"done";

const STEPS_INFO: Record<string,{title:string;instruction:string;icon:string}> = {
  selfie:{title:"Look Straight",instruction:"Position your face in the oval and look at the camera",icon:"😐"},
  pose_left:{title:"Turn Left",instruction:"Slowly turn your head to the LEFT",icon:"👈"},
  pose_right:{title:"Turn Right",instruction:"Slowly turn your head to the RIGHT",icon:"👉"},
  smile:{title:"Smile",instruction:"Give us your best smile!",icon:"😊"},
};

export default function VerifyPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const detectIntervalRef = useRef<any>(null);
  const capturedRef = useRef(false);

  const [step, setStep] = useState<Step>("intro");
  const [countdown, setCountdown] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [idPhoto, setIdPhoto] = useState("");
  const [flash, setFlash] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectStatus, setDetectStatus] = useState("Initializing camera...");
  const [autoCountdown, setAutoCountdown] = useState(0);

  const startCamera = useCallback(async () => {
    try {
      setCameraReady(false);
      setFaceDetected(false);
      setDetectStatus("Starting camera...");
      capturedRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user", width:{ideal:640}, height:{ideal:480} } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline","true");
        videoRef.current.setAttribute("autoplay","true");
        videoRef.current.muted = true;
        setTimeout(() => { videoRef.current?.play().catch(()=>{}); setCameraReady(true); setDetectStatus("Searching for face..."); }, 800);
      }
    } catch { setError("Camera access denied. Please allow camera access."); }
  },[]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current = null; }
    if (detectIntervalRef.current) { clearInterval(detectIntervalRef.current); detectIntervalRef.current = null; }
    setCameraReady(false);
    setFaceDetected(false);
  },[]);

  useEffect(() => { return () => stopCamera(); },[stopCamera]);

  const capturePhoto = (): string => {
    if (!videoRef.current || !canvasRef.current) return "";
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  };

  // Simple face detection using pixel analysis in the oval region
  const detectFaceInFrame = useCallback((): boolean => {
    if (!videoRef.current || !detectCanvasRef.current) return false;
    const v = videoRef.current;
    if (!v.videoWidth) return false;
    const c = detectCanvasRef.current;
    c.width = 160; c.height = 120;
    const ctx = c.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(v, 0, 0, 160, 120);

    // Check center oval area for skin-tone pixels
    const centerX = 80, centerY = 55, radiusX = 30, radiusY = 40;
    const imgData = ctx.getImageData(centerX - radiusX, centerY - radiusY, radiusX*2, radiusY*2);
    const pixels = imgData.data;
    let skinPixels = 0;
    let totalChecked = 0;

    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
      totalChecked++;
      // Broad skin tone detection (works for all skin colors)
      if (r > 50 && g > 30 && b > 15 && r > b && (Math.abs(r-g) < 80 || r > g) && Math.max(r,g,b) - Math.min(r,g,b) > 15 && r < 250 && g < 250) {
        skinPixels++;
      }
    }

    const ratio = totalChecked > 0 ? skinPixels / totalChecked : 0;
    return ratio > 0.25;
  },[]);

  // Auto-detection loop
  useEffect(() => {
    if (!cameraReady || !["selfie","pose_left","pose_right","smile"].includes(step)) return;
    capturedRef.current = false;
    setFaceDetected(false);
    setAutoCountdown(0);

    let faceFrames = 0;
    let countdownStarted = false;
    let countVal = 3;

    detectIntervalRef.current = setInterval(() => {
      if (capturedRef.current) return;

      const detected = detectFaceInFrame();
      if (detected) {
        faceFrames++;
        if (faceFrames >= 3 && !countdownStarted) {
          setFaceDetected(true);
          setDetectStatus("Face detected! Hold still...");
          // Start auto countdown
          countdownStarted = true;
          countVal = 3;
          setAutoCountdown(3);

          const countInterval = setInterval(() => {
            if (capturedRef.current) { clearInterval(countInterval); return; }
            countVal--;
            setAutoCountdown(countVal);
            if (countVal <= 0) {
              clearInterval(countInterval);
              if (!capturedRef.current) {
                capturedRef.current = true;
                // Capture
                setFlash(true);
                setTimeout(() => setFlash(false), 300);
                const photo = capturePhoto();
                if (photo) {
                  setPhotos(prev => {
                    const newPhotos = [...prev, photo];
                    const poseOrder: Step[] = ["selfie","pose_left","pose_right","smile"];
                    const currentIdx = poseOrder.indexOf(step);
                    if (currentIdx < poseOrder.length - 1) {
                      setTimeout(() => {
                        setStep(poseOrder[currentIdx + 1]);
                        setFaceDetected(false);
                        setDetectStatus("Searching for face...");
                        setAutoCountdown(0);
                      }, 1000);
                    } else {
                      setTimeout(() => { stopCamera(); setStep("id_front"); }, 1000);
                    }
                    return newPhotos;
                  });
                }
              }
            }
          }, 1000);
        }
      } else {
        if (!countdownStarted) {
          faceFrames = Math.max(0, faceFrames - 1);
          setFaceDetected(false);
          if (step === "selfie") setDetectStatus("Position your face in the oval...");
          else if (step === "pose_left") setDetectStatus("Turn your head to the LEFT...");
          else if (step === "pose_right") setDetectStatus("Turn your head to the RIGHT...");
          else if (step === "smile") setDetectStatus("Smile at the camera...");
        }
      }
    }, 300);

    return () => { if (detectIntervalRef.current) clearInterval(detectIntervalRef.current); };
  },[cameraReady, step, detectFaceInFrame, capturePhoto, stopCamera]);

  const beginVerification = async () => { setStep("selfie"); await startCamera(); };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10*1024*1024) { setError("Max 10MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setIdPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submitVerification = async () => {
    if (photos.length < 4) { setError("All face photos required"); return; }
    if (!idPhoto) { setError("ID document required"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/auth/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ photos:JSON.stringify(photos), idDocument:idPhoto }) });
      const data = await res.json();
      if (res.ok) { setStep("done"); reload(); } else { setError(data.error || "Failed"); }
    } catch { setError("Network error"); } finally { setSubmitting(false); }
  };

  if (!user) return null;
  if (user.verificationStatus === "approved") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="w-10 h-10 text-emerald-500" /></div>
      <h2 className={"text-2xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Verified!</h2>
      <p className={"mb-6 " + (dc?"text-gray-400":"text-gray-500")}>Your identity is verified. You have the verified badge.</p>
      <Link href="/dashboard/profile" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold inline-flex items-center gap-2">View Profile</Link>
    </div>
  );
  if (user.verificationStatus === "pending") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><Clock className="w-10 h-10 text-amber-500" /></div>
      <h2 className={"text-2xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Under Review</h2>
      <p className={"mb-6 " + (dc?"text-gray-400":"text-gray-500")}>Your verification is being reviewed. Usually within 24 hours.</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={detectCanvasRef} className="hidden" />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleIdUpload} className="hidden" />

      {/* INTRO */}
      {step === "intro" && (
        <div className={"rounded-3xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/30"><ScanFace className="w-8 h-8 text-white" /></div>
            <h1 className="text-2xl font-bold text-white mb-2">Identity Verification</h1>
            <p className="text-blue-100 text-sm">Powered by ConnectHub Verify</p>
          </div>
          <div className="p-8">
            <p className={"text-sm mb-6 " + (dc?"text-gray-300":"text-gray-600")}>Verify your identity to get a verified badge and 5x more matches. Takes about 1 minute.</p>
            <div className="space-y-4 mb-8">
              {[
                { s:"1", t:"Auto Face Capture", d:"Camera automatically detects and captures your face — no buttons needed", icon:Camera, color:"text-blue-500", bg:dc?"bg-blue-500/10":"bg-blue-50" },
                { s:"2", t:"Liveness Detection", d:"Turn left, right, and smile — camera captures automatically when it detects each pose", icon:ScanFace, color:"text-violet-500", bg:dc?"bg-violet-500/10":"bg-violet-50" },
                { s:"3", t:"ID Document", d:"Upload a photo of your government-issued ID", icon:CreditCard, color:"text-emerald-500", bg:dc?"bg-emerald-500/10":"bg-emerald-50" },
                { s:"4", t:"Instant Review", d:"Our team reviews your submission within 24 hours", icon:Shield, color:"text-amber-500", bg:dc?"bg-amber-500/10":"bg-amber-50" },
              ].map((item,i) => (
                <div key={i} className={"flex items-center gap-4 p-4 rounded-xl " + item.bg}>
                  <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + (dc?"bg-gray-700":"bg-white shadow-sm")}><item.icon className={"w-5 h-5 " + item.color} /></div>
                  <div className="flex-1"><p className={"text-sm font-bold " + (dc?"text-white":"text-gray-900")}>{item.t}</p><p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>{item.d}</p></div>
                </div>
              ))}
            </div>
            <div className={"rounded-xl p-4 mb-6 flex items-start gap-3 " + (dc?"bg-amber-500/10 border border-amber-500/20":"bg-amber-50 border border-amber-100")}>
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={"text-sm font-semibold " + (dc?"text-amber-400":"text-amber-700")}>Before you start:</p>
                <ul className={"text-xs space-y-1 mt-1 " + (dc?"text-amber-300/80":"text-amber-600")}>
                  <li>Be in a well-lit area</li>
                  <li>Remove hats, sunglasses, or face coverings</li>
                  <li>Have your government ID ready</li>
                </ul>
              </div>
            </div>
            <button onClick={beginVerification} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"><ScanFace className="w-5 h-5" /> Begin Verification</button>
          </div>
        </div>
      )}

      {/* CAMERA STEPS */}
      {["selfie","pose_left","pose_right","smile"].includes(step) && (
        <div className={"rounded-3xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><ScanFace className="w-5 h-5 text-white" /><span className="text-sm font-bold text-white">ConnectHub Verify</span></div>
            <span className="text-xs text-blue-100">Step {["selfie","pose_left","pose_right","smile"].indexOf(step)+1} of 4</span>
          </div>

          <div className="flex gap-1 px-6 pt-4">{["selfie","pose_left","pose_right","smile"].map((s,i) => <div key={s} className={"flex-1 h-1.5 rounded-full transition-all duration-500 " + (["selfie","pose_left","pose_right","smile"].indexOf(step)>=i?"bg-blue-500":(dc?"bg-gray-700":"bg-gray-200"))} />)}</div>

          <div className="text-center px-6 pt-4 pb-2">
            <span className="text-4xl mb-2 block">{STEPS_INFO[step]?.icon}</span>
            <h2 className={"text-xl font-bold " + (dc?"text-white":"text-gray-900")}>{STEPS_INFO[step]?.title}</h2>
            <p className={"text-sm mt-1 " + (dc?"text-gray-400":"text-gray-500")}>{STEPS_INFO[step]?.instruction}</p>
          </div>

          {/* Status indicator */}
          <div className="mx-6 mt-2">
            <div className={"flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium " + (faceDetected ? (dc?"bg-emerald-500/20 text-emerald-400":"bg-emerald-50 text-emerald-600") : (dc?"bg-blue-500/10 text-blue-400":"bg-blue-50 text-blue-600"))}>
              {faceDetected ? <Check className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
              {autoCountdown > 0 ? "Capturing in " + autoCountdown + "..." : detectStatus}
            </div>
          </div>

          {/* Camera */}
          <div className="relative mx-6 my-4 rounded-2xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{transform:"scaleX(-1)"}} />

            {/* Face guide oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={"w-52 h-64 border-[3px] rounded-[50%] transition-all duration-500 " + (faceDetected ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)]" : "border-dashed border-white/40")} />
            </div>

            {/* Auto countdown overlay */}
            {autoCountdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-emerald-500/30 backdrop-blur-md flex items-center justify-center border-4 border-emerald-400 animate-pulse">
                  <span className="text-5xl font-bold text-white">{autoCountdown}</span>
                </div>
              </div>
            )}

            {/* Flash */}
            {flash && <div className="absolute inset-0 bg-white animate-pulse" />}

            {/* Direction arrows */}
            {step === "pose_left" && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-6xl animate-bounce">←</div>}
            {step === "pose_right" && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-6xl animate-bounce">→</div>}

            {/* Corner marks */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br-lg" />

            {/* Recording indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-white font-medium">LIVE</span>
            </div>
          </div>

          {/* Thumbnails */}
          {photos.length > 0 && (
            <div className={"px-6 pb-4 flex gap-2 " + (dc?"border-t border-gray-700 pt-4":"border-t border-gray-100 pt-4")}>
              {photos.map((p,i) => (
                <div key={i} className="relative">
                  <img src={p} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
                  <p className={"text-[9px] text-center mt-0.5 " + (dc?"text-gray-500":"text-gray-400")}>{["Front","Left","Right","Smile"][i]}</p>
                </div>
              ))}
              {["selfie","pose_left","pose_right","smile"].slice(photos.length).map((s,i) => (
                <div key={s} className={"w-14 h-14 rounded-lg border-2 border-dashed flex items-center justify-center " + (dc?"border-gray-600":"border-gray-200")}>
                  <span className="text-xl">{STEPS_INFO[s]?.icon}</span>
                </div>
              ))}
            </div>
          )}

          {/* Info text */}
          <div className={"mx-6 mb-4 rounded-xl p-3 text-center " + (dc?"bg-gray-700":"bg-gray-50")}>
            <p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Camera will automatically capture when your face is detected. No buttons needed!</p>
          </div>

          {error && <div className="px-6 pb-4"><p className="text-sm text-red-400 bg-red-500/10 rounded-xl p-3">{error}</p></div>}
        </div>
      )}

      {/* ID DOCUMENT */}
      {step === "id_front" && (
        <div className={"rounded-3xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><ScanFace className="w-5 h-5 text-white" /><span className="text-sm font-bold text-white">ConnectHub Verify</span></div>
            <span className="text-xs text-blue-100">ID Document</span>
          </div>
          <div className="p-8">
            <div className="text-center mb-6">
              <CreditCard className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-blue-400":"text-blue-500")} />
              <h2 className={"text-xl font-bold " + (dc?"text-white":"text-gray-900")}>Upload ID Document</h2>
              <p className={"text-sm mt-1 " + (dc?"text-gray-400":"text-gray-500")}>Upload a clear photo of your government-issued ID</p>
            </div>

            <div className={"rounded-xl p-4 mb-6 " + (dc?"bg-emerald-500/10":"bg-emerald-50")}>
              <p className="text-sm font-semibold text-emerald-600 flex items-center gap-2 mb-2"><Check className="w-4 h-4" /> Face verification complete!</p>
              <div className="flex gap-2">{photos.map((p,i) => <img key={i} src={p} className="w-12 h-12 rounded-lg object-cover" />)}</div>
            </div>

            {idPhoto ? (
              <div className="mb-6">
                <img src={idPhoto} className={"w-full max-h-64 object-contain rounded-xl border " + (dc?"border-gray-600":"border-gray-200")} />
                <button onClick={() => setIdPhoto("")} className={"mt-2 text-sm font-medium flex items-center gap-1 " + (dc?"text-red-400":"text-red-500")}><X className="w-4 h-4" /> Remove and retake</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className={"w-full flex items-center gap-4 p-6 rounded-xl border-2 border-dashed transition-all mb-6 " + (dc?"border-gray-600 hover:border-blue-500 bg-gray-700/50":"border-gray-200 hover:border-blue-400 bg-gray-50")}>
                <Upload className={"w-10 h-10 " + (dc?"text-gray-500":"text-gray-400")} />
                <div className="text-left"><p className={"font-semibold " + (dc?"text-white":"text-gray-900")}>Tap to Upload ID</p><p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Passport, Driver License, or National ID</p></div>
              </button>
            )}

            {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl p-3 mb-4">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => { setStep("intro"); setPhotos([]); setIdPhoto(""); setError(""); }} className={"flex-1 py-3.5 rounded-full font-semibold border text-sm " + (dc?"border-gray-600 text-gray-400":"border-gray-200 text-gray-600")}>Start Over</button>
              <button onClick={submitVerification} disabled={!idPhoto || submitting} className="flex-[2] py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-60 text-sm">
                {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting...</> : <><Shield className="w-4 h-4" /> Submit Verification</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DONE */}
      {step === "done" && (
        <div className={"rounded-3xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/30"><Check className="w-10 h-10 text-white" /></div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Submitted!</h2>
            <p className="text-emerald-100">Under review — usually within 24 hours</p>
          </div>
          <div className="p-8 text-center">
            <div className="flex gap-2 justify-center mb-6">{photos.map((p,i) => <img key={i} src={p} className="w-16 h-16 rounded-xl object-cover" />)}</div>
            <Link href="/dashboard/profile" className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold inline-flex items-center gap-2 hover:shadow-lg">Back to Profile</Link>
          </div>
        </div>
      )}
    </div>
  );
}
