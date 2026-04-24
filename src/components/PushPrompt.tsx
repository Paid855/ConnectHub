"use client";
import { useState, useEffect } from "react";
import { Bell, X, Heart, Sparkles } from "lucide-react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function PushPrompt() {
  const [show, setShow] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !VAPID_PUBLIC) return;
    if (Notification.permission === "granted") { autoSubscribe(); return; }
    if (Notification.permission === "denied") return;

    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem("ch-push-dismissed");
      if (!dismissed) { setShow(true); setAnimating(true); }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  async function autoSubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
      }
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
    } catch (e) {
      console.error("[Push]", e);
    }
  }

  async function handleEnable() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await autoSubscribe();
        setAnimating(false);
        setTimeout(() => setShow(false), 300);
      } else {
        handleDismiss();
      }
    } catch { handleDismiss(); }
  }

  function handleDismiss() {
    setAnimating(false);
    setTimeout(() => setShow(false), 300);
    sessionStorage.setItem("ch-push-dismissed", "1");
  }

  if (!show) return null;

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] w-[92%] max-w-sm transition-all duration-500 ${animating ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
      <div className="relative bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden">
        {/* Decorative top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-pink-500 to-rose-400" />

        <div className="p-5">
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            {/* Animated icon */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center animate-pulse">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-1.5">
                Stay in the loop <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">
                Get instant alerts for new messages, matches & likes — even when you&apos;re away.
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 mt-4">
            <button
              onClick={handleEnable}
              className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" /> Enable Notifications
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-gray-400 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
