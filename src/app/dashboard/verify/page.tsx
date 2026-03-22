"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "../layout";
import { Shield, Camera, Check, X, AlertCircle, ChevronRight, Upload, RefreshCw, Smartphone, ScanFace, CreditCard, Sparkles, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

type Step = "intro" | "selfie" | "pose_left" | "pose_right" | "smile" | "id_front" | "reviewing" | "done";

const STEPS_INFO: Record<string, { title: string; instruction: string; icon: string }> = {
  selfie: { title: "Look Straight", instruction: "Position your face in the center of the frame and look directly at the camera", icon: "😐" },
  pose_left: { title: "Turn Left", instruction: "Slowly turn your head to the LEFT while keeping your face visible", icon: "👈" },
  pose_right: { title: "Turn Right", instruction: "Slowly turn your head to the RIGHT while keeping your face visible", icon: "👉" },
  smile: { title: "Smile", instruction: "Give us your best smile! This confirms you are a real person", icon: "😊" },
};

export default function VerifyPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>("intro");
  const [countdown, setCountdown] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [idPhoto, setIdPhoto] = useState<string>("");
  const [flash, setFlash] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("autoplay", "true");
        videoRef.current.muted = true;
        setTimeout(() => { videoRef.current?.play().catch(() => {}); setCameraReady(true); }, 500);
      }
    } catch (e) {
      setError("Camera access denied. Please allow camera access and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  const capturePhoto = () => {
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

  const startCountdownAndCapture = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Capture
          setFlash(true);
          setTimeout(() => setFlash(false), 300);
          const photo = capturePhoto();
          if (photo) {
            setPhotos(prev => [...prev, photo]);
            // Move to next step
            const poseOrder: Step[] = ["selfie", "pose_left", "pose_right", "smile"];
            const currentIdx = poseOrder.indexOf(step as Step);
            if (currentIdx < poseOrder.length - 1) {
              setTimeout(() => setStep(poseOrder[currentIdx + 1]), 800);
            } else {
              setTimeout(() => { stopCamera(); setStep("id_front"); }, 800);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginVerification = async () => {
    setStep("selfie");
    await startCamera();
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Max 10MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setIdPhoto(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const captureIdFromCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      setError("Camera access denied");
    }
  };

  const captureIdPhoto = () => {
    const photo = capturePhoto();
    if (photo) {
      setIdPhoto(photo);
      stopCamera();
    }
  };

  const submitVerification = async () => {
    if (photos.length < 4) { setError("All face photos required"); return; }
    if (!idPhoto) { setError("ID document required"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: JSON.stringify(photos), idDocument: idPhoto })
      });
      const data = await res.json();
      if (res.ok) { setStep("done"); reload(); }
      else { setError(data.error || "Submission failed"); }
    } catch { setError("Network error"); }
    finally { setSubmitting(false); }
  };

  if (!user) return null;

  // Already verified or pending
  if (user.verificationStatus === "approved") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="w-10 h-10 text-emerald-500" /></div>
      <h2 className={"text-2xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Verified!</h2>
      <p className={"mb-6 " + (dc?"text-gray-400":"text-gray-500")}>Your identity has been verified. You have the verified badge.</p>
      <Link href="/dashboard/profile" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold inline-flex items-center gap-2">View Profile</Link>
    </div>
  );

  if (user.verificationStatus === "pending") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><Clock className="w-10 h-10 text-amber-500" /></div>
      <h2 className={"text-2xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Under Review</h2>
      <p className={"mb-6 " + (dc?"text-gray-400":"text-gray-500")}>Your verification is being reviewed by our team. This usually takes less than 24 hours.</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleIdUpload} className="hidden" />

      {/* INTRO */}
      {step === "intro" && (
        <div>
          <div className={"rounded-3xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/30">
                <ScanFace className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Identity Verification</h1>
              <p className="text-blue-100 text-sm">Powered by ConnectHub Verify</p>
            </div>

            <div className="p-8">
              <p className={"text-sm mb-6 " + (dc?"text-gray-300":"text-gray-600")}>Verify your identity to get a verified badge, increase trust, and get 5x more matches. The process takes about 2 minutes.</p>

              <div className="space-y-4 mb-8">
                {[
                  { step:"1", title:"Live Selfie Capture", desc:"We will take 4 photos to verify you are a real person", icon:Camera, color:"text-blue-500", bg:dc?"bg-blue-500/10":"bg-blue-50" },
                  { step:"2", title:"Liveness Detection", desc:"Follow simple instructions: look straight, turn left, turn right, and smile", icon:ScanFace, color:"text-violet-500", bg:dc?"bg-violet-500/10":"bg-violet-50" },
                  { step:"3", title:"ID Document", desc:"Upload or capture a photo of your government-issued ID", icon:CreditCard, color:"text-emerald-500", bg:dc?"bg-emerald-500/10":"bg-emerald-50" },
                  { step:"4", title:"Admin Review", desc:"Our team reviews your submission within 24 hours", icon:Shield, color:"text-amber-500", bg:dc?"bg-amber-500/10":"bg-amber-50" },
                ].map((s, i) => (
                  <div key={i} className={"flex items-center gap-4 p-4 rounded-xl " + s.bg}>
                    <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + (dc?"bg-gray-700":"bg-white shadow-sm")}>
                      <s.icon className={"w-5 h-5 " + s.color} />
                    </div>
                    <div className="flex-1">
                      <p className={"text-sm font-bold " + (dc?"text-white":"text-gray-900")}>{s.title}</p>
                      <p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>{s.desc}</p>
                    </div>
                    <span className={"text-xs font-bold " + (dc?"text-gray-600":"text-gray-300")}>Step {s.step}</span>
                  </div>
                ))}
              </div>

              <div className={"rounded-xl p-4 mb-6 flex items-start gap-3 " + (dc?"bg-amber-500/10 border border-amber-500/20":"bg-amber-50 border border-amber-100")}>
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={"text-sm font-semibold " + (dc?"text-amber-400":"text-amber-700")}>Before you start:</p>
                  <ul className={"text-xs space-y-1 mt-1 " + (dc?"text-amber-300/80":"text-amber-600")}>
                    <li>Make sure you are in a well-lit area</li>
                    <li>Remove hats, sunglasses, or face coverings</li>
                    <li>Have your government ID ready (passport, driver license, or national ID)</li>
                    <li>Allow camera access when prompted</li>
                  </ul>
                </div>
              </div>

              <button onClick={beginVerification} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-base hover:shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-2">
                <ScanFace className="w-5 h-5" /> Begin Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA STEPS */}
      {["selfie", "pose_left", "pose_right", "smile"].includes(step) && (
        <div className={"rounded-3xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
          {/* Header bar */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanFace className="w-5 h-5 text-white" />
              <span className="text-sm font-bold text-white">ConnectHub Verify</span>
            </div>
            <span className="text-xs text-blue-100">Step {["selfie","pose_left","pose_right","smile"].indexOf(step)+1} of 4</span>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1 px-6 pt-4">
            {["selfie","pose_left","pose_right","smile"].map((s,i) => (
              <div key={s} className={"flex-1 h-1.5 rounded-full " + (["selfie","pose_left","pose_right","smile"].indexOf(step) >= i ? "bg-blue-500" : (dc?"bg-gray-700":"bg-gray-200"))} />
            ))}
          </div>

          {/* Instruction */}
          <div className="text-center px-6 pt-4 pb-2">
            <span className="text-4xl mb-2 block">{STEPS_INFO[step]?.icon}</span>
            <h2 className={"text-xl font-bold " + (dc?"text-white":"text-gray-900")}>{STEPS_INFO[step]?.title}</h2>
            <p className={"text-sm mt-1 " + (dc?"text-gray-400":"text-gray-500")}>{STEPS_INFO[step]?.instruction}</p>
          </div>

          {/* Camera view */}
          <div className="relative mx-6 my-4 rounded-2xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" style={{ transform: "scaleX(-1)" }} />

            {/* Face guide oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-52 h-64 border-[3px] border-dashed border-white/40 rounded-[50%]" />
            </div>

            {/* Countdown */}
            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/50">
                  <span className="text-5xl font-bold text-white">{countdown}</span>
                </div>
              </div>
            )}

            {/* Flash effect */}
            {flash && <div className="absolute inset-0 bg-white animate-pulse" />}

            {/* Direction arrows */}
            {step === "pose_left" && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-6xl animate-pulse">←</div>}
            {step === "pose_right" && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-6xl animate-pulse">→</div>}
          </div>

          {/* Capture button */}
          <div className="flex justify-center pb-6 px-6">
            {cameraReady ? (
              <button onClick={startCountdownAndCapture} disabled={countdown > 0} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-60">
                <Camera className="w-5 h-5" /> {countdown > 0 ? "Capturing..." : "Capture Photo"}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-blue-400"><RefreshCw className="w-4 h-4 animate-spin" /> Starting camera...</div>
            )}
          </div>

          {/* Thumbnails */}
          {photos.length > 0 && (
            <div className={"px-6 pb-4 flex gap-2 " + (dc?"border-t border-gray-700 pt-4":"border-t border-gray-100 pt-4")}>
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
                  <p className={"text-[9px] text-center mt-0.5 " + (dc?"text-gray-500":"text-gray-400")}>{["Front","Left","Right","Smile"][i]}</p>
                </div>
              ))}
            </div>
          )}

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

            {/* Completed selfie photos */}
            <div className={"rounded-xl p-4 mb-6 " + (dc?"bg-emerald-500/10":"bg-emerald-50")}>
              <p className="text-sm font-semibold text-emerald-600 flex items-center gap-2 mb-2"><Check className="w-4 h-4" /> Face verification complete!</p>
              <div className="flex gap-2">{photos.map((p,i) => <img key={i} src={p} className="w-12 h-12 rounded-lg object-cover" />)}</div>
            </div>

            {idPhoto ? (
              <div className="mb-6">
                <img src={idPhoto} className="w-full max-h-64 object-contain rounded-xl border border-gray-200" />
                <button onClick={() => setIdPhoto("")} className={"mt-2 text-sm font-medium flex items-center gap-1 " + (dc?"text-red-400":"text-red-500")}><X className="w-4 h-4" /> Remove and retake</button>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                <button onClick={() => fileRef.current?.click()} className={"w-full flex items-center gap-4 p-5 rounded-xl border-2 border-dashed transition-all " + (dc?"border-gray-600 hover:border-blue-500 bg-gray-700/50":"border-gray-200 hover:border-blue-400 bg-gray-50")}>
                  <Upload className={"w-8 h-8 " + (dc?"text-gray-500":"text-gray-400")} />
                  <div className="text-left">
                    <p className={"font-semibold text-sm " + (dc?"text-white":"text-gray-900")}>Upload from Gallery</p>
                    <p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Select a photo of your ID from your device</p>
                  </div>
                </button>
              </div>
            )}

            <div className={"rounded-xl p-4 mb-6 " + (dc?"bg-blue-500/10":"bg-blue-50")}>
              <p className={"text-xs font-semibold " + (dc?"text-blue-400":"text-blue-700")}>Accepted documents:</p>
              <p className={"text-xs mt-1 " + (dc?"text-blue-300/70":"text-blue-600")}>Passport, Driver License, National ID Card, Residence Permit</p>
            </div>

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
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/30">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Submitted!</h2>
            <p className="text-emerald-100">Your identity verification is now under review</p>
          </div>
          <div className="p-8 text-center">
            <div className={"rounded-xl p-4 mb-6 " + (dc?"bg-gray-700":"bg-gray-50")}>
              <p className={"text-sm " + (dc?"text-gray-300":"text-gray-600")}>Our team will review your submission within <span className="font-bold">24 hours</span>. You will receive a notification when the review is complete.</p>
            </div>
            <div className="flex gap-2 justify-center">{photos.slice(0,4).map((p,i) => <img key={i} src={p} className="w-16 h-16 rounded-xl object-cover" />)}</div>
            <Link href="/dashboard/profile" className="mt-6 px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold inline-flex items-center gap-2 hover:shadow-lg">Back to Profile</Link>
          </div>
        </div>
      )}
    </div>
  );
}
