"use client";
import { useEffect, useRef } from "react";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function PushNotifications() {
  const lastCountRef = useRef(0);
  const subscribedRef = useRef(false);

  useEffect(() => {
    const setupPush = async () => {
      // 1. Check browser support
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

      // 2. Request permission (with slight delay so page loads first)
      let permission = Notification.permission;
      if (permission === "default") {
        await new Promise(r => setTimeout(r, 5000));
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") return;

      // 3. Register service worker and subscribe to push
      try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription && VAPID_KEY) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
          });
        }

        // 4. Send subscription to server
        if (subscription && !subscribedRef.current) {
          subscribedRef.current = true;
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription: subscription.toJSON() }),
          });
        }
      } catch (e) {
        console.log("[Push] Subscription failed:", e);
      }
    };

    setupPush();

    // Also poll for in-app notifications (backup for when push doesn't work)
    const checkNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        const unread = (data.notifications || []).filter((n: any) => !n.read).length;

        // Show browser notification for new ones (fallback when service worker push isn't available)
        if (unread > lastCountRef.current && lastCountRef.current > 0 && Notification.permission === "granted") {
          const newest = (data.notifications || []).find((n: any) => !n.read);
          if (newest) {
            try {
              const reg = await navigator.serviceWorker.ready;
              reg.showNotification("ConnectHub", {
                body: newest.title + ": " + (newest.body || ""),
                icon: "/logo.png",
                badge: "/logo.png",
                tag: newest.id,
                data: { url: "/dashboard/notifications" },
                vibrate: [200, 100, 200],
              });
            } catch {
              // Fallback to basic notification
              try {
                const notif = new Notification("ConnectHub", {
                  body: newest.title + ": " + (newest.body || ""),
                  icon: "/logo.png",
                  tag: newest.id,
                });
                notif.onclick = () => { window.focus(); notif.close(); };
                setTimeout(() => notif.close(), 8000);
              } catch {}
            }
          }
        }
        lastCountRef.current = unread;
      } catch {}
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
