"use client";
import { useState, useRef, useEffect } from "react";
import { useUser } from "../layout";
import { Camera, CheckCircle, XCircle, RotateCcw, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { id: 1, instruction: "Look straight at the camera", icon: "👀", duration: 3000 },
  { id: 2, instruction: "Slowly turn your head to the left", icon: "👈", duration: 3000 },
  { id: 3, instruction: "Slowly turn your head to the right", icon: "👉", duration: 3000 },
  { id: 4, instruction: "Blink your eyes twice", icon: "😑", duration: 3000 },
];

export default function VerifyPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<"intro"|"camera"|"verifying"|"success"|"failed">("intro");
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [error, setError] = useState("");

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
        videoRef.current.play().catch(() => {});
      }
      setPhase("camera");
      setCurrentStep(0);
      setProgress(0);
      setCapturedFrames([]);
      startVerification();
    } catch (e) {
      setError("Camera access denied. Please allow camera permission and try again.");
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return "";
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const startVerification = () => {
    let step = 0;
    const frames: string[] = [];
    const runStep = () => {
      if (step >= STEPS.length) {
        setPhase("verifying");
        submitVerification(frames);
        return;
      }
      setCurrentStep(step);
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 100;
        const stepProgress = ((step * STEPS[step].duration) + elapsed) / (STEPS.length * 3000) * 100;
        setProgress(Math.min(stepProgress, 100));
        if (elapsed >= STEPS[step].duration) {
          clearInterval(interval);
          const frame = captureFrame();
          if (frame) frames.push(frame);
          step++;
          runStep();
        }
      }, 100);
    };
    setTimeout(runStep, 1000);
  };

  const submitVerification = async (frames: string[]) => {
    setCapturedFrames(frames);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationPhoto: frames[0] || "", frames: frames.length })
      });
      const data = await res.json();
      if (res.ok) {
        setPhase("success");
        reload();
      } else {
        setPhase("failed");
        setError(data.error || "Verification failed");
      }
    } catch {
      setPhase("failed");
      setError("Network error. Please try again.");
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const retry = () => {
    setPhase("intro");
    setCurrentStep(0);
    setProgress(0);
    setError("");
  };

  useEffect(() => { return () => stopCamera(); }, []);

  if (!user) return null;

  if (user.verified || user.verificationStatus === "approved") {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className={"rounded-3xl border p-8 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
          <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-10 h-10 text-emerald-500" /></div>
          <h2 className={"text-2xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Already Verified!</h2>
          <p className={"text-sm mb-6 " + (dc?"text-gray-400":"text-gray-500")}>Your identity has been verified. You have a verified badge on your profile.</p>
          <Link href="/dashboard/profile" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm">View Profile</Link>
        </div>
      </div>
    );
  }

  if (user.verificationStatus === "pending") {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className={"rounded-3xl border p-8 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
          <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4"><Shield className="w-10 h-10 text-amber-500" /></div>
          <h2 className={"text-2xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Verification Pending</h2>
          <p className={"text-sm mb-6 " + (dc?"text-gray-400":"text-gray-500")}>Your verification is being reviewed by our team. You will be notified once approved.</p>
          <Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <canvas ref={canvasRef} className="hidden" />

      {/* INTRO */}
      {phase === "intro" && (
        <div className="text-center py-8">
          <div className={"rounded-3xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-8">
              <Shield className="w-14 h-14 text-white mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h1>
              <p className="text-blue-100 text-sm">Quick selfie verification to prove you are real</p>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {STEPS.map((step, i) => (
                  <div key={step.id} className={"flex items-center gap-4 p-3 rounded-xl " + (dc?"bg-gray-700":"bg-gray-50")}>
                    <span className="text-2xl">{step.icon}</span>
                    <div className="flex-1 text-left">
                      <p className={"text-sm font-medium " + (dc?"text-white":"text-gray-900")}>Step {step.id}</p>
                      <p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>{step.instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className={"text-xs mb-4 " + (dc?"text-gray-500":"text-gray-400")}>Make sure you are in a well-lit area. Remove sunglasses or hats.</p>
              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <button onClick={startCamera} className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold text-sm hover:shadow-lg flex items-center justify-center gap-2"><Camera className="w-5 h-5" /> Start Verification</button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA - Live verification */}
      {phase === "camera" && (
        <div className="text-center">
          <div className="relative mx-auto" style={{ width: 300, height: 300 }}>
            {/* Circular video frame */}
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-blue-500 relative">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: "scaleX(-1)" }} />
            </div>

            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r="146" fill="none" stroke={dc?"#374151":"#e5e7eb"} strokeWidth="4" />
              <circle cx="150" cy="150" r="146" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 146}
                strokeDashoffset={2 * Math.PI * 146 * (1 - progress / 100)}
                className="transition-all duration-300" />
            </svg>

            {/* Step indicator */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
              Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>

          {/* Current instruction */}
          <div className={"mt-8 p-4 rounded-xl " + (dc?"bg-gray-800":"bg-blue-50")}>
            <span className="text-3xl block mb-2">{STEPS[currentStep]?.icon}</span>
            <p className={"text-lg font-bold " + (dc?"text-white":"text-gray-900")}>{STEPS[currentStep]?.instruction}</p>
            <p className={"text-xs mt-1 " + (dc?"text-gray-400":"text-gray-500")}>Hold still...</p>
          </div>

          {/* Progress bar */}
          <div className={"w-full h-2 rounded-full mt-4 overflow-hidden " + (dc?"bg-gray-700":"bg-gray-200")}>
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: progress + "%" }} />
          </div>
        </div>
      )}

      {/* VERIFYING */}
      {phase === "verifying" && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-6" />
          <h2 className={"text-xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Verifying...</h2>
          <p className={"text-sm " + (dc?"text-gray-400":"text-gray-500")}>Analyzing your selfie for liveness detection</p>
        </div>
      )}

      {/* SUCCESS */}
      {phase === "success" && (
        <div className="text-center py-8">
          <div className={"rounded-3xl border p-8 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
            <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className={"text-2xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Verification Submitted!</h2>
            <p className={"text-sm mb-6 " + (dc?"text-gray-400":"text-gray-500")}>Your selfie has been captured. Our team will review and verify your identity shortly. You will receive a notification when approved.</p>
            <Link href="/dashboard" className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold text-sm hover:shadow-lg">Back to Dashboard</Link>
          </div>
        </div>
      )}

      {/* FAILED */}
      {phase === "failed" && (
        <div className="text-center py-8">
          <div className={"rounded-3xl border p-8 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
            <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className={"text-2xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Verification Failed</h2>
            <p className={"text-sm mb-2 " + (dc?"text-gray-400":"text-gray-500")}>{error || "We could not verify your identity. Please try again."}</p>
            <p className={"text-xs mb-6 " + (dc?"text-gray-500":"text-gray-400")}>Tips: Use good lighting, remove glasses, and look directly at the camera.</p>
            <button onClick={retry} className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm hover:shadow-lg">
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
