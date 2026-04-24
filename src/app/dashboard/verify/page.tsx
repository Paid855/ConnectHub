"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CameraOff,
  Check,
  CheckCircle,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Shield,
  Sparkles,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useUser } from "../layout";

type Phase =
  | "intro"
  | "ids"
  | "idu"
  | "prep"
  | "cam"
  | "review"
  | "wait"
  | "ok"
  | "fail";

type IDTypeValue =
  | "passport"
  | "national_id"
  | "drivers_license"
  | "voters_card"
  | "residence_permit"
  | "military_id";

type IDOption = {
  v: IDTypeValue;
  l: string;
  i: string;
};

type SelfieChallenge = {
  id: "front" | "left" | "right";
  label: string;
  shortLabel: string;
  helper: string;
  bubble: "none" | "left" | "right";
  icon: string;
};

type CapturedSelfie = {
  pose: SelfieChallenge["id"];
  label: string;
  image: string;
  capturedAt: string;
};

const VERIFY_ENDPOINT = "/api/auth/verify";

const IDS: IDOption[] = [
  { v: "passport", l: "International Passport", i: "🛂" },
  { v: "national_id", l: "National ID Card", i: "🪪" },
  { v: "drivers_license", l: "Driver License", i: "🚗" },
  { v: "voters_card", l: "Voter Card", i: "🗳️" },
  { v: "residence_permit", l: "Residence Permit", i: "🏠" },
  { v: "military_id", l: "Military ID", i: "🎖️" },
];

const SELFIE_CHALLENGES: SelfieChallenge[] = [
  {
    id: "front",
    label: "Look straight",
    shortLabel: "Front",
    helper: "Keep your face centered inside the circle.",
    bubble: "none",
    icon: "🙂",
  },
  {
    id: "left",
    label: "Turn to the left",
    shortLabel: "Left",
    helper: "Turn your head left, not your whole phone.",
    bubble: "left",
    icon: "←",
  },
  {
    id: "right",
    label: "Turn to the right",
    shortLabel: "Right",
    helper: "Turn your head right and hold still.",
    bubble: "right",
    icon: "→",
  },
];

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function compressImageFile(file: File, maxSide = 1000, quality = 0.72) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload a valid image file.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image is too large. Maximum size is 10MB.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not read this image."));
      image.src = objectUrl;
    });

    let { width, height } = img;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process this image.");

    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={cx(
            "h-2 rounded-full transition-all",
            index < current && "w-6 bg-emerald-500",
            index === current && "w-8 bg-blue-600",
            index > current && "w-2 bg-gray-300"
          )}
        />
      ))}
    </div>
  );
}

function CameraProgressRing({ current, total }: { current: number; total: number }) {
  const radius = 156;
  const circumference = 2 * Math.PI * radius;
  const progress = (current + 1) / total;
  const offset = circumference * (1 - progress);

  return (
    <svg className="absolute -inset-5 h-[calc(100%+40px)] w-[calc(100%+40px)] rotate-[-90deg]" viewBox="0 0 360 360">
      <circle
        cx="180"
        cy="180"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        className="text-gray-300"
      />
      <circle
        cx="180"
        cy="180"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-blue-600 transition-all duration-500"
      />
    </svg>
  );
}

function DirectionBubble({ side }: { side: SelfieChallenge["bubble"] }) {
  if (side === "none") return null;

  const isLeft = side === "left";

  return (
    <div
      className={cx(
        "absolute top-1/2 z-30 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl ring-4 ring-white",
        isLeft ? "-left-9" : "-right-9"
      )}
      aria-hidden="true"
    >
      {isLeft ? <ArrowLeft className="h-9 w-9" /> : <ArrowLeft className="h-9 w-9 rotate-180" />}
    </div>
  );
}

function LiveSelfieCapture({
  onDone,
  onCancel,
}: {
  onDone: (photos: CapturedSelfie[]) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<CapturedSelfie[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [flash, setFlash] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const currentChallenge = SELFIE_CHALLENGES[step];
  const busy = countdown !== null;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const closeCamera = useCallback(() => {
    clearTimer();
    stopStream(streamRef.current);
    streamRef.current = null;
  }, [clearTimer]);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera is not available in this browser.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 960 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (!mounted) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not open camera.";
        setCameraError(message);
      }
    }

    startCamera();

    return () => {
      mounted = false;
      closeCamera();
    };
  }, [closeCamera]);

  const captureCurrentFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera is still loading. Please try again.");
      return;
    }

    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    canvas.width = 720;
    canvas.height = 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Could not capture selfie.");
      return;
    }

    ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/jpeg", 0.78);
    const frame: CapturedSelfie = {
      pose: currentChallenge.id,
      label: currentChallenge.shortLabel,
      image,
      capturedAt: new Date().toISOString(),
    };

    setFlash(true);
    window.setTimeout(() => setFlash(false), 160);

    const nextPhotos = [...photos, frame];
    setPhotos(nextPhotos);

    if (step + 1 >= SELFIE_CHALLENGES.length) {
      closeCamera();
      window.setTimeout(() => onDone(nextPhotos), 200);
      return;
    }

    setStep((value) => value + 1);
  }, [closeCamera, currentChallenge.id, currentChallenge.shortLabel, onDone, photos, step]);

  const startCountdown = useCallback(() => {
    if (busy || cameraError) return;

    let next = 3;
    setCountdown(next);
    clearTimer();

    timerRef.current = window.setInterval(() => {
      next -= 1;

      if (next > 0) {
        setCountdown(next);
        return;
      }

      clearTimer();
      setCountdown(null);
      captureCurrentFrame();
    }, 800);
  }, [busy, cameraError, captureCurrentFrame, clearTimer]);

  const cancel = () => {
    closeCamera();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white text-gray-950">
      <canvas ref={canvasRef} className="hidden" />

      {flash && <div className="pointer-events-none absolute inset-0 z-50 bg-white" />}

      <div className="flex items-center justify-between px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={cancel}
          className="flex h-11 w-11 items-center justify-center rounded-full text-gray-950 transition hover:bg-gray-100"
          aria-label="Close selfie verification"
        >
          <X className="h-7 w-7" />
        </button>

        <button
          type="button"
          onClick={() => setHelpOpen((value) => !value)}
          className="text-lg font-bold underline underline-offset-4"
        >
          Help
        </button>
      </div>

      {helpOpen && (
        <div className="mx-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
          <div className="mb-2 flex items-center gap-2 font-bold">
            <HelpCircle className="h-4 w-4" /> Selfie tips
          </div>
          <p>Use good light, remove sunglasses or face coverings, and keep only your face inside the circle.</p>
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-start px-5 pt-8">
        <div className="mb-8 w-full max-w-sm">
          <StepDots current={step} total={SELFIE_CHALLENGES.length} />
        </div>

        <div className="relative h-[min(78vw,350px)] w-[min(78vw,350px)]">
          <CameraProgressRing current={step} total={SELFIE_CHALLENGES.length} />
          <DirectionBubble side={currentChallenge.bubble} />

          <div className="absolute inset-0 overflow-hidden rounded-full bg-gray-200 ring-[10px] ring-white">
            {cameraError ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center text-gray-700">
                <CameraOff className="h-12 w-12" />
                <p className="text-sm font-semibold">{cameraError}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                muted
                playsInline
                style={{ transform: "scaleX(-1)" }}
              />
            )}

            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
                <span className="text-7xl font-black text-white drop-shadow-lg">{countdown}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 text-center">
          <div className="mb-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            {currentChallenge.label}
          </div>
          <p className="mx-auto max-w-xs text-sm font-medium text-gray-500">{currentChallenge.helper}</p>
        </div>

        <div className="mt-8 flex w-full max-w-sm items-center gap-3">
          <button
            type="button"
            onClick={cancel}
            className="h-14 flex-1 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-700 shadow-sm"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={startCountdown}
            disabled={busy || !!cameraError}
            className="h-14 flex-[1.5] rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Hold still..." : "Capture"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;

  const [phase, setPhase] = useState<Phase>("intro");
  const [idType, setIdType] = useState<IDTypeValue | "">("");
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [selfies, setSelfies] = useState<CapturedSelfie[]>([]);
  const [err, setErr] = useState("");

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const selectedIDLabel = useMemo(
    () => IDS.find((item) => item.v === idType)?.l || "Government ID",
    [idType]
  );

  const resetAll = () => {
    setPhase("intro");
    setErr("");
    setIdType("");
    setIdFront(null);
    setIdBack(null);
    setSelfies([]);
  };

  const uploadId = async (event: ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setErr("");
      const image = await compressImageFile(file);
      if (side === "front") setIdFront(image);
      else setIdBack(image);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not upload this ID image.");
    } finally {
      event.target.value = "";
    }
  };

  const submit = async () => {
    if (!idType) {
      setErr("Please select your ID type.");
      setPhase("ids");
      return;
    }

    if (!idFront) {
      setErr("Please upload the front of your ID.");
      setPhase("idu");
      return;
    }

    if (selfies.length !== SELFIE_CHALLENGES.length) {
      setErr("Please complete the live selfie steps.");
      setPhase("prep");
      return;
    }

    setPhase("wait");
    setErr("");

    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      const response = await fetch(VERIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idType,
          idTypeLabel: selectedIDLabel,
          idDocument: idFront,
          idDocumentBack: idBack || "",

          // Backward-compatible fields for your old API/admin portal.
          verificationPhoto: selfies[0]?.image || "",
          frames: selfies.length,
          challenges: SELFIE_CHALLENGES.map((challenge) => challenge.id),

          // New structured live-selfie payload for admin review.
          verificationMode: "live_selfie_challenge_v2",
          verificationStatus: "pending",
          sessionId,
          selfieFrames: selfies,
          liveness: {
            requiredChallenges: SELFIE_CHALLENGES.map((challenge) => challenge.id),
            completedChallenges: selfies.map((photo) => photo.pose),
            submittedAt: new Date().toISOString(),
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          },
        }),
      });

      let data: { error?: string } = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error || "Verification submission failed.");
      }

      setPhase("ok");
      await reload?.();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Connection error. Please try again.");
      setPhase("fail");
    }
  };

  if (!user) return null;

  if (user.verified || user.verificationStatus === "approved") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className={cx("rounded-3xl border p-8", dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white shadow-xl")}>
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h2 className={cx("mb-2 text-2xl font-bold", dc ? "text-white" : "text-gray-900")}>Verified</h2>
          <p className={cx("mb-6 text-sm", dc ? "text-gray-400" : "text-gray-500")}>Your identity is confirmed.</p>
          <Link href="/dashboard/profile" className="inline-block rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white">
            View Profile
          </Link>
        </div>
      </div>
    );
  }

  if (user.verificationStatus === "pending") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className={cx("rounded-3xl border p-8", dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white shadow-xl")}>
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <h2 className={cx("mb-2 text-2xl font-bold", dc ? "text-white" : "text-gray-900")}>Under Review</h2>
          <p className={cx("mb-6 text-sm", dc ? "text-gray-400" : "text-gray-500")}>Your verification is waiting for admin approval.</p>
          <Link href="/dashboard" className="inline-block rounded-full bg-rose-500 px-6 py-3 text-sm font-bold text-white">
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {phase === "cam" && (
        <LiveSelfieCapture
          onDone={(captured) => {
            setSelfies(captured);
            setPhase("review");
          }}
          onCancel={() => setPhase("prep")}
        />
      )}

      {phase === "intro" && (
        <div className="py-4">
          <div className={cx("overflow-hidden rounded-3xl border", dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white shadow-xl")}>
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-center">
              <Shield className="mx-auto mb-3 h-12 w-12 text-white" />
              <h1 className="text-2xl font-bold text-white">Verify Your Identity</h1>
              <p className="mt-1 text-sm text-blue-100">Complete ID upload and live selfie checks.</p>
            </div>

            <div className="space-y-4 p-6">
              <div className={cx("rounded-xl border p-4", dc ? "border-emerald-500/20 bg-emerald-500/10" : "border-emerald-100 bg-emerald-50")}>
                <p className={cx("flex items-center gap-2 text-xs font-medium", dc ? "text-emerald-400" : "text-emerald-700")}>
                  <Sparkles className="h-4 w-4" /> Verified profiles help reduce fake accounts and romance scams.
                </p>
              </div>

              <div className={cx("space-y-3 rounded-xl p-4", dc ? "bg-gray-700/50" : "bg-gray-50")}>
                <p className={cx("text-sm font-semibold", dc ? "text-white" : "text-gray-900")}>How verification works</p>
                {[
                  "Select and upload a government ID.",
                  "Take live selfies: front, left, and right.",
                  "Admin reviews the submitted evidence in the admin portal.",
                ].map((text, index) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className={cx("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", dc ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700")}>
                      {index + 1}
                    </div>
                    <span className={cx("text-sm", dc ? "text-gray-300" : "text-gray-600")}>{text}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setPhase("ids")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 py-4 font-bold text-white"
              >
                Begin Verification <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "ids" && (
        <div className="py-4">
          <div className={cx("rounded-3xl border p-6", dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white shadow-xl")}>
            <div className="mb-6 flex items-center gap-3">
              <button type="button" onClick={() => setPhase("intro")} className="rounded-full p-2 hover:bg-gray-100/10">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className={cx("text-xl font-bold", dc ? "text-white" : "text-gray-900")}>Select ID Type</h2>
            </div>

            <div className="space-y-2">
              {IDS.map((item) => (
                <button
                  key={item.v}
                  type="button"
                  onClick={() => {
                    setIdType(item.v);
                    setErr("");
                    setPhase("idu");
                  }}
                  className={cx(
                    "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                    dc
                      ? "border-gray-700 hover:border-blue-500 hover:bg-gray-700"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  )}
                >
                  <span className="text-2xl">{item.i}</span>
                  <span className={cx("text-sm font-semibold", dc ? "text-white" : "text-gray-900")}>{item.l}</span>
                  <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "idu" && (
        <div className="py-4">
          <div className={cx("rounded-3xl border p-6", dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white shadow-xl")}>
            <div className="mb-6 flex items-center gap-3">
              <button type="button" onClick={() => setPhase("ids")} className="rounded-full p-2 hover:bg-gray-100/10">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className={cx("text-xl font-bold", dc ? "text-white" : "text-gray-900")}>Upload ID</h2>
                <p className={cx("text-xs", dc ? "text-gray-400" : "text-gray-500")}>{selectedIDLabel}</p>
              </div>
            </div>

            {err && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
              </div>
            )}

            <input ref={frontInputRef} type="file" accept="image/*" capture="environment" onChange={(event) => uploadId(event, "front")} className="hidden" />
            <input ref={backInputRef} type="file" accept="image/*" capture="environment" onChange={(event) => uploadId(event, "back")} className="hidden" />

            <p className={cx("mb-2 text-sm font-semibold", dc ? "text-gray-300" : "text-gray-700")}>Front of ID *</p>
            {idFront ? (
              <div className="relative mb-4">
                <img src={idFront} className="max-h-56 w-full rounded-2xl border object-cover" alt="Front of ID" />
                <button
                  type="button"
                  onClick={() => setIdFront(null)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white"
                  aria-label="Remove front ID"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => frontInputRef.current?.click()}
                className={cx(
                  "mb-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed py-10 transition-colors",
                  dc ? "border-gray-600 text-gray-400 hover:border-blue-500" : "border-gray-200 text-gray-400 hover:border-blue-400"
                )}
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm font-semibold">Tap to upload front</span>
              </button>
            )}

            <p className={cx("mb-2 text-sm font-semibold", dc ? "text-gray-300" : "text-gray-700")}>Back of ID</p>
            {idBack ? (
              <div className="relative mb-4">
                <img src={idBack} className="max-h-56 w-full rounded-2xl border object-cover" alt="Back of ID" />
                <button
                  type="button"
                  onClick={() => setIdBack(null)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white"
                  aria-label="Remove back ID"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => backInputRef.current?.click()}
                className={cx(
                  "mb-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed py-8 transition-colors",
                  dc ? "border-gray-600 text-gray-500 hover:border-blue-500" : "border-gray-200 text-gray-400 hover:border-blue-400"
                )}
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs font-medium">Upload back if available</span>
              </button>
            )}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setPhase("ids")}
                className={cx("flex-1 rounded-xl border-2 py-3 text-sm font-bold", dc ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600")}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!idFront) {
                    setErr("Please upload the front of your ID.");
                    return;
                  }
                  setErr("");
                  setPhase("prep");
                }}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white"
              >
                Next: Selfie
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "prep" && (
        <div className="py-4">
          <div className={cx("rounded-3xl border p-6", dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white shadow-xl")}>
            <div className="mb-6 flex items-center gap-3">
              <button type="button" onClick={() => setPhase("idu")} className="rounded-full p-2 hover:bg-gray-100/10">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className={cx("text-xl font-bold", dc ? "text-white" : "text-gray-900")}>Live Selfie Verification</h2>
            </div>

            <div className={cx("mb-6 rounded-2xl p-5", dc ? "bg-blue-500/10" : "bg-blue-50")}>
              <p className={cx("mb-3 text-sm font-bold", dc ? "text-white" : "text-gray-900")}>You will complete 3 live poses:</p>
              <div className="space-y-3">
                {SELFIE_CHALLENGES.map((challenge) => (
                  <div key={challenge.id} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-blue-600 shadow-sm">
                      {challenge.icon}
                    </span>
                    <span className={cx("text-sm", dc ? "text-gray-300" : "text-gray-700")}>{challenge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cx("mb-6 rounded-xl border p-4", dc ? "border-amber-500/20 bg-amber-500/10" : "border-amber-100 bg-amber-50")}>
              <p className={cx("text-xs", dc ? "text-amber-400" : "text-amber-700")}>
                The camera screen will show a circular guide and movement prompts. Use good lighting and keep your face visible.
              </p>
            </div>

            {err && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{err}</div>}

            <button
              type="button"
              onClick={() => {
                setSelfies([]);
                setErr("");
                setPhase("cam");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 py-4 font-bold text-white"
            >
              <Camera className="h-5 w-5" /> Open Camera
            </button>
          </div>
        </div>
      )}

      {phase === "review" && (
        <div className="py-4">
          <div className={cx("rounded-3xl border p-6", dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white shadow-xl")}>
            <h2 className={cx("mb-2 text-xl font-bold", dc ? "text-white" : "text-gray-900")}>Review Verification</h2>
            <p className={cx("mb-5 text-sm", dc ? "text-gray-400" : "text-gray-500")}>Check the ID and live selfie frames before submitting.</p>

            <div className="mb-5 grid grid-cols-3 gap-3">
              {selfies.map((photo) => (
                <div key={`${photo.pose}-${photo.capturedAt}`} className="text-center">
                  <img src={photo.image} className="aspect-square w-full rounded-xl border object-cover" alt={`${photo.label} selfie`} />
                  <p className={cx("mt-1 text-xs font-semibold", dc ? "text-gray-400" : "text-gray-500")}>{photo.label}</p>
                </div>
              ))}
            </div>

            <div className={cx("mb-6 rounded-2xl border p-4", dc ? "border-gray-700 bg-gray-700/40" : "border-gray-100 bg-gray-50")}>
              <div className="mb-2 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className={cx("text-sm font-bold", dc ? "text-white" : "text-gray-900")}>Ready for admin review</span>
              </div>
              <p className={cx("text-xs", dc ? "text-gray-400" : "text-gray-500")}>
                This will submit your ID document and selfie frames to the admin verification queue.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelfies([]);
                  setPhase("cam");
                }}
                className={cx("flex-1 rounded-xl border-2 py-3 text-sm font-bold", dc ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600")}
              >
                <RotateCcw className="mr-1 inline h-4 w-4" /> Retake
              </button>
              <button type="button" onClick={submit} className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "wait" && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <h2 className={cx("mb-2 text-xl font-bold", dc ? "text-white" : "text-gray-900")}>Submitting...</h2>
          <p className={cx("text-sm", dc ? "text-gray-400" : "text-gray-500")}>Sending verification to admin review.</p>
        </div>
      )}

      {phase === "ok" && (
        <div className="py-8 text-center">
          <div className={cx("rounded-3xl border p-8", dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white shadow-xl")}>
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
            <h2 className={cx("mb-2 text-2xl font-bold", dc ? "text-white" : "text-gray-900")}>Submitted</h2>
            <p className={cx("mb-6 text-sm", dc ? "text-gray-400" : "text-gray-500")}>Admin can now review your ID and live selfie frames.</p>
            <Link href="/dashboard" className="inline-block rounded-full bg-emerald-500 px-8 py-3 font-bold text-white">
              Dashboard
            </Link>
          </div>
        </div>
      )}

      {phase === "fail" && (
        <div className="py-8 text-center">
          <div className={cx("rounded-3xl border p-8", dc ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white shadow-xl")}>
            <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className={cx("mb-2 text-2xl font-bold", dc ? "text-white" : "text-gray-900")}>Submission Failed</h2>
            <p className={cx("mb-6 text-sm", dc ? "text-gray-400" : "text-gray-500")}>{err || "Something went wrong."}</p>
            <button type="button" onClick={resetAll} className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-8 py-3 font-bold text-white">
              <RotateCcw className="h-4 w-4" /> Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
