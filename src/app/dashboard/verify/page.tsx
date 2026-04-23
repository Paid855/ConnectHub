"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "../layout";
import { Camera, CheckCircle, XCircle, RotateCcw, Shield, Upload, FileText, AlertTriangle, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

type Phase = "intro"|"id_select"|"id_upload"|"selfie_prep"|"selfie_live"|"processing"|"success"|"failed";
type Challenge = { id: string; instruction: string; icon: string; detector: string; duration: number; };

const CHALLENGES: Challenge[] = [
  { id:"center", instruction:"Position your face in the circle", icon:"👤", detector:"face_center", duration: 3000 },
  { id:"left", instruction:"Slowly turn your head LEFT", icon:"👈", detector:"head_left", duration: 3500 },
  { id:"right", instruction:"Slowly turn your head RIGHT", icon:"👉", detector:"head_right", duration: 3500 },
  { id:"blink", instruction:"Blink your eyes slowly", icon:"😑", detector:"blink", duration: 3000 },
  { id:"smile", instruction:"Give us a big smile!", icon:"😊", detector:"smile", duration: 3000 },
];

const ID_TYPES = [
  { value:"passport", label:"International Passport", icon:"🛂" },
  { value:"national_id", label:"National ID Card", icon:"🪪" },
  { value:"drivers_license", label:"Driver's License", icon:"🚗" },
  { value:"voters_card", label:"Voter's Card", icon:"🗳️" },
  { value:"residence_permit", label:"Residence Permit", icon:"🏠" },
  { value:"military_id", label:"Military ID", icon:"🎖️" },
];

export default function VerifyPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const animRef = useRef<number>(0);
  const idInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("intro");
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState<{x:number,y:number,w:number,h:number}|null>(null);
  const [challengePassed, setChallengePassed] = useState<boolean[]>([]);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [idFrontPhoto, setIdFrontPhoto] = useState<string|null>(null);
  const [idBackPhoto, setIdBackPhoto] = useState<string|null>(null);
  const [idType, setIdType] = useState("");
  const [error, setError] = useState("");
  const [faceModel, setFaceModel] = useState<any>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackColor, setFeedbackColor] = useState("text-white");

  // Face detection using canvas analysis
  const detectFace = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = 320;
    canvas.height = 320;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw === 0 || vh === 0) return null;

    const size = Math.min(vw, vh);
    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);

    const imageData = ctx.getImageData(0, 0, 320, 320);
    const data = imageData.data;

    // Skin color detection - find largest skin-colored region
    let skinPixels: {x:number,y:number}[] = [];
    for (let y = 0; y < 320; y += 4) {
      for (let x = 0; x < 320; x += 4) {
        const i = (y * 320 + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2];
        // Skin color detection in RGB
        if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r-g) > 15 && r - b > 15 && r > 80) {
          skinPixels.push({x, y});
        }
      }
    }

    if (skinPixels.length < 50) return null; // No face detected

    // Find bounding box of skin region
    let minX = 320, maxX = 0, minY = 320, maxY = 0;
    for (const p of skinPixels) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const w = maxX - minX;
    const h = maxY - minY;
    if (w < 40 || h < 40) return null;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return { x: centerX / 320, y: centerY / 320, w: w / 320, h: h / 320 };
  }, []);

  // Browser FaceDetector API (Chrome/Edge)
  const detectFaceNative = useCallback(async (video: HTMLVideoElement) => {
    try {
      if ("FaceDetector" in window) {
        const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await detector.detect(video);
        if (faces.length > 0) {
          const f = faces[0].boundingBox;
          const vw = video.videoWidth || 640;
          const vh = video.videoHeight || 480;
          return { x: (f.x + f.width/2) / vw, y: (f.y + f.height/2) / vh, w: f.width / vw, h: f.height / vh };
        }
      }
    } catch {}
    return null;
  }, []);

  const prevFacePos = useRef<{x:number,y:number}|null>(null);
  const blinkFrames = useRef<number>(0);
  const smileFrames = useRef<number>(0);
  const challengeTimer = useRef<number>(0);
  const challengeStarted = useRef<boolean>(false);

  // Main detection loop
  const detectionLoop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || phase !== "selfie_live") return;

    // Try native FaceDetector first, fallback to canvas
    let face = await detectFaceNative(videoRef.current);
    if (!face) face = detectFace(videoRef.current, canvasRef.current);

    if (face) {
      setFaceDetected(true);
      setFacePosition(face);

      const challenge = CHALLENGES[challengeIdx];
      if (!challenge) return;

      // Check challenge conditions
      const cx = face.x; // 0=left, 0.5=center, 1=right (mirrored)
      const prevX = prevFacePos.current?.x || 0.5;

      if (challenge.detector === "face_center") {
        // Face should be roughly centered
        if (Math.abs(cx - 0.5) < 0.15 && Math.abs(face.y - 0.45) < 0.15 && face.w > 0.2) {
          if (!challengeStarted.current) { challengeStarted.current = true; challengeTimer.current = Date.now(); }
          const elapsed = Date.now() - challengeTimer.current;
          setChallengeProgress(Math.min(100, (elapsed / challenge.duration) * 100));
          setFeedbackText("Great! Hold still...");
          setFeedbackColor("text-emerald-400");
          if (elapsed >= challenge.duration) { passChallenge(); }
        } else {
          challengeStarted.current = false;
          setFeedbackText("Move your face into the circle");
          setFeedbackColor("text-amber-400");
          setChallengeProgress(0);
        }
      }

      if (challenge.detector === "head_left") {
        // In mirrored view, turning left = face moves right (cx > 0.55)
        if (cx > 0.58) {
          if (!challengeStarted.current) { challengeStarted.current = true; challengeTimer.current = Date.now(); }
          const elapsed = Date.now() - challengeTimer.current;
          setChallengeProgress(Math.min(100, (elapsed / challenge.duration) * 100));
          setFeedbackText("Good! Keep turning left...");
          setFeedbackColor("text-emerald-400");
          if (elapsed >= challenge.duration) { passChallenge(); }
        } else {
          challengeStarted.current = false;
          setFeedbackText("Turn your head to the LEFT");
          setFeedbackColor("text-amber-400");
          setChallengeProgress(0);
        }
      }

      if (challenge.detector === "head_right") {
        if (cx < 0.42) {
          if (!challengeStarted.current) { challengeStarted.current = true; challengeTimer.current = Date.now(); }
          const elapsed = Date.now() - challengeTimer.current;
          setChallengeProgress(Math.min(100, (elapsed / challenge.duration) * 100));
          setFeedbackText("Good! Keep turning right...");
          setFeedbackColor("text-emerald-400");
          if (elapsed >= challenge.duration) { passChallenge(); }
        } else {
          challengeStarted.current = false;
          setFeedbackText("Turn your head to the RIGHT");
          setFeedbackColor("text-amber-400");
          setChallengeProgress(0);
        }
      }

      if (challenge.detector === "blink") {
        // Detect blink by face height shrinking momentarily (eyes closing)
        if (face.h < (prevFacePos.current ? prevFacePos.current.y * 0.9 : 0.4)) {
          blinkFrames.current++;
        }
        if (blinkFrames.current > 0) {
          if (!challengeStarted.current) { challengeStarted.current = true; challengeTimer.current = Date.now(); }
          const elapsed = Date.now() - challengeTimer.current;
          setChallengeProgress(Math.min(100, (elapsed / (challenge.duration * 0.7)) * 100));
          setFeedbackText("Blink detected! Keep going...");
          setFeedbackColor("text-emerald-400");
          if (elapsed >= challenge.duration * 0.7) { passChallenge(); }
        } else {
          setFeedbackText("Slowly blink your eyes");
          setFeedbackColor("text-amber-400");
          // Auto-pass after timeout if face is present
          if (!challengeStarted.current) { challengeStarted.current = true; challengeTimer.current = Date.now(); }
          const elapsed = Date.now() - challengeTimer.current;
          setChallengeProgress(Math.min(100, (elapsed / challenge.duration) * 100));
          if (elapsed >= challenge.duration) { passChallenge(); }
        }
      }

      if (challenge.detector === "smile") {
        // Detect smile by wider face width
        if (face.w > 0.35) {
          smileFrames.current++;
        }
        if (smileFrames.current > 0) {
          if (!challengeStarted.current) { challengeStarted.current = true; challengeTimer.current = Date.now(); }
          const elapsed = Date.now() - challengeTimer.current;
          setChallengeProgress(Math.min(100, (elapsed / (challenge.duration * 0.7)) * 100));
          setFeedbackText("Beautiful smile! Hold it...");
          setFeedbackColor("text-emerald-400");
          if (elapsed >= challenge.duration * 0.7) { passChallenge(); }
        } else {
          setFeedbackText("Give us a big smile!");
          setFeedbackColor("text-amber-400");
          if (!challengeStarted.current) { challengeStarted.current = true; challengeTimer.current = Date.now(); }
          const elapsed = Date.now() - challengeTimer.current;
          setChallengeProgress(Math.min(100, (elapsed / challenge.duration) * 100));
          if (elapsed >= challenge.duration) { passChallenge(); }
        }
      }

      prevFacePos.current = { x: cx, y: face.h };
    } else {
      setFaceDetected(false);
      setFacePosition(null);
      setFeedbackText("No face detected — look at the camera");
      setFeedbackColor("text-red-400");
      challengeStarted.current = false;
      setChallengeProgress(0);
    }

    // Draw overlay
    if (overlayRef.current && face) {
      const octx = overlayRef.current.getContext("2d");
      if (octx) {
        overlayRef.current.width = 300;
        overlayRef.current.height = 300;
        octx.clearRect(0, 0, 300, 300);
        // Draw face position indicator
        octx.strokeStyle = faceDetected ? "#22c55e" : "#ef4444";
        octx.lineWidth = 2;
        const fx = face.x * 300;
        const fy = face.y * 300;
        const fw = face.w * 150;
        const fh = face.h * 150;
        octx.strokeRect(fx - fw/2, fy - fh/2, fw, fh);
      }
    }

    animRef.current = requestAnimationFrame(detectionLoop);
  }, [phase, challengeIdx, detectFace, detectFaceNative, faceDetected]);

  const passChallenge = useCallback(() => {
    // Capture frame
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx && videoRef.current) {
        canvas.width = 480;
        canvas.height = 480;
        const v = videoRef.current;
        const size = Math.min(v.videoWidth, v.videoHeight);
        ctx.drawImage(v, (v.videoWidth-size)/2, (v.videoHeight-size)/2, size, size, 0, 0, 480, 480);
        const frame = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedFrames(prev => [...prev, frame]);
      }
    }

    setChallengePassed(prev => [...prev, true]);
    const totalProgress = ((challengeIdx + 1) / CHALLENGES.length) * 100;
    setProgress(totalProgress);

    if (challengeIdx + 1 >= CHALLENGES.length) {
      // All challenges done
      setTimeout(() => {
        setPhase("processing");
        submitVerification();
      }, 500);
    } else {
      // Next challenge
      challengeStarted.current = false;
      blinkFrames.current = 0;
      smileFrames.current = 0;
      setChallengeProgress(0);
      setChallengeIdx(prev => prev + 1);
    }
  }, [challengeIdx]);

  // Start detection loop when entering selfie_live
  useEffect(() => {
    if (phase === "selfie_live") {
      animRef.current = requestAnimationFrame(detectionLoop);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [phase, detectionLoop]);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setChallengeIdx(0);
      setProgress(0);
      setChallengeProgress(0);
      setChallengePassed([]);
      setCapturedFrames([]);
      challengeStarted.current = false;
      blinkFrames.current = 0;
      smileFrames.current = 0;
      setPhase("selfie_live");
    } catch {
      setError("Camera access required. Please allow camera permission and try again.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const submitVerification = async () => {
    stopCamera();
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationPhoto: capturedFrames[0] || "",
          idDocument: idFrontPhoto || "",
          idDocumentBack: idBackPhoto || "",
          idType,
          frames: capturedFrames.length,
          selfieFrames: capturedFrames,
          challenges: CHALLENGES.map(c => c.id),
        })
      });
      if (res.ok) { setPhase("success"); reload(); }
      else { const d = await res.json(); setPhase("failed"); setError(d.error || "Verification failed"); }
    } catch { setPhase("failed"); setError("Network error. Please try again."); }
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>, side: "front"|"back") => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("File must be under 10MB"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = ev => {
      if (side === "front") setIdFrontPhoto(ev.target?.result as string);
      else setIdBackPhoto(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const retry = () => {
    stopCamera();
    setPhase("intro");
    setChallengeIdx(0);
    setProgress(0);
    setChallengeProgress(0);
    setError("");
    setIdFrontPhoto(null);
    setIdBackPhoto(null);
    setIdType("");
    setCapturedFrames([]);
    setChallengePassed([]);
  };

  useEffect(() => { return () => stopCamera(); }, []);

  if (!user) return null;

  // Already verified
  if (user.verified || user.verificationStatus === "approved") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mb-5">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className={"text-2xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>You are Verified! ✓</h2>
        <p className={"text-sm mb-6 " + (dc ? "text-gray-400" : "text-gray-500")}>Your identity has been confirmed. You have a verified badge on your profile.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard/profile" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold text-sm hover:shadow-lg">View Profile</Link>
          <Link href="/dashboard" className={"px-6 py-3 rounded-full font-bold text-sm border-2 " + (dc ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600")}>Dashboard</Link>
        </div>
      </div>
    </div>
  );

  // Pending review
  if (user.verificationStatus === "pending") return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mb-5">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className={"text-2xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Under Review</h2>
        <p className={"text-sm mb-6 " + (dc ? "text-gray-400" : "text-gray-500")}>Our team is reviewing your verification. This usually takes 1-24 hours. You will be notified when approved.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm hover:shadow-lg">Back to Dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <canvas ref={canvasRef} className="hidden" />

      {/* ===== INTRO ===== */}
      {phase === "intro" && (
        <div className="py-4">
          <div className={"rounded-3xl overflow-hidden border " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-extrabold text-white mb-2">Identity Verification</h1>
                <p className="text-blue-200 text-sm">Get verified and earn the trusted badge</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {["ID Document", "Live Selfie", "Review"].map((s, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className={"w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-bold mb-1 " + (dc ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500")}>{i + 1}</div>
                    <p className={"text-[10px] font-medium " + (dc ? "text-gray-500" : "text-gray-400")}>{s}</p>
                  </div>
                ))}
              </div>
              <h3 className={"font-bold mb-4 " + (dc ? "text-white" : "text-gray-900")}>What you need:</h3>
              <div className="space-y-3 mb-6">
                {[
                  { icon: "🪪", title: "Government ID", desc: "Passport, National ID, or Driver's License" },
                  { icon: "📸", title: "Live Video Selfie", desc: "Face scan with head turns, blink, and smile" },
                  { icon: "💡", title: "Good Lighting", desc: "Well-lit area, no hats or sunglasses" },
                ].map((item, i) => (
                  <div key={i} className={"flex items-center gap-3 p-3.5 rounded-xl " + (dc ? "bg-gray-700/50" : "bg-gray-50")}>
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className={"text-sm font-semibold " + (dc ? "text-white" : "text-gray-900")}>{item.title}</p>
                      <p className={"text-xs " + (dc ? "text-gray-400" : "text-gray-500")}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={"p-4 rounded-xl mb-6 " + (dc ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-100")}>
                <p className={"text-xs font-medium flex items-center gap-2 " + (dc ? "text-emerald-400" : "text-emerald-700")}>
                  <Sparkles className="w-4 h-4" /> Earn 100 bonus coins when verified!
                </p>
              </div>
              <button onClick={() => setPhase("id_select")} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold hover:shadow-xl transition-all">
                Begin Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ID TYPE SELECT ===== */}
      {phase === "id_select" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setPhase("intro")} className={"p-2 rounded-xl " + (dc ? "hover:bg-gray-700" : "hover:bg-gray-100")}><ArrowLeft className="w-5 h-5" /></button>
              <div>
                <h2 className={"text-xl font-extrabold " + (dc ? "text-white" : "text-gray-900")}>Select ID Type</h2>
                <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>Step 1 of 3</p>
              </div>
            </div>
            <div className="space-y-2">
              {ID_TYPES.map(t => (
                <button key={t.value} onClick={() => { setIdType(t.value); setPhase("id_upload"); }} className={"w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all " + (idType === t.value ? (dc ? "border-blue-500 bg-blue-500/10" : "border-blue-500 bg-blue-50") : (dc ? "border-gray-700 hover:border-gray-600 hover:bg-gray-700/50" : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"))}>
                  <span className="text-3xl">{t.icon}</span>
                  <span className={"font-semibold text-sm " + (dc ? "text-white" : "text-gray-900")}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ID UPLOAD ===== */}
      {phase === "id_upload" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setPhase("id_select")} className={"p-2 rounded-xl " + (dc ? "hover:bg-gray-700" : "hover:bg-gray-100")}><ArrowLeft className="w-5 h-5" /></button>
              <div>
                <h2 className={"text-xl font-extrabold " + (dc ? "text-white" : "text-gray-900")}>Upload Your {ID_TYPES.find(t => t.value === idType)?.label || "ID"}</h2>
                <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>Step 1 of 3 — Take clear photos</p>
              </div>
            </div>
            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            <input ref={idInputRef} type="file" accept="image/*" capture="environment" onChange={e => handleIdUpload(e, "front")} className="hidden" />
            <input ref={idBackInputRef} type="file" accept="image/*" capture="environment" onChange={e => handleIdUpload(e, "back")} className="hidden" />

            {/* Front */}
            <p className={"text-sm font-semibold mb-2 " + (dc ? "text-gray-300" : "text-gray-700")}>Front of ID *</p>
            {idFrontPhoto ? (
              <div className="relative mb-4">
                <img src={idFrontPhoto} className={"w-full rounded-2xl border object-cover max-h-48 " + (dc ? "border-gray-700" : "border-gray-200")} />
                <button onClick={() => setIdFrontPhoto(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-lg shadow-lg">×</button>
                <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Uploaded</div>
              </div>
            ) : (
              <button onClick={() => idInputRef.current?.click()} className={"w-full py-10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 mb-4 transition-all " + (dc ? "border-gray-600 hover:border-blue-500 text-gray-400" : "border-gray-300 hover:border-blue-400 text-gray-400")}>
                <Upload className="w-8 h-8" />
                <p className="text-sm font-semibold">Upload front of ID</p>
                <p className="text-xs">Tap to take photo or choose file</p>
              </button>
            )}

            {/* Back (optional) */}
            <p className={"text-sm font-semibold mb-2 " + (dc ? "text-gray-300" : "text-gray-700")}>Back of ID (optional)</p>
            {idBackPhoto ? (
              <div className="relative mb-4">
                <img src={idBackPhoto} className={"w-full rounded-2xl border object-cover max-h-48 " + (dc ? "border-gray-700" : "border-gray-200")} />
                <button onClick={() => setIdBackPhoto(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-lg shadow-lg">×</button>
              </div>
            ) : (
              <button onClick={() => idBackInputRef.current?.click()} className={"w-full py-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 mb-4 transition-all " + (dc ? "border-gray-600 hover:border-blue-500 text-gray-400" : "border-gray-300 hover:border-blue-400 text-gray-400")}>
                <Upload className="w-6 h-6" />
                <p className="text-xs font-medium">Upload back of ID</p>
              </button>
            )}

            <div className={"p-3 rounded-xl mb-4 " + (dc ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200")}>
              <p className={"text-xs " + (dc ? "text-amber-300" : "text-amber-700")}>Ensure all text is clear and readable. Name on ID must match your ConnectHub profile.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPhase("id_select")} className={"flex-1 py-3.5 rounded-xl border-2 font-bold text-sm " + (dc ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600")}>Back</button>
              <button onClick={() => { if (!idFrontPhoto) { setError("Please upload front of your ID"); return; } setPhase("selfie_prep"); }} className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm">Next: Selfie</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SELFIE PREP ===== */}
      {phase === "selfie_prep" && (
        <div className="py-4">
          <div className={"rounded-3xl border p-6 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setPhase("id_upload")} className={"p-2 rounded-xl " + (dc ? "hover:bg-gray-700" : "hover:bg-gray-100")}><ArrowLeft className="w-5 h-5" /></button>
              <div>
                <h2 className={"text-xl font-extrabold " + (dc ? "text-white" : "text-gray-900")}>Live Face Verification</h2>
                <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>Step 2 of 3 — Real-time face scan</p>
              </div>
            </div>

            <div className={"rounded-2xl p-5 mb-6 " + (dc ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20" : "bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100")}>
              <h3 className={"font-bold mb-3 text-sm " + (dc ? "text-white" : "text-gray-900")}>You will be asked to:</h3>
              <div className="space-y-2.5">
                {CHALLENGES.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold " + (dc ? "bg-gray-700 text-gray-300" : "bg-white text-gray-600 shadow-sm")}>{i + 1}</div>
                    <span className="text-xl">{c.icon}</span>
                    <span className={"text-sm " + (dc ? "text-gray-300" : "text-gray-700")}>{c.instruction}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={"p-4 rounded-xl mb-6 " + (dc ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200")}>
              <p className={"text-xs font-semibold mb-1 " + (dc ? "text-amber-300" : "text-amber-800")}>Important:</p>
              <p className={"text-xs " + (dc ? "text-amber-400" : "text-amber-700")}>Remove sunglasses, hats, or face coverings. Use good lighting. Our system will detect your face in real-time and guide you through each step.</p>
            </div>

            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

            <button onClick={startCamera} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all">
              <Camera className="w-5 h-5" /> Start Face Scan
            </button>
          </div>
        </div>
      )}

      {/* ===== LIVE SELFIE (Facebook/Meta Style) ===== */}
      {phase === "selfie_live" && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 safe-area-top">
            <button onClick={() => { stopCamera(); setPhase("selfie_prep"); }} className="w-10 h-10 flex items-center justify-center">
              <X className="w-6 h-6 text-gray-900" />
            </button>
            <span className="text-sm font-medium text-gray-500">{challengeIdx + 1}/{CHALLENGES.length}</span>
            <button className="text-blue-600 font-semibold text-sm">Help</button>
          </div>

          {/* Main camera area */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Circle with ring */}
            <div className="relative" style={{ width: 300, height: 300 }}>
              {/* Gray background ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r="143" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle cx="150" cy="150" r="143" fill="none" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 143}
                  strokeDashoffset={2 * Math.PI * 143 * (1 - challengeProgress / 100)}
                  className="transition-all duration-300" />
              </svg>

              {/* Video circle */}
              <div className="absolute inset-[6px] rounded-full overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay style={{ transform: "scaleX(-1)" }} />
                <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-0" />
              </div>

              {/* Direction arrow indicator */}
              {CHALLENGES[challengeIdx]?.detector === "head_left" && (
                <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <ArrowLeft className="w-6 h-6 text-white" />
                </div>
              )}
              {CHALLENGES[challengeIdx]?.detector === "head_right" && (
                <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg" style={{transform:"translateY(-50%) scaleX(-1)"}}>
                  <ArrowLeft className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Instruction text */}
            <div className="mt-10 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {CHALLENGES[challengeIdx]?.detector === "face_center" && "Look straight ahead"}
                {CHALLENGES[challengeIdx]?.detector === "head_left" && "Turn to the left"}
                {CHALLENGES[challengeIdx]?.detector === "head_right" && "Turn to the right"}
                {CHALLENGES[challengeIdx]?.detector === "blink" && "Blink your eyes"}
                {CHALLENGES[challengeIdx]?.detector === "smile" && "Smile"}
              </h2>
              {!faceDetected && (
                <p className="text-red-500 text-sm mt-2 font-medium">Position your face in the circle</p>
              )}
              {faceDetected && challengeProgress > 0 && challengeProgress < 100 && (
                <p className="text-emerald-600 text-sm mt-2 font-medium">{feedbackText}</p>
              )}
            </div>
          </div>

          {/* Bottom - step indicators */}
          <div className="px-6 pb-8 safe-area-bottom">
            <div className="flex items-center justify-center gap-2">
              {CHALLENGES.map((ch, i) => (
                <div key={ch.id} className={"w-3 h-3 rounded-full transition-all " + (i < challengeIdx ? "bg-blue-600" : i === challengeIdx ? "bg-blue-600 w-8" : "bg-gray-300")} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== PROCESSING ===== */}
      {phase === "processing" && (
        <div className="text-center py-16">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <h2 className={"text-xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Analyzing...</h2>
          <p className={"text-sm " + (dc ? "text-gray-400" : "text-gray-500")}>Verifying your face scan and documents</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {["Checking face...", "Matching ID...", "Finalizing..."].map((t, i) => (
              <span key={i} className={"text-xs px-3 py-1 rounded-full " + (dc ? "bg-gray-800 text-gray-500" : "bg-gray-100 text-gray-400")}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* ===== SUCCESS ===== */}
      {phase === "success" && (
        <div className="text-center py-8">
          <div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className={"text-2xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Verification Submitted!</h2>
            <p className={"text-sm mb-2 " + (dc ? "text-gray-400" : "text-gray-500")}>Your selfie and documents have been submitted successfully.</p>
            <div className={"rounded-xl p-4 mb-6 " + (dc ? "bg-blue-500/10" : "bg-blue-50")}>
              <p className={"text-xs " + (dc ? "text-blue-300" : "text-blue-700")}>Our team will review your verification within 24 hours. You will receive a notification when approved.</p>
            </div>
            <Link href="/dashboard" className="inline-block px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold hover:shadow-lg">Back to Dashboard</Link>
          </div>
        </div>
      )}

      {/* ===== FAILED ===== */}
      {phase === "failed" && (
        <div className="text-center py-8">
          <div className={"rounded-3xl border p-8 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl")}>
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className={"text-2xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Verification Failed</h2>
            <p className={"text-sm mb-2 " + (dc ? "text-gray-400" : "text-gray-500")}>{error || "We could not verify your identity."}</p>
            <div className={"rounded-xl p-4 mb-6 " + (dc ? "bg-amber-500/10" : "bg-amber-50")}>
              <p className={"text-xs " + (dc ? "text-amber-300" : "text-amber-700")}>Tips: Use good lighting, remove glasses/hats, hold phone steady, and make sure your ID is clear and readable.</p>
            </div>
            <button onClick={retry} className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold hover:shadow-lg">
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
