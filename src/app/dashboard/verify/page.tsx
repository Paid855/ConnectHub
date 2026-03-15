"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useUser } from "../layout";
import { Shield, Camera, Check, Video, Star, Users, X, AlertCircle, ChevronRight, Upload, FileText, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const POSES = [
  { id:"center", label:"Look Straight", instruction:"Look directly at the camera", emoji:"😐", delay:4 },
  { id:"left", label:"Turn Left", instruction:"Slowly turn your head LEFT", emoji:"👈", delay:4 },
  { id:"right", label:"Turn Right", instruction:"Now turn your head RIGHT", emoji:"👉", delay:4 },
];

export default function VerifyPage() {
  const { user, reload } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const [retrying, setRetrying] = useState(false);

  const getInitialStep = () => {
    if (user?.tier === "verified") return "verified" as const;
    if (user?.verificationStatus === "pending") return "pending" as const;
    if (user?.verificationStatus === "rejected") return "rejected" as const;
    return "check" as const;
  };

  const [step, setStep] = useState<"check"|"info"|"camera"|"id"|"review"|"pending"|"verified"|"rejected">(getInitialStep());
  const [poseIndex, setPoseIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [idPhoto, setIdPhoto] = useState<string|null>(null);
  const [cameraError, setCameraError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState<number|null>(null);
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const hasProfilePhoto = !!user?.profilePhoto;

  const startCamera = useCallback(async () => {
    setCameraError(""); setCameraReady(false); setPhotos([]); setPoseIndex(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user", width:{ideal:640}, height:{ideal:480} }, audio:false });
      streamRef.current = stream;
      setStep("camera");
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.play().then(() => { setCameraReady(true); setAutoCountdown(POSES[0].delay); }).catch(() => setCameraError("Camera failed. Try Chrome."));
        }
      }, 300);
    } catch (err:any) {
      setCameraError(err.name === "NotAllowedError" ? "Camera denied. Allow in browser settings." : "Camera error: " + err.message);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraReady(false); setAutoCountdown(null);
  }, []);

  useEffect(() => {
    if (autoCountdown === null || !cameraReady || step !== "camera") return;
    if (autoCountdown === 0) {
      if (videoRef.current && canvasRef.current) {
        setCapturing(true);
        const v = videoRef.current, c = canvasRef.current;
        c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.drawImage(v, 0, 0, c.width, c.height);
          setFlash(true);
          setTimeout(() => { setFlash(false); setCapturing(false); }, 300);
          const newPhotos = [...photos, c.toDataURL("image/jpeg", 0.7)];
          setPhotos(newPhotos);
          if (poseIndex < POSES.length - 1) {
            const next = poseIndex + 1;
            setPoseIndex(next);
            setTimeout(() => setAutoCountdown(POSES[next].delay), 800);
          } else { stopCamera(); setStep("id"); }
        }
      }
      setAutoCountdown(null); return;
    }
    const t = setTimeout(() => setAutoCountdown(c => c !== null ? c - 1 : null), 1000);
    return () => clearTimeout(t);
  }, [autoCountdown, cameraReady, step, photos, poseIndex, stopCamera]);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { alert("Max 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setIdPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (photos.length !== 3 || !idPhoto) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: JSON.stringify(photos), idDocument: idPhoto })
      });
      const data = await res.json();
      if (res.ok) { setStep("pending"); setRetrying(false); reload(); }
      else alert(data.error || "Failed");
    } catch {} finally { setSubmitting(false); }
  };

  const handleTryAgain = () => {
    setRetrying(true);
    setPhotos([]);
    setIdPhoto(null);
    setPoseIndex(0);
    setStep("check");
  };

  if (!user) return null;

  // VERIFIED
  if (user.tier === "verified" && !retrying) return (
    <div className="text-center py-16 max-w-md mx-auto">
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",damping:10}}>
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200"><Shield className="w-12 h-12 text-white fill-white/20" /></div>
      </motion.div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">Verified!</h2>
      <p className="text-gray-500 mb-6">Your identity has been confirmed by our team.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200 px-5 py-2.5 rounded-full text-sm font-bold"><Shield className="w-4 h-4 fill-blue-100" /> Verified Account</span>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-200 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-rose-100">Start Matching</Link>
      </div>
    </div>
  );

  // PENDING
  if ((user.verificationStatus === "pending" && !retrying) || step === "pending") return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5"><Clock className="w-10 h-10 text-amber-500" /></div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Under Review</h2>
      <p className="text-gray-500 mb-6">Our security team is reviewing your face scan and ID document. This usually takes 24-48 hours.</p>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left mb-6">
        <h4 className="text-sm font-bold text-amber-800 mb-3">What happens next:</h4>
        <div className="space-y-2.5">
          <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-amber-700 text-xs font-bold">1</span></div><p className="text-sm text-amber-700">Admin compares your <strong>profile photo</strong> with your <strong>face scan</strong></p></div>
          <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-amber-700 text-xs font-bold">2</span></div><p className="text-sm text-amber-700">Admin verifies your <strong>ID document</strong> matches your name</p></div>
          <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-amber-700 text-xs font-bold">3</span></div><p className="text-sm text-amber-700">If everything matches, your account gets the <strong>verified badge</strong></p></div>
        </div>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left"><p className="text-xs text-red-700"><strong>Warning:</strong> Submitting fake documents or someone else identity will result in permanent account ban.</p></div>
    </div>
  );

  // REJECTED
  if (user.verificationStatus === "rejected" && !retrying) return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5"><X className="w-10 h-10 text-red-500" /></div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Rejected</h2>
      <p className="text-gray-500 mb-6">Your verification was not approved. This could be because the photos were unclear, the ID did not match, or the face scan did not show proper head turns.</p>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"><p className="text-sm text-blue-700">You can try again with clearer photos and a valid ID.</p></div>
      <button onClick={handleTryAgain} className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all">Try Again</button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
        <p className="text-sm text-gray-500">Live face scan + ID — reviewed by our security team</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon:Shield, title:"Verified Badge", desc:"Blue shield on profile", color:"text-blue-500" },
          { icon:Star, title:"Priority Matching", desc:"Appear higher in search", color:"text-amber-500" },
          { icon:Users, title:"Trust Boost", desc:"Higher compatibility", color:"text-emerald-500" },
          { icon:Video, title:"Video Dates", desc:"Unlock video calls", color:"text-purple-500" },
        ].map((b,i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4"><b.icon className={`w-5 h-5 ${b.color} mb-2`} /><h4 className="text-sm font-bold text-gray-900">{b.title}</h4><p className="text-xs text-gray-500">{b.desc}</p></div>
        ))}
      </div>

      {/* CHECK */}
      {step === "check" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Requirements</h3>
          <div className="space-y-3 mb-6">
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${hasProfilePhoto?"bg-emerald-50 border-emerald-200":"bg-red-50 border-red-200"}`}>
              {hasProfilePhoto?<Check className="w-5 h-5 text-emerald-500"/>:<X className="w-5 h-5 text-red-400"/>}
              <div className="flex-1"><p className={`text-sm font-bold ${hasProfilePhoto?"text-emerald-800":"text-red-800"}`}>Profile Photo</p><p className={`text-xs ${hasProfilePhoto?"text-emerald-600":"text-red-600"}`}>{hasProfilePhoto?"Ready":"Required first"}</p></div>
              {!hasProfilePhoto&&<Link href="/dashboard/profile" className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold">Upload</Link>}
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border bg-blue-50 border-blue-200"><Camera className="w-5 h-5 text-blue-500"/><div><p className="text-sm font-bold text-blue-800">Live Face Scan (3 poses)</p><p className="text-xs text-blue-600">Center → Left → Right — auto-captured</p></div></div>
            <div className="flex items-center gap-3 p-4 rounded-xl border bg-purple-50 border-purple-200"><FileText className="w-5 h-5 text-purple-500"/><div><p className="text-sm font-bold text-purple-800">ID Document</p><p className="text-xs text-purple-600">National ID, passport, or driver license</p></div></div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"><p className="text-sm text-amber-800"><strong>How it works:</strong> After submission, our security team compares your profile photo, face scan, and ID. If they all match, you get verified. Fake submissions = permanent ban.</p></div>
          <button onClick={()=>hasProfilePhoto?setStep("info"):null} disabled={!hasProfilePhoto} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-40">{hasProfilePhoto?"Start Verification":"Upload Profile Photo First"}</button>
        </div>
      )}

      {/* INFO */}
      {step === "info" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mx-auto mb-4"><Camera className="w-10 h-10 text-rose-500" /></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Live Face Scan</h3>
          <p className="text-sm text-gray-500 mb-6">Camera auto-captures — just follow the prompts!</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            {POSES.map((p,i) => <div key={i} className="flex items-center gap-2"><div className="flex flex-col items-center"><div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-1">{p.emoji}</div><span className="text-[10px] font-bold text-gray-500 uppercase">{p.label}</span></div>{i<POSES.length-1&&<ChevronRight className="w-4 h-4 text-gray-300 mt-[-16px]"/>}</div>)}
          </div>
          <button onClick={startCamera} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"><Camera className="w-5 h-5"/> Start Live Scan</button>
          {cameraError&&<div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mt-4">{cameraError}</div>}
        </div>
      )}

      {/* CAMERA */}
      {step === "camera" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3"><span className={`w-2.5 h-2.5 rounded-full ${cameraReady?"bg-red-500 animate-pulse":"bg-yellow-500"}`}/><span className="text-white text-xs font-bold">{cameraReady?"LIVE SCANNING":"STARTING..."}</span></div>
            <div className="flex gap-1.5">{POSES.map((_,i)=><div key={i} className={`w-8 h-1.5 rounded-full ${i<photos.length?"bg-emerald-400":i===poseIndex?"bg-rose-400 animate-pulse":"bg-gray-600"}`}/>)}</div>
            <span className="text-white/60 text-xs">{photos.length}/3</span>
          </div>
          <div className="relative bg-black" style={{minHeight:380}}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full min-h-[380px] object-cover" style={{transform:"scaleX(-1)"}}/>
            <AnimatePresence>{flash&&<motion.div initial={{opacity:1}} animate={{opacity:0}} transition={{duration:0.3}} className="absolute inset-0 bg-white z-20"/>}</AnimatePresence>
            {!cameraReady&&<div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3"/><p className="text-white/70 text-sm">Starting camera...</p></div></div>}
            {cameraReady&&autoCountdown!==null&&autoCountdown>0&&(
              <div className="absolute top-4 right-4 z-10"><div className="relative w-16 h-16"><svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4"/><circle cx="30" cy="30" r="26" fill="none" stroke="#f43f5e" strokeWidth="4" strokeDasharray={`${(autoCountdown/POSES[poseIndex].delay)*163.36} 163.36`} strokeLinecap="round"/></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-white text-lg font-bold">{autoCountdown}</span></div></div></div>
            )}
            {cameraReady&&!capturing&&(
              <motion.div key={poseIndex} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6">
                <div className="flex items-center gap-4">
                  {POSES[poseIndex].id==="left"&&<motion.span animate={{x:[-10,10,-10]}} transition={{repeat:Infinity,duration:1.2}} className="text-4xl">👈</motion.span>}
                  <div className="flex-1 text-center"><p className="text-white font-bold text-xl mb-1">{POSES[poseIndex].instruction}</p><p className="text-white/50 text-sm">Auto-capturing — hold still</p></div>
                  {POSES[poseIndex].id==="right"&&<motion.span animate={{x:[10,-10,10]}} transition={{repeat:Infinity,duration:1.2}} className="text-4xl">👉</motion.span>}
                </div>
              </motion.div>
            )}
            {capturing&&<div className="absolute inset-0 flex items-center justify-center z-10"><motion.div initial={{scale:0.5}} animate={{scale:1}} className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3"><span className="text-white font-bold text-lg">Captured!</span></motion.div></div>}
            {cameraReady&&!capturing&&<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-48 h-60 border-2 border-dashed border-white/25 rounded-[50%]"/></div>}
            {photos.length>0&&<div className="absolute top-4 left-4 flex gap-2 z-10">{photos.map((p,i)=><div key={i} className="relative"><img src={p} className="w-11 h-11 rounded-lg object-cover border-2 border-emerald-400" style={{transform:"scaleX(-1)"}}/><div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white"/></div></div>)}</div>}
          </div>
          <div className="p-4 text-center"><button onClick={()=>{stopCamera();setStep("info");setPhotos([]);setPoseIndex(0);}} className="px-5 py-2 border-2 border-gray-200 rounded-full text-sm font-semibold text-gray-600"><X className="w-4 h-4 inline mr-1"/> Cancel</button></div>
        </div>
      )}

      {/* ID UPLOAD */}
      {step === "id" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3"><FileText className="w-7 h-7 text-purple-500"/></div>
            <h3 className="text-lg font-bold text-gray-900">Upload ID Document</h3>
            <p className="text-sm text-gray-500">Government-issued ID to complete verification</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
            <p className="text-xs font-bold text-blue-800 mb-2">Accepted:</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-blue-700"><span className="flex items-center gap-1"><Check className="w-3 h-3"/> National ID</span><span className="flex items-center gap-1"><Check className="w-3 h-3"/> Passport</span><span className="flex items-center gap-1"><Check className="w-3 h-3"/> Driver License</span></div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5"><p className="text-xs text-red-700"><strong>Warning:</strong> Do not upload fake or altered documents. Using someone else ID will result in a permanent ban.</p></div>
          {idPhoto ? (
            <div className="mb-5"><div className="relative rounded-xl overflow-hidden border-2 border-purple-200"><img src={idPhoto} alt="ID" className="w-full h-48 object-cover"/><div className="absolute top-3 left-3 bg-purple-500/90 rounded-full px-3 py-1"><span className="text-white text-xs font-bold">ID Document</span></div></div><button onClick={()=>{setIdPhoto(null);if(idInputRef.current)idInputRef.current.value="";}} className="mt-2 text-sm text-rose-500 font-semibold hover:underline">Remove</button></div>
          ) : (
            <div onClick={()=>idInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-all mb-5"><Upload className="w-10 h-10 text-gray-300 mx-auto mb-3"/><p className="text-sm font-semibold text-gray-700 mb-1">Click to upload</p><p className="text-xs text-gray-400">JPG, PNG — Max 5MB</p></div>
          )}
          <input ref={idInputRef} type="file" accept="image/*" onChange={handleIdUpload} className="hidden"/>
          <div className="mb-5"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Face Scan Complete</p><div className="flex gap-2">{photos.map((p,i)=><div key={i} className="relative flex-1"><img src={p} className="w-full h-20 object-cover rounded-lg border border-emerald-200" style={{transform:"scaleX(-1)"}}/><span className="absolute bottom-1 left-1 bg-black/60 rounded text-[8px] text-white font-bold px-1.5 py-0.5">{POSES[i].label}</span></div>)}</div></div>
          <div className="flex gap-3">
            <button onClick={()=>{setPhotos([]);setIdPhoto(null);setPoseIndex(0);startCamera();}} className="flex-1 py-3 border-2 border-gray-200 rounded-full font-semibold text-gray-600">Retake</button>
            <button onClick={()=>setStep("review")} disabled={!idPhoto} className="flex-[2] py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-40">Review</button>
          </div>
        </div>
      )}

      {/* REVIEW */}
      {step === "review" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="text-center mb-5"><h3 className="text-lg font-bold text-gray-900">Review Submission</h3><p className="text-sm text-gray-500">Check everything before submitting</p></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Face Scan (3 poses)</p>
          <div className="grid grid-cols-3 gap-2 mb-5">{photos.map((p,i)=><div key={i} className="relative"><img src={p} className="w-full h-28 object-cover rounded-xl border-2 border-emerald-200" style={{transform:"scaleX(-1)"}}/><div className="absolute bottom-2 left-2 right-2 bg-black/60 rounded-lg px-2 py-1 text-center"><span className="text-white text-[10px] font-bold">{POSES[i].label}</span></div></div>)}</div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ID Document</p>
          {idPhoto&&<img src={idPhoto} className="w-full h-36 object-cover rounded-xl border-2 border-purple-200 mb-5"/>}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5"><p className="text-sm text-amber-800"><strong>Review time:</strong> Our admin team reviews within 24-48 hours. You will see your status update here.</p></div>
          <div className="flex gap-3">
            <button onClick={()=>{setPhotos([]);setIdPhoto(null);setPoseIndex(0);startCamera();}} className="flex-1 py-3 border-2 border-gray-200 rounded-full font-semibold text-gray-600">Start Over</button>
            <button onClick={submit} disabled={submitting} className="flex-[2] py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Submitting...</>:<><Shield className="w-5 h-5"/> Submit for Review</>}
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden"/>
      {!["camera","verified","pending"].includes(step) && user.tier !== "verified" && (
        <div className="mt-6 flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100"><div><p className="text-xs text-gray-400">Current</p><span className="inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gray-200 text-gray-600">Basic</span></div><p className="text-xs text-gray-400">Admin reviews in 24-48hrs</p></div>
      )}
    </div>
  );
}
