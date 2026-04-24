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
  Loader2,
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

type ChallengeId = "front" | "left" | "right" | "smile" | "blink";

type SelfieChallenge = {
  id: ChallengeId;
  label: string;
  shortLabel: string;
  helper: string;
  bubble: "none" | "left" | "right";
  icon: string;
};

type CapturedSelfie = {
  pose: ChallengeId;
  label: string;
  image: string;
  capturedAt: string;
  metrics: FaceMetrics;
};

type FacePoint = {
  x: number;
  y: number;
  z?: number;
};

type BlendCategory = {
  categoryName: string;
  score: number;
};

type FaceLandmarkerResult = {
  faceLandmarks?: FacePoint[][];
  faceBlendshapes?: Array<{ categories?: BlendCategory[] }>;
};

type FaceLandmarkerInstance = {
  detectForVideo: (video: HTMLVideoElement, timestampMs: number) => FaceLandmarkerResult;
  close?: () => void;
};

type FaceMetrics = {
  faceCount: number;
  yaw: number;
  centerScore: number;
  smile: number;
  blinkLeft: number;
  blinkRight: number;
  blinkAverage: number;
  eyesOpenScore: number;
};

const VERIFY_ENDPOINT = "/api/auth/verify";

/**
 * If your device/browser detects LEFT and RIGHT backward, change this from 1 to -1.
 * This only affects the liveness challenge interpretation. It does not affect the UI.
 */
const HEAD_TURN_SIGN = 1;

const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

const WASM_ASSET_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";

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
    helper: "Keep your face centered inside the circle. Capture is automatic.",
    bubble: "none",
    icon: "🙂",
  },
  {
    id: "left",
    label: "Turn to the left",
    shortLabel: "Left",
    helper: "Turn only your head to the left. The blue ring fills when the turn is complete.",
    bubble: "left",
    icon: "←",
  },
  {
    id: "right",
    label: "Turn to the right",
    shortLabel: "Right",
    helper: "Turn only your head to the right. Hold still when the blue ring completes.",
    bubble: "right",
    icon: "→",
  },
  {
    id: "smile",
    label: "Smile",
    shortLabel: "Smile",
    helper: "Smile naturally. The photo will be taken automatically.",
    bubble: "none",
    icon: "😊",
  },
  {
    id: "blink",
    label: "Blink your eyes",
    shortLabel: "Blink",
    helper: "Blink both eyes once, then open them. This helps confirm liveness.",
    bubble: "none",
    icon: "😉",
  },
];

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

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

function getBlendScore(categories: BlendCategory[] | undefined, name: string) {
  return categories?.find((item) => item.categoryName === name)?.score || 0;
}

function averagePoint(points: FacePoint[]) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function getMetrics(result: FaceLandmarkerResult): FaceMetrics {
  const landmarks = result.faceLandmarks || [];
  const firstFace = landmarks[0];
  const categories = result.faceBlendshapes?.[0]?.categories;

  if (!firstFace) {
    return {
      faceCount: 0,
      yaw: 0,
      centerScore: 0,
      smile: 0,
      blinkLeft: 0,
      blinkRight: 0,
      blinkAverage: 0,
      eyesOpenScore: 0,
    };
  }

  // MediaPipe face-landmarker indices.
  // 1 = nose tip, 33/263 = outer eye corners, 234/454 = cheek/jaw side points.
  const nose = firstFace[1];
  const leftEyeOuter = firstFace[33];
  const rightEyeOuter = firstFace[263];
  const leftSide = firstFace[234];
  const rightSide = firstFace[454];

  let yaw = 0;
  let centerScore = 0;

  if (nose && leftEyeOuter && rightEyeOuter && leftSide && rightSide) {
    const eyeCenter = averagePoint([leftEyeOuter, rightEyeOuter]);
    const faceCenter = averagePoint([leftSide, rightSide]);
    const faceWidth = Math.max(0.001, Math.abs(rightSide.x - leftSide.x));

    // Negative = left challenge, positive = right challenge. Flip HEAD_TURN_SIGN if needed.
    yaw = ((nose.x - eyeCenter.x) / faceWidth) * HEAD_TURN_SIGN;

    const horizontalCenter = 1 - Math.abs(faceCenter.x - 0.5) / 0.18;
    const verticalCenter = 1 - Math.abs(faceCenter.y - 0.5) / 0.22;
    centerScore = clamp(Math.min(horizontalCenter, verticalCenter));
  }

  const blinkLeft = getBlendScore(categories, "eyeBlinkLeft");
  const blinkRight = getBlendScore(categories, "eyeBlinkRight");
  const blinkAverage = (blinkLeft + blinkRight) / 2;

  const smile = Math.max(
    getBlendScore(categories, "mouthSmileLeft"),
    getBlendScore(categories, "mouthSmileRight"),
    (getBlendScore(categories, "mouthSmileLeft") + getBlendScore(categories, "mouthSmileRight")) / 2
  );

  return {
    faceCount: landmarks.length,
    yaw,
    centerScore,
    smile,
    blinkLeft,
    blinkRight,
    blinkAverage,
    eyesOpenScore: clamp(1 - blinkAverage / 0.45),
  };
}

function getChallengeProgress(
  challengeId: ChallengeId,
  metrics: FaceMetrics,
  blinkClosedSeen: boolean
) {
  if (metrics.faceCount !== 1) return 0;

  switch (challengeId) {
    case "front": {
      const yawScore = 1 - Math.abs(metrics.yaw) / 0.12;
      return clamp(Math.min(yawScore, metrics.centerScore, metrics.eyesOpenScore));
    }

    case "left":
      return clamp((-metrics.yaw - 0.1) / 0.12);

    case "right":
      return clamp((metrics.yaw - 0.1) / 0.12);

    case "smile":
      return clamp((metrics.smile - 0.35) / 0.25);

    case "blink": {
      if (!blinkClosedSeen) {
        return clamp((metrics.blinkAverage - 0.45) / 0.25);
      }

      // After eyes close, wait for eyes open before capturing.
      return clamp((metrics.eyesOpenScore - 0.65) / 0.25);
    }

    default:
      return 0;
  }
}

function getScanText(
  challengeId: ChallengeId,
  progress: number,
  metrics: FaceMetrics,
  modelReady: boolean,
  blinkClosedSeen: boolean
) {
  if (!modelReady) return "Loading face detector...";
  if (metrics.faceCount === 0) return "Place your face inside the circle";
  if (metrics.faceCount > 1) return "Only one face should be visible";
  if (challengeId === "blink" && blinkClosedSeen) return "Good. Open your eyes";
  if (progress >= 1) return "Hold still...";
  return "Scanning...";
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

function CameraProgressRing({ progress }: { progress: number }) {
  const radius = 156;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamp(progress));

  return (
    <svg
      className="absolute -inset-5 h-[calc(100%+40px)] w-[calc(100%+40px)] rotate-[-90deg]"
      viewBox="0 0 360 360"
      aria-hidden="true"
    >
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
        className="text-blue-600 transition-all duration-150"
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
  const landmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const rafRef = useRef<number | null>(null);
  const readySinceRef = useRef<number | null>(null);
  const blinkClosedSeenRef = useRef(false);
  const capturingRef = useRef(false);
  const stepRef = useRef(0);
  const photosRef = useRef<CapturedSelfie[]>([]);
  const lastMetricsRef = useRef<FaceMetrics>({
    faceCount: 0,
    yaw: 0,
    centerScore: 0,
    smile: 0,
    blinkLeft: 0,
    blinkRight: 0,
    blinkAverage: 0,
    eyesOpenScore: 0,
  });

  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<CapturedSelfie[]>([]);
  const [cameraError, setCameraError] = useState("");
  const [flash, setFlash] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<FaceMetrics>(lastMetricsRef.current);
  const [blinkClosedSeen, setBlinkClosedSeen] = useState(false);
  const [capturedToast, setCapturedToast] = useState(false);

  const currentChallenge = SELFIE_CHALLENGES[step];
  const scanText = getScanText(
    currentChallenge.id,
    progress,
    metrics,
    modelReady,
    blinkClosedSeen
  );

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const closeCamera = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    landmarkerRef.current?.close?.();
    landmarkerRef.current = null;

    stopStream(streamRef.current);
    streamRef.current = null;
  }, []);

  const captureFrame = useCallback(
    (challengeIndex: number) => {
      if (capturingRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const challenge = SELFIE_CHALLENGES[challengeIndex];

      if (!video || !canvas || !challenge || video.videoWidth === 0 || video.videoHeight === 0) {
        setCameraError("Camera is still loading. Please try again.");
        return;
      }

      capturingRef.current = true;
      readySinceRef.current = null;

      const size = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;

      canvas.width = 720;
      canvas.height = 720;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setCameraError("Could not capture selfie.");
        capturingRef.current = false;
        return;
      }

      ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);

      const image = canvas.toDataURL("image/jpeg", 0.78);
      const frame: CapturedSelfie = {
        pose: challenge.id,
        label: challenge.shortLabel,
        image,
        capturedAt: new Date().toISOString(),
        metrics: lastMetricsRef.current,
      };

      const nextPhotos = [...photosRef.current, frame];
      photosRef.current = nextPhotos;
      setPhotos(nextPhotos);

      setFlash(true);
      setCapturedToast(true);
      window.setTimeout(() => setFlash(false), 140);
      window.setTimeout(() => setCapturedToast(false), 600);

      if (challengeIndex + 1 >= SELFIE_CHALLENGES.length) {
        closeCamera();
        window.setTimeout(() => onDone(nextPhotos), 350);
        return;
      }

      blinkClosedSeenRef.current = false;
      setBlinkClosedSeen(false);
      setProgress(0);

      window.setTimeout(() => {
        setStep(challengeIndex + 1);
        capturingRef.current = false;
      }, 650);
    },
    [closeCamera, onDone]
  );

  useEffect(() => {
    let mounted = true;

    async function start() {
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

        const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(WASM_ASSET_PATH);
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_PATH,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 2,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
        });

        if (!mounted) {
          landmarker.close?.();
          return;
        }

        landmarkerRef.current = landmarker as FaceLandmarkerInstance;
        setModelReady(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not open camera.";
        setCameraError(message);
      }
    }

    start();

    return () => {
      mounted = false;
      closeCamera();
    };
  }, [closeCamera]);

  useEffect(() => {
    let lastUiUpdate = 0;

    function scanLoop(now: number) {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !landmarker || video.videoWidth === 0 || video.videoHeight === 0) {
        rafRef.current = window.requestAnimationFrame(scanLoop);
        return;
      }

      const result = landmarker.detectForVideo(video, now);
      const nextMetrics = getMetrics(result);
      lastMetricsRef.current = nextMetrics;

      const activeStep = stepRef.current;
      const activeChallenge = SELFIE_CHALLENGES[activeStep];

      if (activeChallenge.id === "blink" && nextMetrics.blinkAverage > 0.62) {
        blinkClosedSeenRef.current = true;
      }

      const nextProgress = getChallengeProgress(
        activeChallenge.id,
        nextMetrics,
        blinkClosedSeenRef.current
      );

      if (now - lastUiUpdate > 80) {
        lastUiUpdate = now;
        setMetrics(nextMetrics);
        setProgress(nextProgress);
        setBlinkClosedSeen(blinkClosedSeenRef.current);
      }

      const complete = nextProgress >= 1;

      if (!complete || capturingRef.current) {
        readySinceRef.current = null;
      } else if (readySinceRef.current === null) {
        readySinceRef.current = now;
      } else if (now - readySinceRef.current >= 550) {
        captureFrame(activeStep);
      }

      rafRef.current = window.requestAnimationFrame(scanLoop);
    }

    rafRef.current = window.requestAnimationFrame(scanLoop);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [captureFrame]);

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
          <p>
            Use good light, remove sunglasses or face coverings, and keep only your face inside the circle.
            The app captures automatically when the blue ring is complete.
          </p>
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-start px-5 pt-8">
        <div className="mb-8 w-full max-w-sm">
          <StepDots current={step} total={SELFIE_CHALLENGES.length} />
        </div>

        <div className="relative h-[min(78vw,350px)] w-[min(78vw,350px)]">
          <CameraProgressRing progress={progress} />
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

            {!cameraError && !modelReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-full bg-black/35 text-white">
                <Loader2 className="h-10 w-10 animate-spin" />
                <span className="text-sm font-bold">Preparing detector</span>
              </div>
            )}

            {capturedToast && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
                <div className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg">
                  Captured
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 text-center">
          <div className="mb-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            {currentChallenge.label}
          </div>
          <p className="mx-auto max-w-xs text-sm font-medium text-gray-500">
            {currentChallenge.helper}
          </p>
        </div>

        <div className="mt-7 w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-sm font-black text-gray-900">
            {modelReady && metrics.faceCount === 1 && progress >= 1 ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : modelReady ? (
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            )}
            {scanText}
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] font-medium text-gray-500">
            Step {step + 1} of {SELFIE_CHALLENGES.length}. No capture button needed.
          </p>
        </div>

        <button
          type="button"
          onClick={cancel}
          className="mt-5 h-12 w-full max-w-sm rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-700 shadow-sm"
        >
          Cancel
        </button>
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
      setErr("Please complete all live selfie liveness steps.");
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

          // New structured payload for admin review and liveness audit.
          verificationMode: "auto_live_selfie_liveness_v3",
          verificationStatus: "pending",
          sessionId,
          selfieFrames: selfies,
          liveness: {
            requiredChallenges: SELFIE_CHALLENGES.map((challenge) => challenge.id),
            completedChallenges: selfies.map((photo) => photo.pose),
            challengeCount: SELFIE_CHALLENGES.length,
            submittedAt: new Date().toISOString(),
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
            note:
              "Client-side liveness check captured front, left, right, smile, and blink challenges automatically.",
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
              <p className="mt-1 text-sm text-blue-100">Complete ID upload and automatic live selfie checks.</p>
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
                  "Complete automatic liveness checks: front, left, right, smile, and blink.",
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
              <h2 className={cx("text-xl font-bold", dc ? "text-white" : "text-gray-900")}>Automatic Live Selfie</h2>
            </div>

            <div className={cx("mb-6 rounded-2xl p-5", dc ? "bg-blue-500/10" : "bg-blue-50")}>
              <p className={cx("mb-3 text-sm font-bold", dc ? "text-white" : "text-gray-900")}>The system will auto-capture these checks:</p>
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
                The blue ring fills as the face movement is detected. When it reaches 100%, the app captures automatically and moves to the next instruction.
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
            <p className={cx("mb-5 text-sm", dc ? "text-gray-400" : "text-gray-500")}>Check the ID and automatic live selfie frames before submitting.</p>

            <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
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
                This submits your ID document, automatic selfie frames, and liveness metadata to the admin verification queue.
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
            <p className={cx("mb-6 text-sm", dc ? "text-gray-400" : "text-gray-500")}>Admin can now review your ID and automatic live selfie frames.</p>
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
