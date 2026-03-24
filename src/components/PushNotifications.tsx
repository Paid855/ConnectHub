"use client";
import { useEffect, useRef } from "react";

export default function PushNotifications() {
  const lastCountRef = useRef(0);
  const permissionRef = useRef(false);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        permissionRef.current = true;
      } else if (Notification.permission !== "denied") {
        setTimeout(() => {
          Notification.requestPermission().then(p => {
            permissionRef.current = p === "granted";
          });
        }, 5000);
      }
    }

    // Poll for new notifications
    const checkNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        const unread = (data.notifications || []).filter((n: any) => !n.read).length;

        // Show browser notification for new ones
        if (unread > lastCountRef.current && permissionRef.current && lastCountRef.current > 0) {
          const newest = (data.notifications || []).find((n: any) => !n.read);
          if (newest) {
            try {
              const notif = new Notification("ConnectHub", {
                body: newest.title + ": " + (newest.body || ""),
                icon: "/logo.png",
                badge: "/logo.png",
                tag: newest.id,
                silent: false,
              });
              notif.onclick = () => { window.focus(); notif.close(); };
              setTimeout(() => notif.close(), 8000);
            } catch {}
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
